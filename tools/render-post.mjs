// Renders post.html frame by frame to an MP4 (needs ffmpeg). usage: node tools/render-post.mjs [out.mp4] [query]
import { chromium } from 'playwright'; import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { execFileSync } from 'node:child_process'; import { fileURLToPath } from 'node:url'; import { serve } from './serve.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const out = path.resolve(ROOT, process.argv[2] || 'video/hundred-ghosts-post.mp4'), q = process.argv[3] || '';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hgpost-')); fs.mkdirSync(path.dirname(out), { recursive: true });
const s = await serve(); const br = await chromium.launch(); const pg = await br.newPage({ viewport: { width: 1080, height: 1080 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.goto(`${s.url}/post.html?capture=1${q ? '&' + q : ''}`); await pg.waitForFunction(() => window.__ready);
const { total, fps } = await pg.evaluate(() => ({ total: __post.total, fps: __post.fps })); const el = pg.locator('canvas');
for (let f = 0; f < total; f++) { await pg.evaluate(f => __post.frame(f), f); await el.screenshot({ path: path.join(tmp, String(f).padStart(5, '0') + '.png') }); if (f % 150 === 0) console.log('frame', f, '/', total); }
await br.close(); s.srv.close();
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(tmp, '%05d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', out]);
for (const k of [40, 110, 170, 250, 340, 620, 760, 880, 990]) if (k < total) fs.copyFileSync(path.join(tmp, String(k).padStart(5, '0') + '.png'), path.join(path.dirname(out), `frame-${k}.png`));
fs.rmSync(tmp, { recursive: true }); console.log('wrote', path.relative(ROOT, out), (total / fps).toFixed(1) + ' s', total, 'frames', 'errors', errs.length, errs[0] || '');
