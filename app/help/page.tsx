import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/help';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Help & FAQs',
  description: 'Answers on delivery, plant care, returns and payments at PlantAtHome.',
  alternates: { canonical: '/help' },
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
