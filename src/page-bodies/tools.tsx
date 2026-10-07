'use client';

/**
 * The /tools vertical landing, laid out to the owner's 2026-10-07 mock: hero →
 * Shop by Category → Tools gardeners love → "Not sure what you need?" →
 * featured kit → task tiles → "Why shop" → guides beside the FAQs.
 *
 * Every product, category, price and image comes from the API (the copy lives
 * in components/tools/tools-content). The product sections key their queries
 * exactly like loadToolsData's SSR prefetch, so the first paint is the server
 * HTML, and each one renders nothing when the API lists no products.
 *
 * Spacing: each section carries its own top margin, measured off the mock (24–40 px
 * between sections, 16 px between the need band and the kit); only the guides/FAQ
 * row's comes from here, because those two sit side by side in one grid. From lg
 * the guides sit on the mock's white panel, which bleeds to the page's left edge.
 *
 * The page is cream, not white: the mock's background samples #FBFAF6, and the
 * white tiles, cards and icon discs are drawn to sit on it (as on /plants).
 */

import { getLayout as getSiteLayout } from '@/components/layouts/layout';
import ToolsHero from '@/components/tools/tools-hero';
import ToolsCategories from '@/components/tools/tools-categories';
import ToolsBestsellers from '@/components/tools/tools-bestsellers';
import FeaturedKit from '@/components/tools/tools-featured-kit';
import { NeedBand, TaskTiles, ToolsFaq, ToolsGuides, WhyBand } from '@/components/tools/tools-sections';

type Props = {
  /** The vertical slug (`tools`). */
  type: string;
};

function Tools({ type }: Props) {
  return (
    <main id="main-content" className="bg-cream pb-14 sm:pb-20">
      {/* 20px gutters on phones: the category rail (.pah-rail) bleeds 20px into
          its parent's padding, and the full-bleed bands cancel exactly this padding. */}
      <div className="mx-auto max-w-[1920px] px-5 lg:px-6 xl:px-8">
        <ToolsHero />
        <ToolsCategories type={type} />
        <ToolsBestsellers type={type} />
        <NeedBand />
        <FeaturedKit type={type} />
        <TaskTiles />
        <WhyBand />
        <div className="mt-9 grid gap-10 lg:grid-cols-3">
          <ToolsGuides
            type={type}
            className="lg:col-span-2 lg:-ml-6 lg:rounded-tr-lg lg:bg-white lg:py-7 lg:pl-6 lg:pr-7 xl:-ml-8 xl:pl-8"
          />
          <ToolsFaq className="lg:pt-7" />
        </div>
      </div>
    </main>
  );
}

Tools.getLayout = getSiteLayout;

/* ── App Router body wrapper (V1 _app.tsx getLayout semantics) ── */
export function PageBody(props: Props) {
  return Tools.getLayout(<Tools {...props} />);
}

export default Tools;
