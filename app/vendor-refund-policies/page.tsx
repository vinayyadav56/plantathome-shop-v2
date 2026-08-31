import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/vendor-refund-policies';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vendor Refund Policy',
  description: 'Refund handling terms for PlantAtHome nursery and supply vendors.',
  alternates: { canonical: '/vendor-refund-policies' },
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
