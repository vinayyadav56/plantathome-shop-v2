import type { Metadata } from 'next';
import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/category';

export const revalidate = 300;

const BASE = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.plantathome.in'
).replace(/\/$/, '');

/** "snake-plants" → "Snake Plants" — no fetch needed for a solid title. */
const prettify = (slug: string) => {
  // Params arrive already-decoded from the App Router; a slug containing a
  // literal '%' would make decodeURIComponent THROW (URIError) and turn a
  // harmless bad URL into a 500 instead of a 404.
  let s = slug;
  try {
    s = decodeURIComponent(slug);
  } catch {
    /* keep raw */
  }
  return s
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const name = prettify(slug);
  return {
    title: `${name} — Buy ${name} Online`,
    description: `Shop ${name} at PlantAtHome — healthy, hand-checked plants and plant care delivered across 500+ Indian cities.`,
    alternates: { canonical: `/c/${slug}` },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { dehydratedState } = await loadGeneralData();
  const name = prettify(slug);
  // BreadcrumbList emitted server-side (the client-side BreadcrumbJsonLd from
  // next-seo is shimmed to null in this app).
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Categories', item: `${BASE}/categories` },
      { '@type': 'ListItem', position: 3, name, item: `${BASE}/c/${slug}` },
    ],
  };
  return (
    <Hydrate state={dehydratedState}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumb).replace(/</g, '\\u003c'),
        }}
      />
      <PageBody />
    </Hydrate>
  );
}
