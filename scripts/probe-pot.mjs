import { chromium } from 'playwright';
const SHOT = process.env.SHOT ?? '/tmp';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
const errs = [];
p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 110)));
p.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message.slice(0, 110)));
await p.goto('http://localhost:3010/pot-test', { waitUntil: 'domcontentloaded', timeout: 120000 });
await p.waitForTimeout(6000);
console.log('pot title present:', await p.locator('text=Choose your pot').count());
console.log('With Pot card:', await p.locator('button:has-text("With Pot")').count(), '| Without Pot card:', await p.locator('button:has-text("Without Pot")').first().count());
console.log('delta label (+₹199):', await p.locator('text=+₹199').count(), '| Included label:', await p.locator('text=Included').count());
// select Small + With Pot
await p.locator('button', { hasText: /^Small$/ }).first().click();
await p.waitForTimeout(600);
await p.locator('button').filter({ hasText: /^With Pot/ }).first().click();
await p.waitForTimeout(1200);
const sale = await p.locator('text=/Sale price|₹/').first().textContent().catch(() => '');
// price shown for Small(359) + pot(199) = 558
console.log('price region mentions 558:', (await p.locator('text=/558/').count()) > 0);
await p.screenshot({ path: SHOT + '/pot-ui.png', timeout: 20000 });
// add to cart → verify composite line title
await p.locator('button', { hasText: /add to cart/i }).first().click({ timeout: 5000 }).catch((e) => console.log('add failed:', e.message.slice(0, 60)));
await p.waitForTimeout(2000);
const cart = await p.evaluate(() => JSON.parse(localStorage.getItem('plantathome-cart') ?? '{}'));
const line = (cart?.items ?? []).find((i) => /With Pot/.test(i?.name ?? ''));
console.log('cart line:', line?.name, '| price:', line?.price, '| variationId:', line?.variationId);
await p.screenshot({ path: SHOT + '/pot-added.png', timeout: 20000 });
console.log('console errors:', errs.length ? '\n  ' + [...new Set(errs)].slice(0, 5).join('\n  ') : 'NONE ✓');
await b.close();
process.exit(0);
