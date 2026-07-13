import dynamic from 'next/dynamic';
import { useBestSellingProducts } from '@/framework/product';
import { PlantAtHomeCardSkeleton } from '@/components/products/cards/plantathome';

const Carousel = dynamic(() => import('@/components/ui/carousel'), {
  ssr: false,
});
const PlantAtHomeCard = dynamic(
  () => import('@/components/products/cards/plantathome'),
  { ssr: false },
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
        <h2 className="flex items-center gap-2 text-lg font-bold text-forest-900">
          <span aria-hidden>🌿</span> Featured Plants
        </h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 px-1 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <PlantAtHomeCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <Carousel items={products} breakpoints={breakpoints}>
          {(item: any) => <PlantAtHomeCard product={item} />}
        </Carousel>
      )}
    </section>
  );
}
