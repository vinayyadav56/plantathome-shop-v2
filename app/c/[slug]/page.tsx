import type { Metadata } from 'next';
import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/category';
import { SITE_URL as BASE } from '@/lib/site-url';

export const revalidate = 300;



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

/**
 * Fetch the real category so admin SEO fields, the details text and the
 * category image reach the metadata. Fail-soft to the slug-prettified
 * template — a down API must not 500 the page.
 */
async function fetchCategory(slug: string): Promise<any | null> {
  const api = (process.env.NEXT_PUBLIC_REST_API_ENDPOINT || '').replace(/\/$/, '');
  if (!api) return null;
  try {
    const res = await fetch(`${api}/categories/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const stripTags = (s?: string | null) =>
  (s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategory(slug);
  const name = category?.name ?? prettify(slug);
  const title = category?.seo_title || `Buy ${name} Online in India`;
  const description =
    category?.seo_description ||
    stripTags(category?.details).slice(0, 160) ||
    `Shop ${name} at PlantAtHome — healthy, hand-checked plants and plant care delivered across 500+ Indian cities.`;
  const image = category?.image?.original || category?.banner_image?.original;
  const url = `${BASE}/c/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: `/c/${slug}` },
    ...(category?.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: { type: 'website', url, title, description, ...(image ? { images: [image] } : {}) },
    twitter: { card: 'summary_large_image', title, description, ...(image ? { images: [image] } : {}) },
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
