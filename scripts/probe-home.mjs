import { chromium } from 'playwright';
const SCRATCH = process.env.SCRATCH;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
const reqs = {};
p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 140)));
p.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message.slice(0, 140)));
p.on('request', (r) => { const u = new URL(r.url()); const k = u.pathname.slice(0, 60); reqs[k] = (reqs[k] ?? 0) + 1; });
console.log('goto…');
try {
  await p.goto('http://localhost:3010', { waitUntil: 'commit', timeout: 60000 });
  console.log('committed');
} catch (e) { console.log('goto failed:', e.message.slice(0, 100)); }
for (let i = 1; i <= 6; i++) {
  await p.waitForTimeout(10000);
  const alive = await Promise.race([
    p.evaluate(() => 1 + 1).then(() => 'RESPONSIVE'),
    new Promise((r) => setTimeout(() => r('BLOCKED'), 3000)),
  ]);
  const top = Object.entries(reqs).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k}:${v}`).join(' ');
  console.log(`t=${i * 10}s main-thread=${alive} | top reqs: ${top}`);
}
console.log('console errors:', errs.length ? [...new Set(errs)].slice(0, 8).join(' | ') : 'NONE');
await b.close();
