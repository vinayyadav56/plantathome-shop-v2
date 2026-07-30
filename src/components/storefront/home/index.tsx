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
      <div className="relative">
        <HeroPlant />
        <div className="absolute bottom-0 left-0 right-0 z-[5] pb-5 sm:pb-6">
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
