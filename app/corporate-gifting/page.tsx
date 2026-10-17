import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/corporate-gifting';
import { SITE_URL } from '@/lib/site-url';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Corporate Plant Gifting — Request a Custom Proposal',
  description:
    'Plant gifting for employees, clients and corporate events. Share your occasion, quantity and budget and PlantAtHome will send a custom proposal with curated plants, branding and pan-India delivery.',
  alternates: { canonical: '/corporate-gifting' },
};

export const revalidate = 300;

export default async function Page() {
  const { dehydratedState } = await loadGeneralData();
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Corporate Gifting', item: `${SITE_URL}/corporate-gifting` },
    ],
  };
  return (
    <Hydrate state={dehydratedState}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, '\\u003c') }}
      />
      <PageBody />
    </Hydrate>
  );
}
