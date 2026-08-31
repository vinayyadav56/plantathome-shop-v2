/**
 * Canonical site origin — the ONE place the production fallback lives.
 * www is canonical (the apex is Cloudflare-gated); staging/preview set
 * NEXT_PUBLIC_SITE_URL and override it.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.plantathome.in').replace(
  /\/$/,
  '',
);

/** REST API origin for server-side fetches (sitemap, generateMetadata, loaders). */
export const API_URL = (process.env.NEXT_PUBLIC_REST_API_ENDPOINT || '').replace(/\/$/, '');
