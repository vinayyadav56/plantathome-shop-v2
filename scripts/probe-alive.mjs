import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:3010';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
p.on('console', (m) => ['error','warning'].includes(m.type()) && errs.push(`[${m.type()}] ${m.text().slice(0,120)}`));
p.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message.slice(0, 120)));
await p.goto(url, { waitUntil: 'commit', timeout: 60000 }).catch(() => {});
await new Promise((r) => setTimeout(r, 10000));
const alive = await Promise.race([
  p.evaluate(() => document.body.innerText.slice(0, 80).replace(/\n/g, ' ')).then((t) => 'RESPONSIVE: ' + t),
  new Promise((r) => setTimeout(() => r('BLOCKED'), 3000)),
]);
console.log(alive);
console.log('console:', errs.length ? '\n  ' + [...new Set(errs)].slice(0, 6).join('\n  ') : 'clean');
process.exit(0);
