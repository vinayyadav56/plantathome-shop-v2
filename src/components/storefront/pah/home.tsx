'use client';
/* The homepage used to render its own <Footer>, stacking a SECOND footer under
   the layout's one: two <footer> elements and 9 links pointing at "#" (Our
   Story, Sustainability, Stores, even Contact). The layout footer already
   carries the same newsletter form, the real links and the legal entity, so
   the duplicate is gone rather than repaired. */
import React from 'react';
import Link from 'next/link';
import { Hero } from './hero';
import { SearchBar } from './search-bar';
import { CategoryCircles } from './category-circles';
import { SpecialOffer } from './special-offer';
import { VerticalsRail } from './verticals-rail';
import { Collections } from './collections';
import { BestSellers } from './best-sellers';
import { TrustRow } from './trust-row';
import { WhyPlants } from './why-plants';
import { CorporateGifting } from './corporate-gifting';
import { Gifting } from './gifting';
import { BottomNav } from './bottom-nav';
import { VerticalSection } from '@/components/storefront/home/vertical-section';
import { useHomeSections } from '@/lib/use-home-config';
import { useTypes } from '@/framework/type';
import {
  ArrowRight,
  Check,
  Mail,
  Recycle,
} from '@/components/ui/icon';


/**
 * Faithful reproduction of the Claude Design "PlantAtHome Mobile Home" (current
 * version) — Hanken Grotesk / Jost / Cormorant, forest/clay/gold/cream — bound to
 * live, city-scoped data. Centred as an app column on desktop (mobile <lg only).
 */
export default function PahHome(_props: { variables?: any }) {
  // The SAME component the desktop tree renders. These two trees are otherwise
  // separate and have drifted before; sharing the section is what keeps a
  // change landing on both.
  const sections = useHomeSections();
  const { types } = useTypes({ limit: 100 });
  const labelFor = (slug: string) =>
    (types ?? []).find((t: any) => t?.slug === slug)?.name;

  return (
    <div className="min-h-screen w-full bg-cream-100 font-hanken text-forest-900 antialiased">
      <div className="mx-auto min-h-screen max-w-[440px] overflow-hidden bg-cream-50 shadow-[0_0_60px_-30px_rgba(34,48,26,0.3)]">
        <Hero />
        <div className="relative rounded-t-[22px] bg-cream-50 pb-[calc(72px+env(safe-area-inset-bottom))]">
          <SearchBar />
          <CategoryCircles />
          <SpecialOffer />
          <VerticalsRail />
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
              <BestSellers />
            </>
          )}
          <WhyPlants />
          <CorporateGifting />
          <Gifting />
          {/* Trust badges close the page, right above the footer (matches desktop order). */}
          <TrustRow />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
