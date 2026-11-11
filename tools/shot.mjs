// dev helper: node tools/shot.mjs "<query>" out.png [waitMs] [w] [h]
import { chromium } from 'playwright'; import { serve } from './serve.mjs';
const [q, out, wait = '1500', w = '960', h = '540'] = process.argv.slice(2);
const s = await serve(); const br = await chromium.launch(); const pg = await br.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await pg.goto(s.url + '/' + q); await pg.waitForTimeout(+wait); await pg.screenshot({ path: out });
console.log(JSON.stringify(await pg.evaluate(() => ({ over: __hg.over, stage: __hg.stage, n: __hg.frameMs.length, med: __hg.frameMs.slice().sort((a, b) => a - b)[__hg.frameMs.length >> 1] }))), errs.join(' | '));
await br.close(); s.srv.close();
