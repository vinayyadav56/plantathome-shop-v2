import type { MetadataRoute } from 'next';

/** Dynamic, env-aware robots (replaces the stale static public/robots.txt that
 *  hardcoded the staging host). */
const BASE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.plantathome.in').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/checkout',
        '/checkout/',
        '/profile',
        '/orders',
        '/wishlists',
        '/change-password',
        '/verify-email',
        // Account/utility pages that also declare meta-noindex; disallowing
        // saves the crawl budget outright.
        '/cards',
        '/downloads',
        '/reports',
        '/questions',
        '/my-packages',
        '/notification',
        '/access-denied',
        '/refunds', // account refunds — the public policy page is /customer-refund-policies
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
