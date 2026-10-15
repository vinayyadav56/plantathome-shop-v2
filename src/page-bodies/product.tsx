'use client';

/**
 * V1 pages/products/[slug].tsx body — takes `product` as a prop (fetched
 * server-side by app/products/[slug]/page.tsx, mirroring product.ssr.ts).
 *
 * Port note: always-rendered sections are STATIC imports (next/dynamic of
 * always-rendered components = infinite hydration-suspension loop under
 * React 19 — see P2). BookDetails (books-only, never this shop) stays lazy.
 *
 * Modern PDP order (2026-07 reorg): details (sticky gallery + info column)
 * → Frequently Bought Together (real data) → Plant care & details (merged
 * description/specs/video) → Styled Spaces (admin-config) → Reviews →
 * Q&A → You May Also Like last. From xl, Reviews + Q&A and You May Also Like
 * share one row (2026-10-10).
 */

import Link from 'next/link';
import { getLayout } from '@/components/layouts/layout';
import { AttributesProvider } from '@/components/products/details/attributes.context';
import Seo from '@/components/seo/seo';
import { useWindowSize } from '@/lib/use-window-size';
import { useSanitizeContent } from '@/lib/sanitize-content';
import ProductQuestions from '@/components/questions/product-questions';
import ProductReviews from '@/components/reviews/product-reviews';
import isEmpty from 'lodash/isEmpty';
import dynamic from 'next/dynamic';

import PlantAtHomeProductDetails from '@/components/products/details/plantathome-details';
import { Sparkles, ArrowRight } from '@/components/ui/icon';
import ProductCard from '@/components/products/cards/card';
import StyledSpaces from '@/components/products/details/plantathome/styled-spaces';
import FrequentlyBoughtTogether from '@/components/products/details/plantathome/frequently-bought-together';
import PlantCareSection from '@/components/products/details/plantathome/plant-care-section';
import { getVariations } from '@/lib/get-variations';
import { useEffect } from 'react';
import { track } from '@/lib/analytics/track';

const BookDetails = dynamic(() => import('@/components/products/details/book-details'));

/** One container class everywhere — the old page mixed three padding systems. The
 *  listing pages' width (owner annotation 2026-10-10: "not utilizing the full space"):
 *  up to 1920px, the same gutters as /plants from sm up. Keep in step with the details
 *  panel and Styled Spaces, which carry the same classes. */
const CONTAINER = 'mx-auto w-full max-w-[1920px] px-4 sm:px-6 xl:px-8';

const ProductPage = ({ product }: any) => {
  const { width } = useWindowSize();
  // product_view carries the catalogue ids (the page_view only has the path).
  useEffect(() => {
    if (!product?.id) return;
    const category = product?.categories?.[0];
    track('product_view', {
      label: product?.name,
      value: Number(product?.sale_price ?? product?.price) || undefined,
      meta: { product_id: product.id, category_id: category?.id, category: category?.name },
    });
  }, [product?.id]);
  const related = (product?.related_products ?? []).filter(
    (r: any) => r.id !== product.id
  );
  // Same sanitizer the details panel uses — PlantCareSection receives
  // ready-to-render HTML.
  const contentHtml = useSanitizeContent({ description: product?.description ?? '' });
  // Size guide — the popup version lives on the size picker; the page copy sits
  // inside Plant care & details (owner 2026-10-14).
  const sizeOptions: any[] =
    product?.product_type?.toLowerCase() === 'variable'
      ? ((getVariations(product?.variations) as any)?.size ?? [])
      : [];
  const hasSizeGuide = Boolean(product?.size_guide?.original) || sizeOptions.length > 0;

  return (
    <>
      <Seo
        title={product.name}
        url={product.slug}
        images={!isEmpty(product?.image) ? [product.image] : []}
      />
      <AttributesProvider>
        {/* overflow-x-CLIP (not hidden): hidden creates a scroll container and
            silently disables position:sticky for every descendant — the
            sticky gallery depends on this. */}
        <div className="min-h-screen overflow-x-clip bg-page">
          {product.type?.slug === 'books' ? (
            <BookDetails product={product} />
          ) : (
            <>
              <PlantAtHomeProductDetails product={product} />

              {/* Frequently Bought Together — REAL addons/related data */}
              <section className="bg-page">
                <div className={`${CONTAINER} pb-2 pt-6`}>
                  <FrequentlyBoughtTogether product={product} />
                </div>
              </section>

              {/* Plant care & details — merged description/specs/badges/video */}
              <section className="bg-white">
                <div className={`${CONTAINER} py-10`} id="care">
                  <PlantCareSection
                    product={product}
                    contentHtml={contentHtml || null}
                    sizeGuide={hasSizeGuide ? { sizeGuide: product?.size_guide, sizes: sizeOptions, name: product?.name } : null}
                  />
                </div>
              </section>

              {/* Styled in Real Spaces — admin-configurable (Product Page Sections) */}
              <StyledSpaces />

              {/* Social proof, then related. From xl they sit side by side (owner annotation
                  2026-10-10): reviews + Q&A on the left, "You May Also Like" on the right as
                  two cards per row. Below xl, and for a product with no related items, the
                  page stacks exactly as before — reviews → Q&A → related. */}
              <div
                className={`${CONTAINER} ${
                  related.length > 0
                    ? 'xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] xl:items-start xl:gap-x-10'
                    : ''
                }`}
              >
                <div className="min-w-0">
                  <ProductReviews
                    productId={product?.id}
                    productType={product?.type?.slug}
                    ratings={Number(product?.ratings) || 0}
                    totalReviews={Number(product?.total_reviews) || 0}
                    ratingCount={product?.rating_count}
                  />
                  <ProductQuestions productId={product?.id} shopId={product?.shop?.id} productType={product?.type?.slug} />
                </div>

                {related.length > 0 && (
                  <section className="min-w-0 py-9 xl:py-10">
                    <div className="mb-6 flex items-center justify-between gap-3">
                      <h2 className="flex items-center gap-2 text-[1.4rem] font-medium text-[#141414]">
                        You May Also Like
                        <Sparkles size={20} className="text-forest-500" aria-hidden />
                      </h2>
                      <Link href="/plants" data-t="pdp.link" className="inline-flex shrink-0 items-center gap-1 text-[13.943px] font-semibold text-forest-600 hover:text-forest-700">
                        View All Plants
                        <ArrowRight size={14} aria-hidden />
                      </Link>
                    </div>
                    {/* Four cards: 2×2 on a phone, one row of four on a tablet, and two
                        side by side in the desktop column — a fixed ~27rem column, so the
                        cards stay ~210px (owner: "these card size is too big" at ~270px)
                        and reviews + Q&A take the extra width. */}
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-2 xl:gap-4">
                      {related.slice(0, 4).map((r: any) => (
                        <ProductCard key={r.id} product={r} cardType={r?.type?.slug} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </>
          )}
        </div>
      </AttributesProvider>
    </>
  );
};

/* ── App Router body wrapper (V1 _app.tsx getLayout semantics) ── */
export function PageBody({ product }: any) {
  return getLayout(<ProductPage product={product} />);
}

export default ProductPage;
