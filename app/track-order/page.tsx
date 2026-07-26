import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/track-order';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Track Your Order',
  description: 'Live tracking for your PlantAtHome order — from nursery to your doorstep.',
  alternates: { canonical: '/track-order' },
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
