import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/categories';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Shop by Category',
  description: 'Explore every PlantAtHome world — indoor plants, outdoor plants, pots & planters, plant care, seeds and gifting.',
  alternates: { canonical: '/categories' },
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
