// Leaderboard API for Hundred Ghosts (Vercel function, storage: Vercel Blob, private store).
//   GET  /api/scores -> { version, scores: [...], stages: [[...] x number of stages], perfect, perfectStages }   (fastest first)
//   POST /api/scores  { name, version, stages: [one base64 input recording for each stage], key? }   a full run
//   POST /api/scores  { name, version, stage: i, rec: base64 input recording, key? }                 one stage
// A time is never taken from the client. The server replays the recorded inputs with the same
// simulation (sim.js + play.js) and stores the time that the replay gives.
// One blob for each stored time; all fields are in the pathname, so a listing is the leaderboard:
//   scores/v<version>/<frames 7 digits>_<deaths 3 digits>_<kind>_<name>_<timestamp>.json            full runs
//   stages/v<version>/s<stage>/<frames 6 digits>_<deaths 3 digits>_<kind>_<name>_<timestamp>.json   one stage
// kind: h = a person's run; b = a seeded run by a scripted bot of ordinary skill (shown with a GHOST badge, ranked);
//       x = the best bot run, kept as the "perfect time" reference (not ranked). Kinds b and x need the owner key.
// For each name and kind, only the best time is kept (per board).
const { put, list, del } = require('@vercel/blob');
const SIM = require('../sim.js');
const PLAY = require('../play.js');
const crypto = require('crypto');
const { isBadName } = require('../lib/names.js');

const NAME_RE = /^[A-Za-z0-9-]{1,12}$/;
const RESERVED = /^(alex|ghost)/i;          // these names need the owner key
const NST = SIM.STAGES.length;
const runPrefix = () => `scores/v${SIM.VERSION}/`, stagePrefix = () => `stages/v${SIM.VERSION}/`;
let cache = { at: 0, data: null };
const same = (r, name, kind) => r.kind === kind && r.name.toLowerCase() === name.toLowerCase();
const order = (a, b) => a.frames - b.frames || a.deaths - b.deaths || a.ts - b.ts;   // a tie goes to the earlier run

// Rate limit: 30 submissions in 10 minutes and 300 in 24 hours for each visitor. One small marker file for each
// attempt, under a hash of the address (the address itself is not stored), so the limit holds across server instances.
const LIMIT_10MIN = 30, LIMIT_DAY = 300;   // the game saves each best stage time by itself, so one full run can be 9 requests
async function rateLimited(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const id = crypto.createHash('sha256').update(ip + '|' + (process.env.OWNER_KEY || 'hg')).digest('hex').slice(0, 20), now = Date.now();
  const r = await list({ prefix: `rl/${id}/`, limit: 200 }); let recent = 0, day = 0; const old = [];
  for (const b of r.blobs) { const ts = +(/\/(\d+)\.txt$/.exec(b.pathname) || [])[1] || 0; if (now - ts < 600000) recent++; if (now - ts < 86400000) day++; else old.push(b.url); }
  if (old.length) del(old.slice(0, 50)).catch(() => {});
  if (recent >= LIMIT_10MIN || day >= LIMIT_DAY) return true;
  await put(`rl/${id}/${now}.txt`, '1', { access: 'private', contentType: 'text/plain', addRandomSuffix: false });
  return false;
}

