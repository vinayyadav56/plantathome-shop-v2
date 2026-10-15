import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Hydrate } from '@/compat/react-query-hydration';
import { loadComingSoon, loadGeneralData, loadTypeSlugs } from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/search';
import { PageBody as PlpPageBody } from '@/page-bodies/plp';
import { PageBody as ComingSoonPageBody } from '@/components/storefront/coming-soon';

/** Verticals whose search results render in the listing-page body (see [searchType]/page.tsx). */
const PLP_VERTICALS = new Set(['plants']);

export const dynamic = 'force-dynamic';

/**
 * Internal search: noindex,follow. force-dynamic + unbounded query-param
 * permutations = a crawl-budget sink if indexed; robots.ts also disallows
 * it, this is the belt for crawlers that land here from links.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ searchType: string }>;
}): Promise<Metadata> {
  const { searchType } = await params;
  // /nope/search must be a real 404, like /nope (fail-soft when the types API is down).
  const slugs = await loadTypeSlugs();
  if (slugs.length && !slugs.includes(searchType)) notFound();
  const name = searchType.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `Search ${name}`,
    robots: { index: false, follow: true },
  };
}

export default async function Page({ params }: { params: Promise<{ searchType: string }> }) {
  const { searchType } = await params;
  const slugs = await loadTypeSlugs();
  if (slugs.length && !slugs.includes(searchType)) notFound();
  // A Coming Soon vertical has nothing to search yet: its Coming Soon page (already noindex above).
  const soon = await loadComingSoon(searchType);
  const { dehydratedState } = await loadGeneralData();
  return (
    <Hydrate state={dehydratedState}>
      {soon ? (
        <ComingSoonPageBody slug={searchType} {...soon} />
      ) : PLP_VERTICALS.has(searchType) ? (
        <PlpPageBody type={searchType} mode="search" />
      ) : (
        <PageBody />
      )}
    </Hydrate>
  );
}
