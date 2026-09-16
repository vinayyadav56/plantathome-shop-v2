import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/about';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About PlantAtHome',
  description:
    'PlantAtHome is an online plant company serving homes across India, operated by Silvestrix Green LLP (LLPIN ACP-3683), registered in Haryana.',
  alternates: { canonical: '/about' },
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
