// Hundred Ghosts - the human play loop for one stage, as a pure function of the recorded inputs.
// The game uses it to play, and the score server uses the same code to replay a run and check its time.
// One input code for each tick: bits 0-1 = direction + 1 (0 left, 1 none, 2 right), bit 2 = jump held, bit 3 = restart.
(function (root) {
'use strict';
const RESPAWN = 45, MAX_TICKS = 36000; // 10 minutes for one stage
function newRun(sim, stage) { const st = sim.STAGES[stage]; return { stage, st, p: sim.newPlayer(st), t: 0, respawn: 0, deaths: 0, done: false, frames: 0 }; }
// returns: 1 = died on this tick, 2 = reached the goal, 4 = new player placed, 0 = nothing
function tick(sim, run, code) {
  if (run.done) return 0;
  if (run.respawn > 0) { run.t++; if (--run.respawn === 0) { run.p = sim.newPlayer(run.st); return 4; } return 0; }
  if (code & 8) { run.p = sim.newPlayer(run.st); return 4; }
  sim.step(run.st, run.p, (code & 3) - 1, !!(code & 4), run.t, run.t);
  let ev = 0;
  if (!run.p.alive) { run.deaths++; run.respawn = RESPAWN; ev = 1; }
  else if (run.p.done) { run.done = true; run.frames = run.t; ev = 2; }
  run.t++;
  return ev;
}
function replay(sim, stage, codes) {
  const run = newRun(sim, stage); const n = Math.min(codes.length, MAX_TICKS);
  for (let i = 0; i < n && !run.done; i++) tick(sim, run, codes[i] & 15);
  return { done: run.done, frames: run.frames, deaths: run.deaths };
}
// run-length encoding: pairs of (code, count 1..255), then base64
function encode(codes) {
  const out = []; for (let i = 0; i < codes.length;) { let j = i; while (j < codes.length && codes[j] === codes[i] && j - i < 255) j++; out.push(codes[i], j - i); i = j; }
  let s = ''; for (const b of out) s += String.fromCharCode(b);
  return typeof btoa === 'function' ? btoa(s) : Buffer.from(s, 'binary').toString('base64');
}
function decode(b64) {
  const s = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary'); const codes = [];
  for (let i = 0; i + 1 < s.length; i += 2) { const c = s.charCodeAt(i), n = s.charCodeAt(i + 1); for (let k = 0; k < n; k++) codes.push(c); if (codes.length > MAX_TICKS) break; }
  return codes;
}
const API = { RESPAWN, MAX_TICKS, newRun, tick, replay, encode, decode };
root.HGPlay = API; if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
