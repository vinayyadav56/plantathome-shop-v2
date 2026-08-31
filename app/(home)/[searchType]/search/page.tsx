import type { Metadata } from 'next';
import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/search';

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
  const name = searchType.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `Search ${name}`,
    robots: { index: false, follow: true },
  };
}

export default async function Page() {
  const { dehydratedState } = await loadGeneralData();
  return (
    <Hydrate state={dehydratedState}>
      <PageBody />
    </Hydrate>
  );
}
