import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Hydrate } from '@/compat/react-query-hydration';
import { loadProductData } from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/product';

export const revalidate = 60;

const BASE = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.plantathome.in'
).replace(/\/$/, '');

const stripHtml = (s?: string) =>
  (s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Called twice per request (here + the route body) — fine: loadProductData
  // goes through fetch caching under `revalidate = 60`.
  const data = await loadProductData(slug);
  if (!data) return {};
  const p: any = data.product;
  const description = stripHtml(p?.description).slice(0, 160);
  const url = `${BASE}/products/${slug}`;
  return {
    title: p?.name, // root layout template appends "| PlantAtHome"
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title: p?.name,
      description,
      images: p?.image?.original ? [p.image.original] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: p?.name,
      description,
      images: p?.image?.original ? [p.image.original] : undefined,
    },
  };
}

/**
 * Product + Offer JSON-LD, emitted server-side so it exists for crawlers that
 * do not run JS (the client-side ProductJsonLd from next-seo is shimmed to
 * null in this app). AggregateRating only when there are actual ratings —
 * emitting zeroes is a structured-data violation.
 */
function productJsonLd(p: any, url: string) {
  // First POSITIVE candidate wins — `??` alone would accept a literal 0
  // (variable products carry price=0 with a real min_price), skipping the
  // Offer or advertising ₹0.
  const price =
    [p?.sale_price, p?.price, p?.min_price]
      .map(Number)
      .find((n) => Number.isFinite(n) && n > 0) ?? 0;
  const data: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p?.name,
    url,
    description: stripHtml(p?.description).slice(0, 5000),
    image: p?.image?.original ? [p.image.original] : undefined,
    sku: p?.sku || undefined,
    brand: { '@type': 'Brand', name: 'PlantAtHome' },
  };
  if (price > 0) {
    data.offers = {
      '@type': 'Offer',
      url,
      priceCurrency: 'INR',
      price: price.toFixed(2),
      availability:
        p?.in_stock === false || Number(p?.quantity ?? 1) <= 0
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
    };
  }
  if (Number(p?.ratings ?? 0) > 0 && Number(p?.total_reviews ?? 0) > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(p.ratings).toFixed(1),
      reviewCount: Number(p.total_reviews),
    };
  }
  return data;
}

export default async function ProductRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await loadProductData(slug);
  if (!data) return notFound();
  return (
    <Hydrate state={data.dehydratedState}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // Server-authored from our own catalogue — JSON.stringify escapes the
          // strings, and the replace stops "</script" from ever terminating the
          // tag early.
          __html: JSON.stringify(
            productJsonLd(data.product, `${BASE}/products/${slug}`),
          ).replace(/</g, '\\u003c'),
        }}
      />
      <PageBody product={data.product} />
    </Hydrate>
  );
}
