import dynamic from 'next/dynamic';
import { useBestSellingProducts } from '@/framework/product';
import { Sparkles } from '@/components/ui/icon';
import { PlantAtHomeCardSkeleton } from '@/components/products/cards/plantathome';

/**
 * One row of placeholder cards, used for EVERY state in which the real cards
 * are not on screen yet.
 *
 * It exists because this section had three different "not ready" renderings —
 * the data-loading skeleton, the not-yet-downloaded Carousel chunk, and the
 * not-yet-downloaded card chunk — and two of them rendered nothing at all.
 * Sharing one placeholder is what keeps the section's height constant while
 * it settles.
 */
function FeaturedRowPlaceholder() {
  return (
    <div className="grid grid-cols-2 gap-4 px-1 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <PlantAtHomeCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * `loading` is NOT optional here, and leaving it off was a real bug.
 *
 * `dynamic(..., { ssr: false })` with no `loading` renders NULL until the chunk
 * arrives. This section sits directly above the result count and the product
 * grid on /search, so every time it rendered null the whole page below it
 * jumped up, and jumped back down when the chunk landed.
 *
 * Measured on production before this change (PerformanceObserver, layout-shift
 * entries, desktop 1200px): CLS 0.887, of which 0.789 was attributed to the
 * grid wrapper and the header row shifting by an identical amount — the
 * signature of something ABOVE both changing height. Not one shifting element
 * was an <img>; the images here already sit in sized containers.
 *
 * The section is 594px tall once settled (512px of card + 28px heading +
 * padding), so a null render is a ~550px jump.
 */
const Carousel = dynamic(() => import('@/components/ui/carousel'), {
  ssr: false,
  loading: () => <FeaturedRowPlaceholder />,
});

const PlantAtHomeCard = dynamic(
  () => import('@/components/products/cards/plantathome'),
  {
    ssr: false,
    // Same reasoning one level down: without this each slide is empty until
    // the card chunk loads, so the carousel itself collapses even after it has
    // mounted. Deliberately still `dynamic` rather than a static import —
    // statically importing the card is the known React 19 hydration-loop trap
    // in this app.
    loading: () => <PlantAtHomeCardSkeleton />,
  },
);

// Featured cards are larger than listing cards → fewer per view (reference-like).
const breakpoints = {
  320: { slidesPerView: 1.15, spaceBetween: 14 },
  540: { slidesPerView: 2, spaceBetween: 16 },
  900: { slidesPerView: 2.4, spaceBetween: 18 },
  1200: { slidesPerView: 3, spaceBetween: 20 },
};

/** "Featured Plants" carousel on a soft gradient panel (reference Featured section). */
export default function FeaturedPlants() {
  // Scope to the Plants vertical so Tools / FarmBox / Pots don't leak into a
  // section titled "Featured Plants" (best-selling is cross-vertical by default).
  const { products, isLoading } = useBestSellingProducts({
    limit: 12,
    type_slug: 'plants',
  });

  if (!isLoading && !products?.length) return null;

  return (
    <section className="mb-8 rounded-2xl border border-kraft-200/70 bg-[linear-gradient(135deg,#FBF6EE_0%,#F4F0E6_45%,#EDF4EC_100%)] p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 text-lg font-medium text-forest-900">
          <Sparkles size={18} className="shrink-0 text-forest-600" aria-hidden /> Featured Plants
        </h2>
      </div>

      {isLoading ? (
        <FeaturedRowPlaceholder />
      ) : (
        <Carousel items={products} breakpoints={breakpoints}>
          {(item: any) => <PlantAtHomeCard product={item} />}
        </Carousel>
      )}
    </section>
  );
}
