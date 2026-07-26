import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/plant-doctor';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Plant Doctor — Free AI Diagnosis',
  description: 'Upload a photo of a struggling plant and get an instant AI diagnosis with a care plan.',
  alternates: { canonical: '/plant-doctor' },
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
