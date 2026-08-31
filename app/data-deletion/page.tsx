import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/data-deletion';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Deletion Instructions',
  description: 'How to request deletion of your PlantAtHome account and personal data.',
  alternates: { canonical: '/data-deletion' },
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
