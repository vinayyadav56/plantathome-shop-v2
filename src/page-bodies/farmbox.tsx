'use client';

/**
 * The /farmbox vertical landing (staging slug `farmbox`, production `farm-box`), laid out to the
 * owner's 2026-10-09 mock: hero with the benefit bar → Shop by Category → Seasonal Freshness →
 * Our FarmBox Combos → the promise strip → From Farm to Your Home.
 *
 * Categories and products come from the API (copy lives in components/farmbox/farmbox-content);
 * both lists are server-prefetched under the hooks' exact keys, so the first paint is the server
 * HTML. Combos uses the same card as /tools, and shows its own empty state while no FarmBox
 * product is listed.
 */

import { getLayout as getSiteLayout } from '@/components/layouts/layout';
import {
  FarmboxCategories,
  FarmboxCombos,
  FarmboxHero,
  FarmStory,
  SeasonalBanner,
  TrustStrip,
} from '@/components/farmbox/farmbox-sections';

type Props = {
  /** The vertical slug (`farmbox` on staging, `farm-box` on production). */
  type: string;
};

function Farmbox({ type }: Props) {
  return (
    <main id="main-content" className="bg-page pb-16 sm:pb-20 lg:pb-24">
      {/* 20px gutters on phones: the category rail (.pah-rail) bleeds 20px into its parent's
          padding, and the full-bleed hero cancels exactly this padding. */}
      <div className="mx-auto max-w-[1920px] px-5 lg:px-6 xl:px-8">
        <FarmboxHero />
        <FarmboxCategories type={type} />
        <SeasonalBanner />
        <FarmboxCombos type={type} />
        <TrustStrip />
        <FarmStory />
      </div>
    </main>
  );
}

Farmbox.getLayout = getSiteLayout;

/* ── App Router body wrapper (V1 _app.tsx getLayout semantics) ── */
export function PageBody(props: Props) {
  return Farmbox.getLayout(<Farmbox {...props} />);
}

export default Farmbox;
