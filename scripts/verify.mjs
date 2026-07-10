import { chromium } from 'playwright';

const BASE = process.env.SHOP_URL || 'http://localhost:3010';
const SHOT = process.argv[2] || '/private/tmp/claude-501/-Users-vinayyadav-PlantAtHome-Pickbazar-Laravel-11-10-Pickbazar-Laravel-react-next-rest-graphql-ecommerce/18004e45-6460-498c-8094-aa2e2eff9cab/scratchpad/shop_home.png';

const browser = await chromium.launch();
const page = await browser.newPage();

const consoleErrors = [];
const failedRequests = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('requestfailed', (r) => failedRequests.push(`${r.method()} ${r.url()} — ${r.failure()?.errorText}`));
const apiResponses = [];
page.on('response', (r) => {
  if (r.url().includes('/api/v1/')) apiResponses.push(`${r.status()} ${r.url().split('/api/v1/')[1]?.split('?')[0]}`);
});

await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });

// Wait for product cards to appear (client-fetched via TanStack Query).
let cardCount = 0;
try {
  await page.waitForSelector('a[href^="/products/"]', { timeout: 12000 });
  cardCount = await page.locator('a[href^="/products/"]').count();
} catch {
  cardCount = 0;
}

await page.screenshot({ path: SHOT, fullPage: true });

console.log('== SHOP M0 VERIFY ==');
console.log('url:', BASE);
console.log('product card links rendered:', cardCount);
console.log('API responses seen:', apiResponses.length ? apiResponses.join(', ') : '(none)');
console.log('console errors:', consoleErrors.length ? '\n  - ' + consoleErrors.join('\n  - ') : 'none');
console.log('failed requests:', failedRequests.length ? '\n  - ' + failedRequests.join('\n  - ') : 'none');
console.log('screenshot:', SHOT);

await browser.close();

const corsBlocked = failedRequests.some((r) => r.includes('/api/v1/'));
if (corsBlocked) {
  console.log('\nRESULT: FAIL — API request blocked (likely CORS: staging API must allow http://localhost:3010).');
  process.exit(2);
}
if (cardCount === 0) {
  console.log('\nRESULT: FAIL — no products rendered (check API data / grid).');
  process.exit(1);
}
if (consoleErrors.length) {
  console.log('\nRESULT: WARN — products rendered but console has errors.');
  process.exit(3);
}
console.log('\nRESULT: PASS — products render from live API, no console errors.');
