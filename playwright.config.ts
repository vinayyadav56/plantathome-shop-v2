import { defineConfig } from '@playwright/test';

/**
 * Storefront QA suites (e2e/*.spec.ts). Browser specs run against a base URL:
 *   E2E_BASE_URL=https://plantathome-shop-staging.vercel.app npx playwright test
 * The *.mjs node suites in e2e/ (API contract, non-functional audit) run
 * directly with `node e2e/<file>.mjs` and are not managed by this runner.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.ts$/,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'https://plantathome-shop-staging.vercel.app',
    trace: 'retain-on-failure',
  },
});
