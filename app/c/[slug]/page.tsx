import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Hydrate } from '@/compat/react-query-hydration';
import { loadCategoryData, loadComingSoon, loadGeneralData } from '@/framework/ssr/prefetch';
import { pageTitle } from '@/lib/seo';
import { PageBody } from '@/page-bodies/category';
import { PageBody as ComingSoonPageBody } from '@/components/storefront/coming-soon';
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
  // A category of a Coming Soon vertical renders that vertical's Coming Soon page (below).
  const soon = category?.type?.slug ? await loadComingSoon(category.type.slug) : null;
  if (soon) return { title: `${soon.name} — Coming soon`, robots: { index: false } };
  const name = category?.name ?? prettify(slug);
  const title = pageTitle(category?.seo_title || `Buy ${name} Online in India`);
  // A category with no products is thin content (e.g. the empty "-plants"
  // twins of indoor/outdoor/flowering): keep it out of the index, keep links followed.
  const { productTotal } = category ? await loadCategory(slug, category) : { productTotal: null };
  const noindex = Boolean(category?.noindex) || productTotal === 0;
  const typeSlug = category?.type?.slug;
  const description =
    category?.seo_description ||
    stripTags(category?.details).slice(0, 160) ||
    (typeSlug && typeSlug !== 'plants'
      ? `Shop ${name} online at PlantAtHome — ${typeSlug === 'tools' ? 'gardening tools' : String(category?.type?.name ?? 'garden essentials').toLowerCase()} delivered across India.`
      : `Shop ${name} at PlantAtHome — healthy, hand-checked plants and plant care delivered across 500+ Indian cities.`);
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
  // Keyed on the category's vertical: /c/planters-pots is a Tools category.
  const soon = category?.type?.slug ? await loadComingSoon(category.type.slug) : null;
  if (soon) {
    const { dehydratedState } = await loadGeneralData();
    return (
      <Hydrate state={dehydratedState}>
        <ComingSoonPageBody slug={category.type.slug} {...soon} />
      </Hydrate>
    );
  }
  const { dehydratedState } = await loadCategory(slug, category);
  const name = category?.name ?? prettify(slug);
  // The whole primary path, root first (matches the visible breadcrumb).
  const ancestors: { name: string; slug: string }[] = Array.isArray(category?.ancestors) ? category.ancestors : [];
  // BreadcrumbList emitted server-side (the client-side BreadcrumbJsonLd from
  // next-seo is shimmed to null in this app).
  const trail = [
    { name: 'Home', item: BASE },
    { name: 'Categories', item: `${BASE}/categories` },
    ...ancestors.map((a) => ({ name: a.name, item: `${BASE}/c/${a.slug}` })),
    { name, item: `${BASE}/c/${slug}` },
  ];
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, ...t })),
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
