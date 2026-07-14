import type { MetadataRoute } from 'next';

/** Dynamic, env-aware robots (replaces the stale static public/robots.txt that
 *  hardcoded the staging host). */
const BASE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.plantathome.in').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/checkout', '/checkout/', '/profile', '/orders', '/wishlists', '/change-password', '/verify-email'],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
