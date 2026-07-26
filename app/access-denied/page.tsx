import type { Metadata } from 'next';
import { PageBody } from '@/page-bodies/access-denied';

/**
 * /access-denied — the 403 landing page. The AccessDenied component existed
 * with ZERO importers ("redesign the 401 page" turned out to be "the shop has
 * no 401/403 surface at all"): the axios interceptor used to silently
 * Router.replace('/') on any 401/403. The interceptor now handles 401 as
 * session-expiry → /signin, and this page gives 403s and support links a
 * stable, linkable destination.
 */
export const metadata: Metadata = {
  title: 'Access denied',
  robots: { index: false, follow: false },
};

export default function AccessDeniedRoute() {
  return <PageBody />;
}
