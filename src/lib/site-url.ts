/**
 * Canonical site origin — the ONE place the production fallback lives.
 * www is canonical (the apex is Cloudflare-gated); staging/preview set
 * NEXT_PUBLIC_SITE_URL and override it.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.plantathome.in').replace(
  /\/$/,
  '',
);

/** Only the real production origin may be indexed. Staging deploys the SAME
 *  catalogue (production API) under its own host — left indexable it is a full
 *  duplicate of the site competing with www (SEO audit 2026-10-04). */
export const PRODUCTION_ORIGIN = 'https://www.plantathome.in';
export const IS_INDEXABLE_SITE = SITE_URL === PRODUCTION_ORIGIN;

/** REST API origin for server-side fetches (sitemap, generateMetadata, loaders). */
export const API_URL = (process.env.NEXT_PUBLIC_REST_API_ENDPOINT || '').replace(/\/$/, '');
