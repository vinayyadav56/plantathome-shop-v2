import { test, expect, Page } from '@playwright/test';

/**
 * /plant-doctor — what the chat shows for each outcome of the staged diagnosis service.
 *
 * Pins the contract, not the styling: a photo the gate rejects (not a plant, poor quality,
 * uncertain, more than one plant) gets its own bubble and never a diagnosis card; a diagnosis
 * shows the confidence category; the month's-budget 429 offers no retry; a message with no
 * photo at all makes no request; a follow-up never sends the earlier identification back as
 * `plant_name`.
 *
 * Read only: every API call the page makes is stubbed, so no diagnosis is ever bought.
 */

const SEED_CITY = () => {
  try {
    localStorage.setItem('pah_customer_city', 'Delhi');
    localStorage.setItem('pah-agentation', 'off');
    sessionStorage.setItem('pah-city-gate-dismissed', '1');
  } catch {
    /* noop */
  }
};

// A 1×1 PNG. The page redraws every upload onto a canvas before sending, so size is irrelevant.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

type Answer = { status: number; body: unknown };

function diagnosis(over: Record<string, unknown> = {}) {
  return {
    outcome: 'plant_detected',
    rejection_reason: '',
    guidance: { ask_for: [], message: '' },
    stage_results: {
      identification: {
        candidates: [
          { common_name: 'Monstera', scientific_name: 'Monstera deliciosa', rank: 'species', supporting_features: ['split leaves'] },
          { common_name: 'Split-leaf philodendron', scientific_name: 'Thaumatophyllum bipinnatifidum', rank: 'species', supporting_features: [] },
        ],
        confidence: 'high',
        broader_group: 'aroid houseplant',
        ambiguities: [],
        needs_more_views: [],
        reliable_for_species_advice: true,
      },
      care: { advice_scope: 'species_specific', uncertainty_notes: ['Roots were not visible.'], when_to_seek_help: '' },
    },
    is_plant: true,
    image_quality: 'ok',
    identification: { common_name: 'Monstera', scientific_name: 'Monstera deliciosa', confidence: 0.9 },
    plant_name: 'Monstera',
    diagnosis: [{
      condition: 'Brown leaf tips', severity: 'low', confidence: 0.6, description: 'Crisp brown tips on older leaves.',
      causes: ['Low humidity'], solutions: ['Raise humidity around the plant'], preventive_measures: ['Use rested water'],
      products_recommended: ['pebble tray'], vet_consultation_needed: false,
    }],
    overall_health_score: 0.7,
    immediate_action: 'Trim the brown tips.',
    long_term_care: 'Bright indirect light; let the top of the soil dry between waterings.',
    ...over,
  };
}

function rejection(outcome: string) {
  return diagnosis({
    outcome,
    rejection_reason: `Service copy for ${outcome}.`,
    guidance: { ask_for: ['closer_photo'], message: 'Move closer and fill the frame with the plant.' },
    stage_results: { identification: null, care: null },
    is_plant: false,
    identification: { common_name: '', scientific_name: '', confidence: 0 },
    plant_name: '',
    diagnosis: [],
    overall_health_score: 0,
    immediate_action: '',
    long_term_care: '',
  });
}

/** Stub every Plant Doctor call the page makes (cross-origin, so the preflight is answered too). */
async function stubApi(page: Page, answer: () => Answer) {
  const posts: Array<Record<string, unknown>> = [];
  await page.route(
    (url) => /\/plant-doctor\/(settings|consultations|diagnose)$/.test(url.pathname),
    async (route) => {
      const req = route.request();
      const cors = {
        'access-control-allow-origin': req.headers()['origin'] ?? '*',
        'access-control-allow-credentials': 'true',
        'access-control-allow-headers': req.headers()['access-control-request-headers'] ?? 'content-type',
        'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
      };
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      const json = (status: number, body: unknown) =>
        route.fulfill({ status, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) });
      if (/settings$/.test(route.request().url())) return json(200, { data: { enabled: true } });
      if (/consultations$/.test(route.request().url())) return json(200, { data: [] });
      posts.push(req.postDataJSON());
      const { status, body } = answer();
      return json(status, body);
    },
  );
  return posts;
}

async function open(page: Page) {
  await page.addInitScript(SEED_CITY);
  await page.goto('/plant-doctor');
  await expect(page.getByRole('button', { name: 'Send to Plant Doctor' })).toBeVisible();
}

async function sendPhoto(page: Page) {
  await page.locator('#pd-file').setInputFiles({ name: 'leaf.png', mimeType: 'image/png', buffer: PNG });
  await page.getByRole('button', { name: 'Send to Plant Doctor' }).click();
}

