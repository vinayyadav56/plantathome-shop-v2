import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Hydrate } from '@/compat/react-query-hydration';
import { loadCategoryData } from '@/framework/ssr/prefetch';
import { pageTitle } from '@/lib/seo';
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
/** The category, `null` when the API could not be asked (fail-soft to the
 *  prettified slug), or `false` when the API answered and the slug does not
 *  exist — that one must 404, not render an empty category page. */
const fetchCategory = cache(async (slug: string): Promise<any | null | false> => {
  const api = (process.env.NEXT_PUBLIC_REST_API_ENDPOINT || '').replace(/\/$/, '');
  if (!api) return null;
  try {
    const res = await fetch(`${api}/categories/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (res.status === 404) return false;
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
});

/** One load per request, shared by generateMetadata and the page. */
const loadCategory = cache(async (slug: string, category: any) => loadCategoryData(slug, category));

const stripTags = (s?: string | null) =>
  (s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategory(slug);
  if (category === false) notFound();
  const name = category?.name ?? prettify(slug);
  const title = pageTitle(category?.seo_title || `Buy ${name} Online in India`);
  // A category with no products is thin content (e.g. the empty "-plants"
  // twins of indoor/outdoor/flowering): keep it out of the index, keep links followed.
  const { productTotal } = category ? await loadCategory(slug, category) : { productTotal: null };
  const noindex = Boolean(category?.noindex) || productTotal === 0;
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
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
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
  // A slug the API does not know is a real 404 (the root loading boundary that
  // used to stream a 200 shell first is gone).
  const category = await fetchCategory(slug);
  if (category === false) notFound();
  const { dehydratedState } = await loadCategory(slug, category);
  const name = category?.name ?? prettify(slug);
  const parent = category?.parent?.slug ? category.parent : null;
  // BreadcrumbList emitted server-side (the client-side BreadcrumbJsonLd from
  // next-seo is shimmed to null in this app).
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Categories', item: `${BASE}/categories` },
      ...(parent
        ? [{ '@type': 'ListItem', position: 3, name: parent.name, item: `${BASE}/c/${parent.slug}` }]
        : []),
      { '@type': 'ListItem', position: parent ? 4 : 3, name, item: `${BASE}/c/${slug}` },
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
