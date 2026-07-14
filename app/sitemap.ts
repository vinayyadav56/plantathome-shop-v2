import type { MetadataRoute } from 'next';

/**
 * Dynamic, env-aware sitemap. Replaces the stale static public/sitemap*.xml
 * (which hardcoded localhost:3000 URLs for dead V1 routes and pointed the prod
 * index at the staging host). Base host comes from NEXT_PUBLIC_SITE_URL per
 * environment (prod = https://www.plantathome.in — the apex is CF-gated).
 * Includes real content routes plus live product + category slugs.
 */

export const revalidate = 3600; // rebuild the sitemap hourly

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.plantathome.in').replace(/\/$/, '');
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
  '/refunds',
];

async function fetchSlugs(path: string): Promise<string[]> {
  if (!API) return [];
  try {
    const res = await fetch(`${API}/${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const rows: any[] = Array.isArray(json) ? json : json?.data ?? [];
    return rows.map((r) => r?.slug).filter((s): s is string => typeof s === 'string' && s.length > 0);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [productSlugs, categorySlugs] = await Promise.all([
    fetchSlugs('products?limit=1000&language=en'),
    fetchSlugs('categories?limit=1000&language=en'),
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

  return entries;
}
