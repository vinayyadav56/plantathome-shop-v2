import { test, expect, Page } from '@playwright/test';

/**
 * The shopping-city picker (owner 2026-10-12): "Detect my location" picks the city it finds,
 * and search covers every city we list, not only the ones with a partner nursery.
 *
 * Each test is a fresh browser with no sign-in, so a picked city lives in that browser's
 * localStorage only: safe against any environment.
 */

const picker = (page: Page) =>
  page.getByRole('dialog').filter({ has: page.getByPlaceholder('Search your city') });
const storedCity = (page: Page) => page.evaluate(() => localStorage.getItem('pah_customer_city'));

test.describe('Detect my location', () => {
  // A Gurugram pin. The geocoder names it "Gurgaon", an old-name row, so this passes only if
  // the picker maps that onto Gurugram.
  test.use({ permissions: ['geolocation'], geolocation: { latitude: 28.4595, longitude: 77.0266 } });

  test('picks the city it finds', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await picker(page).getByRole('button', { name: /detect my location/i }).click();
    await expect.poll(() => storedCity(page), { timeout: 25_000 }).toBe('Gurugram');
  });
});

test.describe('Detect my location, blocked', () => {
  test.use({ permissions: [] });

  test('says why and opens the list', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await picker(page).getByRole('button', { name: /detect my location/i }).click();
    await expect(picker(page).getByRole('status')).toHaveText(/location is blocked/i, { timeout: 15_000 });
    await expect(page.locator('#city-picker-list')).toBeVisible();
    expect(await storedCity(page)).toBeNull();
  });
});

test('search covers every city we list, nursery cities first', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const box = picker(page).getByPlaceholder('Search your city');
  await box.click();
  const list = page.locator('#city-picker-list');
  // An empty box: the nursery cities, and how to reach the rest.
  await expect(list.getByText(/Type to search all [\d,]+ cities/)).toBeVisible({ timeout: 20_000 });
  // A city with no nursery is tagged "Ships by courier" while Plants are a nationwide
  // catalogue (GET /types: plants.availability.nationwide), else "No plants yet".
  await expect(list.getByRole('button', { name: /No plants yet|Ships by courier/ })).toHaveCount(0);

  await box.fill('pune');
  await expect(list.getByRole('button').first()).toHaveText(/^Pune\s*(No plants yet|Ships by courier)/);
  await box.fill('bangalore'); // old name
  await expect(list.getByRole('button').first()).toHaveText(/^Bengaluru(?!.*(No plants yet|Ships by courier))/);
  await box.fill('gurg'); // "Gurgaon" is Gurugram's old-name row: not listed twice
  await expect(list.getByRole('button')).toHaveText([/^Gurugram/]);

  await box.fill('pune');
  await list.getByRole('button', { name: /^Pune/ }).click();
  await expect.poll(() => storedCity(page)).toBe('Pune');
  // An active city with no nursery is browsable: no "unavailable" takeover.
  await page.goto('/tools', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText(/is currently unavailable/i)).toHaveCount(0);
});
