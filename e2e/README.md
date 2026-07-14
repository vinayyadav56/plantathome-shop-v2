# Storefront QA suites

Production-grade tests authored during the 2026-07-14 launch QA sweep. Two kinds:

**Playwright specs** (`*.spec.ts`, run with the `@playwright/test` runner):
- `storefront-golden-path.spec.ts` — home → PDP (size + price) → pot picker → cart → guest checkout → `/orders/checkout/verify`. Asserts the **price-integrity invariant** (PDP price = cart total = charged).
- `auth.spec.ts` — signin happy path, validation/error states, protected-route guest gating.
- `prod-smoke.spec.ts` — read-only smoke over the 11 key production pages (0-console-error gate, no 5xx, broken images, hydration; **never writes**).

```bash
# staging (default)
npx playwright test
# production read-only smoke only
E2E_BASE_URL=https://www.plantathome.in npx playwright test prod-smoke
```

**Node suites** (`*.mjs`, run with `node`):
- `nonfunctional-audit.mjs` — Core Web Vitals + axe a11y + SEO/meta/sitemap + responsive.
- `legacy-api-contract.test.mjs` — legacy `/api` contract (status/shape/pagination/price-units/filtering) the storefront consumes.

```bash
node e2e/nonfunctional-audit.mjs https://plantathome-shop-staging.vercel.app
node e2e/legacy-api-contract.test.mjs
```

⚠️ Staging is safe to mutate; production is READ-ONLY (smoke + audits only — no orders, no writes).
