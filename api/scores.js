// Leaderboard API for Hundred Ghosts (Vercel function, storage: Vercel Blob, private store).
//   GET  /api/scores          -> { version, scores: [{ name, frames, deaths, kind, ts }] }  (fastest first)
//   POST /api/scores  { name, version, stages: [8 x base64 input recordings], key? }
// A score is never taken from the client. The server replays the recorded inputs with the same
// simulation (sim.js + play.js) and stores the time that the replay gives.
// One blob for each score; all fields are in the pathname, so a listing is the leaderboard:
//   scores/v<version>/<frames 7 digits>_<deaths 3 digits>_<kind>_<name>_<timestamp>.json
// kind: h = human run, b = bot run (name starts with "ghost"), p = par time set by the owner (not a played run).
const { put, list, del } = require('@vercel/blob');
const SIM = require('../sim.js');
const PLAY = require('../play.js');

const NAME_RE = /^[A-Za-z0-9-]{1,12}$/;
const RESERVED = /^(alex|ghost)/i;          // these names need the owner key
const prefix = () => `scores/v${SIM.VERSION}/`;
let cache = { at: 0, data: null };

function parse(pathname) {
  const m = /\/(\d{7})_(\d{3})_([hbp])_([A-Za-z0-9-]{1,12})_(\d+)\.json$/.exec(pathname);
  return m && { frames: +m[1], deaths: +m[2], kind: m[3], name: m[4], ts: +m[5], pathname };
}
async function all() {
  const out = []; let cursor;
  for (let page = 0; page < 20; page++) { const r = await list({ prefix: prefix(), limit: 1000, cursor }); for (const b of r.blobs) { const s = parse(b.pathname); if (s) out.push(s); } if (!r.hasMore) break; cursor = r.cursor; }
  out.sort((a, b) => a.frames - b.frames || a.deaths - b.deaths || a.ts - b.ts);
  return out;
}
async function board() {
  if (cache.data && Date.now() - cache.at < 8000) return cache.data;
  const rows = await all(), best = new Map();      // one row for each name and kind: the best one
  for (const r of rows) { const k = r.kind + ':' + r.name.toLowerCase(); if (!best.has(k)) best.set(k, r); }
  cache = { at: Date.now(), data: [...best.values()].slice(0, 50).map(({ pathname, ...r }) => r) };
  return cache.data;
}
const save = (frames, deaths, kind, name) => put(`${prefix()}${String(frames).padStart(7, '0')}_${String(Math.min(deaths, 999)).padStart(3, '0')}_${kind}_${name}_${Date.now()}.json`,
  JSON.stringify({ name, frames, deaths, kind, version: SIM.VERSION }), { access: 'private', contentType: 'application/json', addRandomSuffix: false });

module.exports = async (req, res) => {
  res.setHeader('cache-control', 'no-store');
  try {
    if (req.method === 'GET') return res.status(200).json({ version: SIM.VERSION, scores: await board() });
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const name = String(b.name || '').trim();
    if (!NAME_RE.test(name)) return res.status(400).json({ error: 'name: 1 to 12 letters, digits or -' });
    const owner = !!process.env.OWNER_KEY && b.key === process.env.OWNER_KEY;
    if (RESERVED.test(name) && !owner) return res.status(403).json({ error: 'that name is reserved' });
    if (+b.version !== SIM.VERSION) return res.status(409).json({ error: 'the game has a new version; reload the page' });

    if (owner && b.par) {                         // owner only: a target time, shown with a PAR badge
      const frames = Math.round(+b.par.frames); if (!(frames > 0 && frames < 1e7)) return res.status(400).json({ error: 'par frames' });
      for (const r of await all()) if (r.kind === 'p' && r.name.toLowerCase() === name.toLowerCase()) await del(r.pathname);
      await save(frames, 0, 'p', name); cache.at = 0; return res.status(200).json({ ok: true, kind: 'p', frames });
    }

    if (!Array.isArray(b.stages) || b.stages.length !== SIM.STAGES.length) return res.status(400).json({ error: 'a run has all stages, in order' });
    let frames = 0, deaths = 0;
    for (let i = 0; i < b.stages.length; i++) {
      if (typeof b.stages[i] !== 'string' || b.stages[i].length > 120000) return res.status(400).json({ error: 'recording ' + (i + 1) });
      const r = PLAY.replay(SIM, i, PLAY.decode(b.stages[i]));
      if (!r.done) return res.status(422).json({ error: 'the replay of stage ' + (i + 1) + ' does not reach the goal' });
      frames += r.frames; deaths += r.deaths;
    }
    const kind = /^ghost/i.test(name) ? 'b' : 'h';
    if (kind === 'h' && owner) for (const r of await all()) if (r.kind === 'p' && r.name.toLowerCase() === name.toLowerCase()) await del(r.pathname); // a real run replaces the par time
    await save(frames, deaths, kind, name); cache.at = 0;
    const rows = await board(); const rank = rows.findIndex(r => r.name.toLowerCase() === name.toLowerCase() && r.kind === kind) + 1;
    return res.status(200).json({ ok: true, frames, deaths, kind, rank, scores: rows });
  } catch (e) { return res.status(500).json({ error: 'server', detail: String(e && e.message || e).slice(0, 200) }); }
};
