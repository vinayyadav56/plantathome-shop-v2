import type { Metadata } from 'next';
import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import { loadLocationPages } from '@/framework/ssr/location-pages';
import { PageBody } from '@/page-bodies/plants-in-index';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Plant Delivery Cities Across India',
  description:
    'PlantAtHome delivers healthy plants, pots and gardening essentials across India. Find your city for local delivery options, live availability and offers.',
  alternates: { canonical: '/plants-in' },
};

export default async function Page() {
  const [{ dehydratedState }, cities] = await Promise.all([loadGeneralData(), loadLocationPages()]);
  return (
    <Hydrate state={dehydratedState}>
      <PageBody cities={cities} />
    </Hydrate>
  );
}
