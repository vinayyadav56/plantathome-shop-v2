import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/offers';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Offers & Deals',
  description: "Today's best plant deals, seasonal offers and coupons at PlantAtHome.",
  alternates: { canonical: '/offers' },
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
