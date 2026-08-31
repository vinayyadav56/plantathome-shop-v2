import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/customer-refund-policies';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Refund Policy',
  description: 'When and how refunds are issued for PlantAtHome orders, including live-plant claims.',
  alternates: { canonical: '/customer-refund-policies' },
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
