'use client';

/**
 * V1 pages/products/[slug].tsx body — takes `product` as a prop (fetched
 * server-side by app/products/[slug]/page.tsx, mirroring product.ssr.ts).
 *
 * Port note: always-rendered sections are STATIC imports (next/dynamic of
 * always-rendered components = infinite hydration-suspension loop under
 * React 19 — see P2). BookDetails (books-only, never this shop) stays lazy;
 * CartCounterButton stays {ssr:false}.
 *
 * Modern PDP order (2026-07 reorg): details (sticky gallery + info column)
 * → Frequently Bought Together (real data) → Plant care & details (merged
 * description/specs/video) → Styled Spaces (admin-config) → Reviews →
 * Q&A → You May Also Like last.
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
import ProductCard from '@/components/products/cards/card';
import StyledSpaces from '@/components/products/details/plantathome/styled-spaces';
import FrequentlyBoughtTogether from '@/components/products/details/plantathome/frequently-bought-together';
import PlantCareSection from '@/components/products/details/plantathome/plant-care-section';

const BookDetails = dynamic(() => import('@/components/products/details/book-details'));
const CartCounterButton = dynamic(() => import('@/components/cart/cart-counter-button'), { ssr: false });

/** One container class everywhere — the old page mixed three padding systems. */
const CONTAINER = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10';

const ProductPage = ({ product }: any) => {
  const { width } = useWindowSize();
  const related = (product?.related_products ?? []).filter(
    (r: any) => r.id !== product.id
  );
  // Same sanitizer the details panel uses — PlantCareSection receives
  // ready-to-render HTML.
  const contentHtml = useSanitizeContent({ description: product?.description ?? '' });

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
        <div className="min-h-screen overflow-x-clip bg-[#FAF8F2]">
          {product.type?.slug === 'books' ? (
            <BookDetails product={product} />
          ) : (
            <>
              <PlantAtHomeProductDetails product={product} />

              {/* Frequently Bought Together — REAL addons/related data */}
              <section className="bg-[#FAF8F2]">
                <div className={`${CONTAINER} pb-2 pt-6`}>
                  <FrequentlyBoughtTogether product={product} />
                </div>
              </section>

              {/* Plant care & details — merged description/specs/badges/video */}
              <section className="bg-white">
                <div className={`${CONTAINER} py-10`} id="care">
                  <PlantCareSection product={product} contentHtml={contentHtml || null} />
                </div>
              </section>

              {/* Styled in Real Spaces — admin-configurable (Product Page Sections) */}
              <StyledSpaces />

              {/* social proof before related — modern PDP order */}
              <ProductReviews
                productId={product?.id}
                productType={product?.type?.slug}
                ratings={Number(product?.ratings) || 0}
                totalReviews={Number(product?.total_reviews) || 0}
                ratingCount={product?.rating_count}
              />
              <ProductQuestions productId={product?.id} shopId={product?.shop?.id} productType={product?.type?.slug} />

              {/* You May Also Like — last */}
              {related.length > 0 && (
                <section className="bg-[#FAF8F2]">
                  <div className={`${CONTAINER} py-9`}>
                    <div className="mb-6 flex items-center justify-between">
                      <h2 className="flex items-center gap-2 text-[1.4rem] font-medium text-forest-700">
                        You May Also Like
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-forest-500"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" /><path d="M2 21c0-3 1.85-5.36 5.08-6" /></svg>
                      </h2>
                      <Link href="/plants/search" className="inline-flex items-center gap-1 text-[13px] font-semibold text-forest-600 hover:text-forest-700">
                        View All Plants
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                      {related.slice(0, 6).map((r: any) => (
                        <ProductCard key={r.id} product={r} cardType={r?.type?.slug} />
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
        {width > 767 && <CartCounterButton />}
      </AttributesProvider>
    </>
  );
};

/* ── App Router body wrapper (V1 _app.tsx getLayout semantics) ── */
export function PageBody({ product }: any) {
  return getLayout(<ProductPage product={product} />);
}

export default ProductPage;
