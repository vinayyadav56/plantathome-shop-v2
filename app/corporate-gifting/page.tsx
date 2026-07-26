import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/corporate-gifting';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Corporate Gifting',
  description: 'Premium plant gifting for teams, clients and events — curated and delivered by PlantAtHome.',
  alternates: { canonical: '/corporate-gifting' },
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
