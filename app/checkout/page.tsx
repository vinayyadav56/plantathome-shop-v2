import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/checkout';

import type { Metadata } from 'next';
// Account/utility page — declared noindex in the page body for years,
// but the next-seo shim renders null so it never reached the HTML.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const revalidate = 300;

export default async function Page() {
  const { dehydratedState } = await loadGeneralData();
  return (
    <Hydrate state={dehydratedState}>
      <PageBody />
    </Hydrate>
  );
}
