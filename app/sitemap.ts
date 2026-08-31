import type { MetadataRoute } from 'next';
import { SITE_URL as BASE } from '@/lib/site-url';

/**
 * Dynamic, env-aware sitemap. Replaces the stale static public/sitemap*.xml
 * (which hardcoded localhost:3000 URLs for dead V1 routes and pointed the prod
 * index at the staging host). Base host comes from NEXT_PUBLIC_SITE_URL per
 * environment (prod = https://www.plantathome.in — the apex is CF-gated).
 * Includes real content routes plus live product + category slugs.
 */

export const revalidate = 3600; // rebuild the sitemap hourly


const API = (process.env.NEXT_PUBLIC_REST_API_ENDPOINT || '').replace(/\/$/, '');

const STATIC_ROUTES = [
  '',
  '/categories',
  '/offers',
  '/flash-sales',
  '/plant-doctor',
  '/garden-service',
  '/corporate-gifting',
  '/contact',
  '/help',
  '/track-order',
  '/terms',
  '/privacy',
  '/data-deletion',
  // '/refunds' removed: that is the ACCOUNT refunds page (its page body even
  // declares noindex) — the public policy page is /customer-refund-policies.
  '/customer-refund-policies',
  '/vendor-refund-policies',
  '/plants-in',
];

async function fetchSlugs(path: string): Promise<string[]> {
  if (!API) return [];
  try {
    const res = await fetch(`${API}/${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const rows: any[] = Array.isArray(json) ? json : json?.data ?? [];
    return rows
      // Admin noindex flag (products/categories emit it): never advertise those.
      .filter((r) => r?.noindex !== true)
      .map((r) => r?.slug)
      .filter((s): s is string => typeof s === 'string' && s.length > 0);
  } catch {
    return [];
  }
}

/**
 * Walk the Laravel paginator until a short page.
 *
 * PER_PAGE is 100 because the API CLAMPS limit to 100 (both ProductController
 * and CategoryController — the category clamp exists because limit=1000 once
 * blew PHP-FPM's memory limit mid-serialize). Which means the old single
 * `?limit=1000` call here was actually returning 100 rows, not 1000 — the
 * sitemap was missing ~1,500 of ~1,593 published PDPs, even worse than the
 * audit's estimate. Ask for more than the clamp and the break-on-short-page
 * check compares against what the API can actually return, so the loop stops
 * after page 1 with a silent 6% sitemap.
 * Page cap of 60 (6k rows) is a runaway guard, not a limit we expect to hit.
 */
async function fetchAllSlugs(resource: string, extraQuery = ''): Promise<string[]> {
  const PER_PAGE = 100;
  const all: string[] = [];
  for (let page = 1; page <= 60; page++) {
    const batch = await fetchSlugs(
      `${resource}?limit=${PER_PAGE}&page=${page}&language=en${extraQuery}`,
    );
    all.push(...batch);
    if (batch.length < PER_PAGE) break;
  }
  return all;
}

/**
 * Products MUST carry the same filters the storefront listing uses
 * (client/index.ts products.all): status publish + public visibility +
 * hide_unpriced. Without them the sitemap advertises every DRAFT and
 * unpriced catalogue row (prod holds ~2,675 drafts next to ~1,593 published)
 * — thousands of URLs that render as 404/empty PDPs for the crawler.
 */
const PRODUCT_FILTERS =
  `&searchJoin=and&hide_unpriced=1&search=${encodeURIComponent(
    // noindex:0 — a product the admin flagged noindex must not be advertised.
    'status:publish;visibility:visibility_public;noindex:0',
  )}`;

/** Active city landing pages, indexable only (the endpoint already filters active). */
async function fetchLocationPages(): Promise<{ slug: string }[]> {
  if (!API) return [];
  try {
    const res = await fetch(`${API}/locations/pages`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const rows: any[] = await res.json();
    return (Array.isArray(rows) ? rows : []).filter(
      (r) => typeof r?.slug === 'string' && r.is_indexable !== false,
    );
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [productSlugs, categorySlugs, typeSlugs, policySlugs, locationPages] = await Promise.all([
    fetchAllSlugs('products', PRODUCT_FILTERS),
    fetchAllSlugs('categories'),
    // Vertical roots (/plants, /tools, …) — unpaginated, tiny.
    fetchSlugs('types?limit=100'),
    // Governed public policies (/policies/{slug}) — live versions only.
    fetchSlugs('legal/public/policies'),
    // Active city landing pages; is_indexable filtered below.
    fetchLocationPages(),
  ]);

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${BASE}${r}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: r === '' ? 1 : 0.7,
  }));

  for (const slug of productSlugs) {
    entries.push({ url: `${BASE}/products/${slug}`, lastModified: now, changeFrequency: 'daily', priority: 0.8 });
  }
  for (const slug of categorySlugs) {
    entries.push({ url: `${BASE}/c/${slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 });
  }
  for (const slug of typeSlugs) {
    entries.push({ url: `${BASE}/${slug}`, lastModified: now, changeFrequency: 'daily', priority: 0.9 });
  }
  for (const slug of policySlugs) {
    entries.push({ url: `${BASE}/policies/${slug}`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 });
  }
  for (const page of locationPages) {
    entries.push({ url: `${BASE}/plants-in/${page.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 });
  }

  return entries;
}
