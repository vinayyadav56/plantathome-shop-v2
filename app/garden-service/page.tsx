import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/garden-service';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Garden Services',
  description: 'Professional garden setup and maintenance by PlantAtHome, at your home or office.',
  alternates: { canonical: '/garden-service' },
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
