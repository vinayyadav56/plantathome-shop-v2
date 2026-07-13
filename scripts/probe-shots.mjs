import { chromium } from 'playwright';
const SHOT = process.env.SHOT;
const b = await chromium.launch();
const errs = [];
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 130)));
p.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message.slice(0, 130)));
await p.goto('http://localhost:3010', { waitUntil: 'domcontentloaded', timeout: 90000 });
await p.waitForTimeout(7000);
const h = await p.evaluate(() => document.body.scrollHeight);
console.log('desktop height:', h);
const stops = [0, 850, 1700, 2550, 3400, Math.max(0, h - 900)];
for (let i = 0; i < stops.length; i++) {
  await p.evaluate((y) => window.scrollTo(0, y), stops[i]);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${SHOT}/pd${i}.png`, timeout: 20000 });
  console.log('shot pd' + i);
}
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
m.on('console', (x) => x.type() === 'error' && errs.push('[m] ' + x.text().slice(0, 130)));
await m.goto('http://localhost:3010', { waitUntil: 'domcontentloaded', timeout: 90000 });
await m.waitForTimeout(6000);
const mh = await m.evaluate(() => document.body.scrollHeight);
console.log('mobile height:', mh);
for (let i = 0; i < 3; i++) {
  await m.evaluate((y) => window.scrollTo(0, y), i * 800);
  await m.waitForTimeout(1200);
  await m.screenshot({ path: `${SHOT}/pm${i}.png`, timeout: 20000 });
  console.log('shot pm' + i);
}
console.log('console errors:', errs.length ? '\n  ' + [...new Set(errs)].slice(0, 10).join('\n  ') : 'NONE ✓');
process.exit(0);