async function listAll(prefix, parse) {
  const out = []; let cursor;
  for (let page = 0; page < 20; page++) { const r = await list({ prefix, limit: 1000, cursor }); for (const b of r.blobs) { const s = parse(b.pathname); if (s) out.push(s); } if (!r.hasMore) break; cursor = r.cursor; }
  return out.sort(order);
}
const parseRun = p => { const m = /\/(\d{7})_(\d{3})_([hbx])_([A-Za-z0-9-]{1,12})_(\d+)\.json$/.exec(p); return m && { frames: +m[1], deaths: +m[2], kind: m[3], name: m[4], ts: +m[5], pathname: p }; };
const parseStage = p => { const m = /\/s(\d+)\/(\d{6})_(\d{3})_([hbx])_([A-Za-z0-9-]{1,12})_(\d+)\.json$/.exec(p); return m && +m[1] < NST && { stage: +m[1], frames: +m[2], deaths: +m[3], kind: m[4], name: m[5], ts: +m[6], pathname: p }; };
const allRuns = () => listAll(runPrefix(), parseRun), allStages = () => listAll(stagePrefix(), parseStage);
function best(rows, max) { // one row for each name and kind (the best), bad names hidden
  const seen = new Set(), out = [];
  for (const r of rows) { if (r.kind === 'x') continue; const k = r.kind + ':' + r.name.toLowerCase(); if (seen.has(k)) continue; seen.add(k); if (r.kind === 'h' && isBadName(r.name)) continue; const { pathname, stage, ...pub } = r; out.push(pub); if (out.length >= max) break; }
  return out;
}
async function boards() {
  if (cache.data && Date.now() - cache.at < 8000) return cache.data;
  const [runs, st] = await Promise.all([allRuns(), allStages()]);
  const stages = []; for (let i = 0; i < NST; i++) stages.push(best(st.filter(r => r.stage === i), 8));
  const px = rows => { const x = rows.find(r => r.kind === 'x'); return x ? x.frames : null; };   // rows are sorted, so the first is the best
  cache = { at: Date.now(), data: { scores: best(runs, 50), stages, perfect: px(runs), perfectStages: stages.map((_, i) => px(st.filter(r => r.stage === i))) } };
  return cache.data;
}
const blob = { access: 'private', contentType: 'application/json', addRandomSuffix: false };
const pad = (n, w) => String(n).padStart(w, '0');
// keep the new time only if it is better than the stored time of this name; then remove the older ones
async function keepBest(existing, pathname, frames, body) {
  if (existing.length && frames >= existing[0].frames) return false;
  await put(pathname, JSON.stringify(body), blob); await Promise.all(existing.map(r => del(r.pathname).catch(() => {}))); return true;
}
const saveRun = (rows, frames, deaths, kind, name) => keepBest(rows.filter(r => same(r, name, kind)), `${runPrefix()}${pad(frames, 7)}_${pad(Math.min(deaths, 999), 3)}_${kind}_${name}_${Date.now()}.json`, frames, { name, frames, deaths, kind, version: SIM.VERSION });
const saveStage = (rows, stage, frames, deaths, kind, name) => keepBest(rows.filter(r => r.stage === stage && same(r, name, kind)), `${stagePrefix()}s${stage}/${pad(frames, 6)}_${pad(Math.min(deaths, 999), 3)}_${kind}_${name}_${Date.now()}.json`, frames, { name, stage, frames, deaths, kind, version: SIM.VERSION });
function replayOne(i, rec) {
  if (typeof rec !== 'string' || rec.length > 120000) return null;
  const r = PLAY.replay(SIM, i, PLAY.decode(rec)); return r.done ? r : null;
}

module.exports = async (req, res) => {
  res.setHeader('cache-control', 'no-store');
  try {
    if (req.method === 'GET') return res.status(200).json({ version: SIM.VERSION, ...(await boards()) });
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const name = String(b.name || '').trim();
    if (!NAME_RE.test(name)) return res.status(400).json({ error: 'name: 1 to 12 letters, digits or -' });
    const owner = !!process.env.OWNER_KEY && b.key === process.env.OWNER_KEY;
    if (RESERVED.test(name) && !owner) return res.status(403).json({ error: 'that name is reserved' });
    if (!owner && isBadName(name)) return res.status(400).json({ error: 'choose a different name' });
    if (+b.version !== SIM.VERSION) return res.status(409).json({ error: 'the game has a new version; reload the page' });
    if (!owner && await rateLimited(req)) return res.status(429).json({ error: 'too many tries; wait 10 minutes' });
    const kind = owner && b.perfect ? 'x' : owner && b.bot ? 'b' : 'h';

    const per = [];                               // [stage index, replay result]
    if (Array.isArray(b.stages)) {                // a full run
      if (b.stages.length !== NST) return res.status(400).json({ error: 'a run has all stages, in order' });
      for (let i = 0; i < NST; i++) { const r = replayOne(i, b.stages[i]); if (!r) return res.status(422).json({ error: 'the replay of stage ' + (i + 1) + ' does not reach the goal' }); per.push([i, r]); }
    } else {                                      // one stage
      const i = Math.floor(+b.stage); if (!(i >= 0 && i < NST)) return res.status(400).json({ error: 'stage' });
      const r = replayOne(i, b.rec); if (!r) return res.status(422).json({ error: 'the replay of stage ' + (i + 1) + ' does not reach the goal' }); per.push([i, r]);
    }
    const full = per.length === NST, frames = per.reduce((a, p) => a + p[1].frames, 0), deaths = per.reduce((a, p) => a + p[1].deaths, 0);
    const [runs, st] = await Promise.all([full ? allRuns() : [], allStages()]);
    if (full) await saveRun(runs, frames, deaths, kind, name);
    if (!(owner && b.noStages)) await Promise.all(per.map(([i, r]) => saveStage(st, i, r.frames, r.deaths, kind, name)));   // noStages: a seeded full run that must not set stage times
    cache.at = 0; const data = await boards();
    const rank = full ? data.scores.findIndex(r => same(r, name, kind)) + 1 : 0;
    // stages where this run is now the record (the first row of that stage's list)
    const records = kind === 'x' ? [] : per.filter(([i, r]) => { const top = data.stages[i][0]; return top && same(top, name, kind) && top.frames === r.frames; }).map(p => p[0]);
    return res.status(200).json({ ok: true, full, frames, deaths, kind, rank, records, perStage: per.map(([i, r]) => ({ stage: i, frames: r.frames, deaths: r.deaths })), ...data });
  } catch (e) { return res.status(500).json({ error: 'server', detail: String(e && e.message || e).slice(0, 200) }); }
};
