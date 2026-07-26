import type { Metadata } from 'next';
import { Hydrate } from '@/compat/react-query-hydration';
import { loadHomeData } from '@/framework/ssr/prefetch';
import HomeScreen from '@/app-shell/home-screen';

// Mirror V1's ISR: admin homepage changes reach the static home within 30s.
export const revalidate = 30;

export const metadata: Metadata = {
  // Home keeps the full default title (no template suffix duplication).
  title: { absolute: 'PlantAtHome — Premium Plants, Pots & Care, Delivered' },
  description:
    'India’s plant company. Healthy indoor & outdoor plants, premium pots and plant care — hand-checked and delivered across 500+ cities.',
  alternates: { canonical: '/' },
};

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.plantathome.in'
).replace(/\/$/, '');

/** Organization + WebSite (with sitelinks-search) — crawler-visible, server-rendered. */
const HOME_JSONLD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE}/#org`,
      name: 'PlantAtHome',
      url: SITE,
      logo: `${SITE}/icons/manifest-icon-192.png`,
    },
    {
      '@type': 'WebSite',
      url: SITE,
      name: 'PlantAtHome',
      publisher: { '@id': `${SITE}/#org` },
      potentialAction: {
        '@type': 'SearchAction',
        // Search is vertical-scoped in this app (/{vertical}/search) — there is
        // no bare /search route; it would be swallowed by [searchType] and 404.
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE}/plants/search?text={query}` },
        'query-input': 'required name=query',
      },
    },
  ],
};

export default async function HomePage() {
  const data = await loadHomeData();
  // loadHomeData only returns null for unknown verticals — never for home.
  const { variables, layout, dehydratedState } = data!;
  return (
    <Hydrate state={dehydratedState}>
      {/* Preload the default hero's first frame — the desktop LCP element.
          React 19 hoists <link> to <head>, so the browser starts the fetch
          from the initial HTML instead of waiting for the client bundle to
          mount <img>. media-gated to ≥768px: below md the PahHome hero is a
          different (smaller) composition and this file would be wasted bytes.
          If an admin configures custom Hero Slides the preload is superfluous
          but harmless — it is the built-in default and heavily cached. */}
      <link
        rel="preload"
        as="image"
        href="/hero-emerald.jpg"
        media="(min-width: 768px)"
        // @ts-ignore — React 19 supports fetchPriority on link
        fetchPriority="high"
      />
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