const REJECTION_TITLES: Record<string, RegExp> = {
  non_plant: /couldn’t find a living plant/i,
  poor_quality: /too blurry, dark or far away/i,
  uncertain: /can’t tell for sure/i,
  mixed_content: /more than one plant/i,
};

test.describe('Plant Doctor outcomes', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const outcome of Object.keys(REJECTION_TITLES)) {
    test(`${outcome}: its own bubble, the service's words, and no diagnosis card`, async ({ page }) => {
      const posts = await stubApi(page, () => ({ status: 200, body: { data: rejection(outcome) } }));
      await open(page);
      await sendPhoto(page);
      const bubble = page.locator(`[data-outcome="${outcome}"]`);
      await expect(bubble).toBeVisible();
      await expect(bubble).toContainText(REJECTION_TITLES[outcome]);
      await expect(bubble).toContainText(`Service copy for ${outcome}.`);
      await expect(bubble).toContainText('Move closer and fill the frame with the plant.');
      await expect(page.getByText(/Overall health|Looking good|Needs attention|Urgent care/)).toHaveCount(0);
      await expect(page.getByText('Long-term care')).toHaveCount(0);
      expect(posts).toHaveLength(1);
      expect(posts[0]).not.toHaveProperty('plant_name');
    });
  }

  test('plant_detected: the card with the confidence category, the finding and the care notes', async ({ page }) => {
    await stubApi(page, () => ({ status: 200, body: { data: diagnosis() } }));
    await open(page);
    await sendPhoto(page);
    await expect(page.getByRole('heading', { name: 'Monstera' })).toBeVisible();
    await expect(page.getByText('High confidence match')).toBeVisible();
    await expect(page.getByText('Could also be:')).toHaveCount(0); // high confidence: no alternatives
    await expect(page.getByRole('heading', { name: 'Brown leaf tips' })).toBeVisible();
    await expect(page.getByText('Trim the brown tips.')).toBeVisible();
    await expect(page.getByText('Roots were not visible.')).toBeVisible();
    await expect(page.locator('[data-outcome]')).toHaveCount(0);
  });

  test('a medium-confidence identification shows the alternatives and a group-level note', async ({ page }) => {
    const body = diagnosis();
    body.stage_results.identification!.confidence = 'medium';
    body.stage_results.identification!.reliable_for_species_advice = false;
    body.identification.confidence = 0.6;
    await stubApi(page, () => ({ status: 200, body: { data: body } }));
    await open(page);
    await sendPhoto(page);
    await expect(page.getByText('Medium confidence match')).toBeVisible();
    await expect(page.getByText(/Could also be: Split-leaf philodendron/)).toBeVisible();
    await expect(page.getByText(/general for a aroid houseplant/)).toBeVisible();
  });

  test("the month's budget 429 is final: no Try again", async ({ page }) => {
    await stubApi(page, () => ({
      status: 429,
      body: { message: "Plant Doctor has reached this month's limit. Please try again next month.", code: 'budget_exhausted' },
    }));
    await open(page);
    await sendPhoto(page);
    await expect(page.getByText(/reached this month/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0);
  });

  test('a throttle 429 can be retried', async ({ page }) => {
    await stubApi(page, () => ({ status: 429, body: { message: 'Too Many Attempts.' } }));
    await open(page);
    await sendPhoto(page);
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  test('words alone make no request: the page asks for a photo itself', async ({ page }) => {
    const posts = await stubApi(page, () => ({ status: 200, body: { data: diagnosis() } }));
    await open(page);
    await page.locator('#pd-message').fill('my tulsi leaves are curling');
    await page.getByRole('button', { name: 'Send to Plant Doctor' }).click();
    await expect(page.locator('[data-outcome="no_photo"]')).toBeVisible();
    await expect(page.locator('[data-outcome="no_photo"]')).toContainText('Please add a photo.');
    await page.waitForTimeout(1500);
    expect(posts).toHaveLength(0);
  });

  test('a follow-up re-sends the photo but never the earlier identification', async ({ page }) => {
    const posts = await stubApi(page, () => ({ status: 200, body: { data: diagnosis() } }));
    await open(page);
    await sendPhoto(page);
    await expect(page.getByRole('heading', { name: 'Monstera' })).toBeVisible();
    await page.locator('#pd-message').fill('it also has some yellow leaves');
    await page.getByRole('button', { name: 'Send to Plant Doctor' }).click();
    await expect(page.getByText('Updated diagnosis')).toBeVisible();
    expect(posts).toHaveLength(2);
    expect(posts[1]).not.toHaveProperty('plant_name');
    expect(typeof posts[1].image_base64).toBe('string');
    expect(String(posts[1].symptoms)).toContain('yellow leaves');
  });
});
