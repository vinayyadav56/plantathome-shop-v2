/**
 * Server-side loaders for the /plants-in city landing pages.
 *
 * Plain fetch() (not the axios client) so Next's fetch cache dedupes the
 * generateMetadata + page double-fetch and ISR revalidation applies. All
 * fail-soft: a down API renders an empty-but-valid page, never a 500.
 *
 * These deliberately do NOT use the client product hooks — those key off the
 * localStorage shopping city, and a Delhi-stored visitor viewing
 * /plants-in/mumbai must see Mumbai's products. The city in the URL is the
 * source of truth here; everything flows down as plain props.
 */
import { API_URL } from '@/lib/site-url';

const REVALIDATE = { next: { revalidate: 300 } } as const;

export interface LocationPageData {
  id: number;
  slug: string;
  city_name: string;
  state_name: string | null;
  seo_title: string | null;
  seo_description: string | null;
  intro_html: string | null;
  delivery_html: string | null;
  faqs: { question: string; answer: string }[] | null;
  is_active: boolean;
  is_indexable: boolean;
}

export interface LocationPageSummary {
  slug: string;
  city_name: string;
  state_name: string | null;
  is_indexable: boolean;
}

async function getJson<T>(path: string): Promise<T | null> {
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL}/${path}`, REVALIDATE);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function loadLocationPages(): Promise<LocationPageSummary[]> {
  const rows = await getJson<LocationPageSummary[]>('locations/pages');
  return Array.isArray(rows) ? rows : [];
}

export async function loadLocationPage(slug: string): Promise<LocationPageData | null> {
  return getJson<LocationPageData>(`locations/pages/${encodeURIComponent(slug)}`);
}

/** Live products in this city — the same publish filters the sitemap uses. */
export async function loadCityProducts(cityName: string, limit = 8): Promise<any[]> {
  const params =
    `limit=${limit}&city=${encodeURIComponent(cityName)}&hide_unpriced=1` +
    `&searchJoin=and&search=${encodeURIComponent('status:publish;visibility:visibility_public')}`;
  const json = await getJson<any>(`products?${params}`);
  const rows = Array.isArray(json) ? json : json?.data ?? [];
  return Array.isArray(rows) ? rows : [];
}

/** Top-level categories for the internal-link grid. */
export async function loadTopCategories(limit = 12): Promise<any[]> {
  const json = await getJson<any>(`categories?limit=${limit}`);
  const rows = Array.isArray(json) ? json : json?.data ?? [];
  return (Array.isArray(rows) ? rows : []).filter((c: any) => !c?.parent);
}
