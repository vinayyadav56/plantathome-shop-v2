import type { Metadata } from 'next';
import { Hydrate } from '@/compat/react-query-hydration';
import { loadHomeData } from '@/framework/ssr/prefetch';
import HomeScreen from '@/app-shell/home-screen';
import { SITE_URL as SITE } from '@/lib/site-url';
import { SOCIAL_URL_LIST } from '@/lib/socials';

// Mirror V1's ISR: admin homepage changes reach the static home within 30s.
export const revalidate = 30;

export const metadata: Metadata = {
  // Home keeps the full default title (no template suffix duplication).
  title: { absolute: 'PlantAtHome – Plant Delivery Online in India | Buy Plants Online' },
  description:
    'Buy plants online with PlantAtHome. Explore indoor, outdoor, flowering and air-purifying plants, pots and gardening essentials with convenient plant delivery across India.',
  alternates: { canonical: '/' },
};



/** Organization + WebSite — crawler-visible, server-rendered. No SearchAction:
 *  the only search URLs (/{vertical}/search) are robots-blocked + noindex, and
 *  Google retired the sitelinks search box. */
const HOME_JSONLD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE}/#org`,
      name: 'PlantAtHome',
      alternateName: 'Plant At Home',
      legalName: 'Silvestrix Green LLP',
      url: SITE,
      logo: `${SITE}/icons/manifest-icon-192.png`,
      sameAs: SOCIAL_URL_LIST,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'hello@plantathome.in',
        areaServed: 'IN',
        availableLanguage: ['en', 'hi'],
      },
    },
    {
      '@type': 'WebSite',
      url: SITE,
      name: 'PlantAtHome',
      alternateName: 'Plant At Home',
      publisher: { '@id': `${SITE}/#org` },
    },
  ],
};

export default async function HomePage() {
  const data = await loadHomeData();
  // loadHomeData only returns null for unknown verticals — never for home.
  const { variables, layout, dehydratedState } = data!;
  return (
    <Hydrate state={dehydratedState}>
      {/* The hero preload used to live here, hardcoded to /hero-emerald.jpg and
          media-gated to >=768px — so phones, whose LCP element this also is, got
          no preload at all, and it pointed at the raw 242 KB original rather than
          an optimized variant. Both heroes now use next/image with `priority`,
          which emits a preload carrying the correct imagesrcset for the actual
          device width, and follows admin-configured Hero Slides instead of
          assuming the built-in default. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(HOME_JSONLD).replace(/</g, '\\u003c'),
        }}
      />
      <HomeScreen variables={variables} layout={layout} />
    </Hydrate>
  );
}
