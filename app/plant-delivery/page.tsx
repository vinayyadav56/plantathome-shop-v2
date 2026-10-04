import type { Metadata } from 'next';
import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import { loadCityProducts, loadLocationPages } from '@/framework/ssr/location-pages';
import { PageBody } from '@/page-bodies/plant-delivery';
import { SITE_URL } from '@/lib/site-url';

export const revalidate = 300;

/**
 * The plant-delivery landing page — and the city hub (/plants-in 308s here,
 * so the two never compete for the same query). City pages stay at
 * /plants-in/{city}.
 */
export const metadata: Metadata = {
  title: 'Plant Delivery Online in India',
  description:
    'Order plants online and get them delivered to your door. Indoor, outdoor, flowering and air-purifying plants, pots and gardening essentials from PlantAtHome, with delivery across India.',
  alternates: { canonical: '/plant-delivery' },
};

export default async function Page() {
  const [{ dehydratedState }, cities, products] = await Promise.all([
    loadGeneralData(),
    loadLocationPages(),
    loadCityProducts('', 8),
  ]);
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Plant Delivery', item: `${SITE_URL}/plant-delivery` },
    ],
  };
  return (
    <Hydrate state={dehydratedState}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, '\\u003c') }}
      />
      <PageBody cities={cities} products={products} />
    </Hydrate>
  );
}
