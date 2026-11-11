// dev helper: screenshots of viewer.html at given seconds. usage: node tools/vshot.mjs outPrefix 5 20 45
import { chromium } from 'playwright'; import { serve } from './serve.mjs';
const [out, ...secs] = process.argv.slice(2); const s = await serve(); const br = await chromium.launch(); const pg = await br.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message)); await pg.goto(s.url + '/viewer.html'); let t = 0;
for (const x of secs) { await pg.waitForTimeout((+x - t) * 1000); t = +x; await pg.screenshot({ path: `${out}-${x}.png` }); console.log(x, JSON.stringify(await pg.evaluate(() => window.__viewer))); }
console.log(errs.join('|')); await br.close(); s.srv.close();
