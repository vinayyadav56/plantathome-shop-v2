'use client';
import React from 'react';
import type { Category, Product } from '@/types';
import { useHomeSections } from '@/lib/use-home-config';
import { useTypes } from '@/framework/type';
import { HeroPlant } from './hero-plant';
import { CategoryRow } from './category-row';
import { SpringSaleBand } from './spring-sale-band';
import { VerticalsBand } from './verticals-band';
import { Collections } from './collections';
import { BestSellers } from './best-sellers';
import { VerticalSection } from './vertical-section';
import { WhyPlants } from './why-plants';
import { GiftingBand } from './gifting-band';
import { TrustRow } from './trust-row';

/**
 * "THE PLANT COMPANY"-style homepage — the mockup the user provided, wired to live
 * data. Rendered only for the home type (see plantathome.tsx). The cinematic
 * 3-vertical / video layout is preserved for the per-vertical pages.
 */
export function PlantCompanyHome({
  categories,
  catLoading,
  products,
  productsLoading,
}: {
  categories?: Category[];
  catLoading?: boolean;
  products?: Product[];
  productsLoading?: boolean;
}) {
  // Configured per vertical in admin → Storefront Content → Homepage Sections.
  // null means "never configured", and the page then keeps its previous single
  // Collections + BestSellers layout — so this deploys without a settings edit
  // and an un-migrated environment is unchanged.
  const sections = useHomeSections();
  const { types } = useTypes({ limit: 100 });
  const labelFor = (slug: string) =>
    (types ?? []).find((t: any) => t?.slug === slug)?.name;

  return (
    <>
      {/* Section order matches the approved design reference (+ Verticals band):
          Hero → Category → Spring Sale → Verticals → Collections → Bestsellers → Why Plants → Gifting → Trust */}
      {/* Hero + category cards in one stacking context — cards float at hero
          bottom. Full-bleed 100%-width hero (per feedback). */}
      {/* Negative top margin pulls the hero up BEHIND the sticky glass pill so
          the pill's blur has the green environment behind it (md+ only — the
          phone home hides this header). Bottom margin clears the strip's 72px
          overhang before the next band. */}
      <div className="relative mb-16 md:-mt-[74px] md:mb-20 lg:-mt-[94px]">
        <HeroPlant />
        {/* z-20: must beat the hero's own z-10 content box, whose bottom padding
            overlaps this strip and would otherwise swallow the cards' clicks. */}
        <div className="absolute -bottom-[39px] left-1/2 z-20 w-[calc(100%-32px)] max-w-[1530px] -translate-x-1/2 md:w-[calc(100%-96px)]">
          <CategoryRow />
        </div>
      </div>
      <SpringSaleBand />
      <VerticalsBand />
      {sections ? (
        sections.map((section) => (
          <VerticalSection
            key={section.typeSlug}
            section={section}
            label={labelFor(section.typeSlug)}
          />
        ))
      ) : (
        <>
          <Collections />
          <BestSellers products={products} isLoading={productsLoading} />
        </>
      )}
      <WhyPlants />
      <GiftingBand />
      <TrustRow />
    </>
  );
}

export default PlantCompanyHome;
