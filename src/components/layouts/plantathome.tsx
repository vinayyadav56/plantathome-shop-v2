import { useRouter } from '@/compat/next-router';
import { Element } from 'react-scroll';
import { useProducts } from '@/framework/product';
import { useCategories } from '@/framework/category';
import type { HomePageProps } from '@/types';
import { Hero } from '@/components/storefront/sections/hero';
import { TrustStrip } from '@/components/storefront/sections/trust-strip';
import { VerticalShowcase } from '@/components/storefront/sections/vertical-showcase';
import { CategoryGrid } from '@/components/storefront/sections/category-grid';
import { ProductGrid } from '@/components/storefront/sections/product-grid';
import { HomeVerticalGrids } from '@/components/storefront/sections/home-vertical-grids';
import { Benefits } from '@/components/storefront/sections/benefits';
import { GardenServiceBand } from '@/components/storefront/sections/garden-service-band';
import { PromiseBand } from '@/components/storefront/sections/promise-band';
import dynamic from 'next/dynamic';

// New "THE PLANT COMPANY" homepage (the user's mockup) — only the home type uses
// it; per-vertical pages keep the cinematic sections below.
// App Router port: PahHome + PlantCompanyHome always render on the home route —
// React.lazy (next/dynamic) here caused an infinite hydration-suspension loop
// under React 19; static imports are also faster (no client-side waterfall).
import { PlantCompanyHome } from '@/components/storefront/home';

// Phone-only home (<md) — faithful Claude Design "PlantAtHome Mobile Home".
// Tablet + desktop (>=md) get the production PlantCompanyHome below (adapted down on tablet).
import PahHome from '@/components/storefront/pah/home';

// Heavy, below-the-fold sections — lazy-loaded so the hero + first product rows
// paint fast (video clips + framer-motion only load when needed).
const StoryVideo = dynamic(
  () => import('@/components/storefront/sections/story-video').then((m) => m.StoryVideo),
  { ssr: false },
);
const RitualVideo = dynamic(
  () => import('@/components/storefront/sections/ritual-video').then((m) => m.RitualVideo),
  { ssr: false },
);
const Testimonials = dynamic(
  () => import('@/components/storefront/sections/testimonials').then((m) => m.Testimonials),
);
import { getVerticalMeta, HOME_SCENES } from '@/components/storefront/verticals';
import { useTypes } from '@/framework/type';
import { TYPES_PER_PAGE } from '@/framework/client/variables';

/**
 * Premium PlantAtHome storefront layout — mirrors the prototype's Home + Vertical
 * pages exactly (copy + section order), wired to live API data + the SSR cache.
 * `/` (isHome=plants) = brand intro + 3-vertical showcase; `/plants` `/tools`
 * `/farmbox` = each vertical's hero, real categories & products.
 */
export default function PlantAtHomeLayout({ variables }: HomePageProps) {
  const { query } = useRouter();
  const isFiltering = Boolean(query.text || query.category);

  const typeSlug: string = variables?.types?.type || 'plants';
  // Data-driven: the home experience belongs to the API's home type (first
  // settings.isHome), so /equipment, /fresh-fruits etc. render as verticals even
  // when production marks several types isHome. SSR prefetches TYPES → no flash.
  const { types } = useTypes({ limit: TYPES_PER_PAGE });
  const typeList = types ?? [];
  const homeSlug =
    typeList.find((t) => t?.settings?.isHome)?.slug ?? typeList[0]?.slug ?? typeSlug;
  const isHome = typeSlug === homeSlug;
  const currentType = typeList.find((t) => t.slug === typeSlug);
  const meta = getVerticalMeta(typeSlug, currentType?.name);

  const { categories, isLoading: catLoading } = useCategories(
    variables.categories,
  );
  const { products, isLoading, hasMore, loadMore, isLoadingMore } = useProducts({
    ...variables.products,
    ...(query.category && { categories: query.category }),
    ...(query.text && { name: query.text }),
  });

  // ── Hero copy (exact prototype text) ──
  const heroProps = isHome
    ? {
        scenes: HOME_SCENES,
        eyebrow: 'India’s premium plant studio',
        titleA: 'Bring the wild',
        titleB: 'indoors.',
        sub: 'Step into a home that breathes — plants, premium tools and farm-fresh organic produce, all delivered to your door across India.',
        primary: 'Shop the collection',
        primaryTo: '#products',
        tourTitle: 'Step inside a PlantAtHome home',
        tourSubtitle: meta.blurb,
      }
    : {
        scenes: meta.scenes,
        eyebrow: `PlantAtHome · ${meta.label}`,
        titleA: meta.tagline.split(' ').slice(0, -1).join(' '),
        titleB: meta.tagline.split(' ').slice(-1).join(' '),
        sub: meta.blurb,
        primary: `Shop ${meta.label}`,
        primaryTo: '#categories',
        tourTitle: `Inside the world of ${meta.label}`,
        tourSubtitle: meta.blurb,
      };

  // HOME (not filtering) → responsive: the Claude Design phone home (<md) and
  // the production "THE PLANT COMPANY" home (>=md; tablets get it adapted down).
  if (isHome && !isFiltering) {
    return (
      <>
        <div className="md:hidden">
          <PahHome />
        </div>
        <div className="hidden md:block">
          <PlantCompanyHome
            categories={categories}
            catLoading={catLoading}
            products={products}
            productsLoading={isLoading}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Hero {...heroProps} />

      <TrustStrip />

      {/* HOME → 3-vertical showcase; VERTICAL → real category grid */}
      {isHome && !isFiltering && <VerticalShowcase />}
      {!isHome && (
        <CategoryGrid
          categories={categories}
          typeSlug={typeSlug}
          isLoading={catLoading}
          eyebrow={`${meta.label} categories`}
          title="Shop by category."
        />
      )}

      <Element name="grid">
        {isHome && !isFiltering ? (
          // HOME → all three verticals as their own section, each with View all
          <HomeVerticalGrids />
        ) : (
          <ProductGrid
            products={products}
            typeSlug={typeSlug}
            isLoading={isLoading}
            eyebrow={isFiltering ? 'Search results' : `${meta.label} bestsellers`}
            title={
              isFiltering
                ? 'What you’re looking for.'
                : `This week in ${meta.label}.`
            }
            viewAllTo={`/${typeSlug}/search`}
            hasMore={hasMore}
            onLoadMore={loadMore}
            isLoadingMore={isLoadingMore}
          />
        )}
      </Element>

      {!isFiltering && (
        <>
          {isHome ? (
            <>
              <Benefits />
              <StoryVideo />
            </>
          ) : (
            <PromiseBand items={meta.promise} />
          )}
          <GardenServiceBand />
          <Testimonials />
          <RitualVideo />
        </>
      )}
    </>
  );
}
