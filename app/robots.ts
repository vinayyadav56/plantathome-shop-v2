import type { MetadataRoute } from 'next';
import { IS_INDEXABLE_SITE, SITE_URL as BASE } from '@/lib/site-url';

/** Dynamic, env-aware robots (replaces the stale static public/robots.txt that
 *  hardcoded the staging host). */

export default function robots(): MetadataRoute.Robots {
  // Staging / previews: nothing to crawl (see IS_INDEXABLE_SITE).
  if (!IS_INDEXABLE_SITE) return { rules: { userAgent: '*', disallow: '/' } };
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
        // Internal search — force-dynamic with unbounded query permutations:
        // a classic crawl-budget sink. The pages also declare meta-noindex.
        '/*/search',
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
