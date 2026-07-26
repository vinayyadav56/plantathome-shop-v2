import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/flash-sales';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Flash Sales',
  description: 'Limited-time plant flash sales at PlantAtHome — while stock lasts.',
  alternates: { canonical: '/flash-sales' },
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
