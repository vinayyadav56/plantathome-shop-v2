import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/contact';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Questions about an order or plant care? Talk to the PlantAtHome team — we reply fast.',
  alternates: { canonical: '/contact' },
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
