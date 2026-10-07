import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Hydrate } from '@/compat/react-query-hydration';
import { loadHomeData, loadPlpData, loadToolsData, loadTypeName, loadTypeSlugs } from '@/framework/ssr/prefetch';
import HomeScreen from '@/app-shell/home-screen';
import { PageBody as PlpPageBody } from '@/page-bodies/plp';
import { PageBody as ToolsPageBody } from '@/page-bodies/tools';
import { getVerticalMeta } from '@/components/storefront/verticals';
// Plain module (no 'use client'), so the FAQ copy is real data here, not a client reference.
import { TOOLS_FAQS } from '@/components/tools/tools-content';
import { SITE_URL } from '@/lib/site-url';

/**
 * Verticals rendered as a real Product Listing Page (filters, sort, grid)
 * instead of the cinematic landing. Only `plants` for now — the owner's call;
 * the other verticals keep the hero landing until they get the same treatment.
 */
const PLP_VERTICALS = new Set(['plants']);

/** Verticals with their own designed landing (the owner's /tools mock). */
const TOOLS_VERTICALS = new Set(['tools']);

export const revalidate = 30;
export const dynamicParams = true;

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
  params: Promise<{ searchType: string }>;
}): Promise<Metadata> {
  const { searchType } = await params;
  // Reject unknown verticals HERE as well as in the page body, so a garbage
  // slug is never keyword-stuffed into <title>. (The root app/loading.tsx that
  // used to flush a 200 shell before this ran is gone — it made EVERY missing
  // page a soft 404, for Googlebot too — so the body's notFound() is a real
  // 404 again.) Fail-soft: if the types API is down (slugs = []), let the page
  // decide.
  const slugs: string[] = await loadTypeSlugs();
  if (slugs.length && !slugs.includes(searchType)) notFound();
  const name = (await loadTypeName(searchType)) ?? prettify(searchType);
  // A vertical's own SEO copy (verticals.ts) wins over the generic lines.
  const seo = getVerticalMeta(searchType).seo;
  return {
    title: seo?.title ?? `${name} Online in India`,
    description:
      seo?.description ??
      `Shop ${name.toLowerCase()} online at PlantAtHome — hand-checked quality, delivered across India.`,
    alternates: { canonical: `/${searchType}` },
  };
}

export async function generateStaticParams() {
  const slugs: string[] = await loadTypeSlugs(); // fail-soft → [] (built at runtime instead)
  return slugs.map((searchType) => ({ searchType }));
}

export default async function VerticalPage({ params }: { params: Promise<{ searchType: string }> }) {
  const { searchType: vertical } = await params;
  const name = (await loadTypeName(vertical)) ?? prettify(vertical);
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name, item: `${SITE_URL}/${vertical}` },
    ],
  };

  if (PLP_VERTICALS.has(vertical)) {
    const slugs = await loadTypeSlugs();
    if (slugs.length && !slugs.includes(vertical)) return notFound();
    const { dehydratedState, products, productTotal } = await loadPlpData(vertical);
    // The first server-rendered page as an ItemList, so the listing's products
    // are structured data too (the category pages only emit the breadcrumb).
    const itemList = products.length
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name,
          itemListElement: products.slice(0, 12).map((p: any, i: number) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: p.name,
            url: `${SITE_URL}/products/${p.slug}`,
          })),
        }
      : null;
    return (
      <Hydrate state={dehydratedState}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, '\\u003c') }}
        />
        {itemList && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList).replace(/</g, '\\u003c') }}
          />
        )}
        <PlpPageBody type={vertical} catalogueTotal={productTotal} />
      </Hydrate>
    );
  }

  if (TOOLS_VERTICALS.has(vertical)) {
    const slugs = await loadTypeSlugs();
    if (slugs.length && !slugs.includes(vertical)) return notFound();
    const { dehydratedState, products } = await loadToolsData(vertical);
    const collection = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Gardening Tools',
      url: `${SITE_URL}/${vertical}`,
      description: getVerticalMeta(vertical).seo?.description,
      // The server-rendered best-sellers, when the API lists any — never invented.
      ...(products.length > 0 && {
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: products.map((p: any, i: number) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: p.name,
            url: `${SITE_URL}/products/${p.slug}`,
          })),
        },
      }),
    };
    // The same TOOLS_FAQS the accordion renders, so the markup matches what is shown.
    const faq = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: TOOLS_FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    };
    return (
      <Hydrate state={dehydratedState}>
        {[breadcrumb, collection, faq].map((ld) => (
          <script
            key={ld['@type']}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }}
          />
        ))}
        <ToolsPageBody type={vertical} />
      </Hydrate>
    );
  }

  const data = await loadHomeData(vertical);
  if (!data) return notFound(); // unknown type slug (V1: notFound + revalidate)
  const { variables, layout, dehydratedState } = data;
  return (
    <Hydrate state={dehydratedState}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, '\\u003c') }}
      />
      <HomeScreen variables={{ ...variables, verticalPage: true }} layout={layout} />
    </Hydrate>
  );
}
