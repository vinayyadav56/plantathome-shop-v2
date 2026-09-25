'use client';
import React from 'react';
import SafeImage from '@/components/ui/safe-image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCategories } from '@/framework/category';
import {
  useHomeConfig,
  useHomeCategoryVerticals,
  applyCuration,
  filterByVerticals,
} from '@/lib/use-home-config';
import {
  ArrowRight,
  ChevronRight,
  LayoutGrid,
} from '@/components/ui/icon';

// Same query as collections.tsx (shared react-query cache). limit=1000 makes the
// categories API truncate its JSON mid-stream — see collections.tsx.
const HOME_CATEGORIES_LIMIT = 100;

// One neutral placeholder, not a rotating set. The old array was indexed by
// position, so a plant glyph could land on a Pots or Tools card and assert
// something false about that category.
const CATEGORY_FALLBACK = <LayoutGrid size={24} aria-hidden />;

function Thumb({ src, fallback }: { src: string; fallback: JSX.Element }) {
  const [err, setErr] = React.useState(false);
  if (err || !src) {
    // Neutral radial tile matching the image tiles — a dark tile would clash
    // inside the light glass panel.
    return (
      <div className="flex h-full w-full items-center justify-center text-[#39772b]/80">
        {fallback}
      </div>
    );
  }
  return (
    // object-cover fills the tile. The previous object-contain + 5px padding
    // letterboxed a 4:3 catalogue shot into ~30x22 of a 40px tile, which on a
    // near-white radial background inside translucent white glass read as
    // washed out. The phone twin (category-circles.tsx) has always used cover.
    // 44px tile (h-11 w-11 on the parent), so `sizes` is explicit rather than a
    // variant — this is the smallest image box on the site and the shared
    // category-circle preset would over-fetch it.
    <SafeImage
      src={src}
      alt=""
      fill
      sizes="44px"
      quality={65}
      onError={() => setErr(true)}
      className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
    />
  );
}

export function CategoryRow() {
  // `home: 1` is what makes this strip obey the admin. The categories API
  // filters on show_on_homepage + is_active and orders by homepage_sort_order
  // ONLY when it is passed (CategoryController), and vertical-section.tsx
  // already does. Without it the strip dumped every top-level category in raw
  // DB order — including the ones with no image (16 of 39 in production, which
  // is why shoppers saw grey placeholder tiles) and both halves of the
  // duplicated Indoor/Outdoor/Flowering/Watering pairs.
  const { categories: raw, isLoading } = useCategories({
    limit: HOME_CATEGORIES_LIMIT,
    parent: 'null',
    home: 1,
  } as any);
  const { homeCategories } = useHomeConfig();
  // `home: 1` says WHICH categories may appear; this says which verticals may,
  // and it is the admin's Homepage Sections switches. Filter before curating so
  // curation picks from the allowed set — and so its "stale slugs fall back to
  // everything" rule can never smuggle a switched-off vertical back in.
  const verticals = useHomeCategoryVerticals();
  // Twelve slots feeding a scrollable rail (six visible, the rest behind the
  // arrow). Which twelve — and their order — is admin curation's call.
  const categories = applyCuration(
    filterByVerticals(raw ?? [], verticals),
    homeCategories,
  ).slice(0, 12);
  const railRef = React.useRef<HTMLDivElement>(null);

  // Nothing to show — render no strip at all rather than an empty glass panel
  // with a scroll button. Below every hook, so the order stays stable.
  if (verticals?.size === 0) return null;
  if (!isLoading && categories.length === 0) return null;

  return (
    <section className="relative">
      {/* warm-glass panel the cards float on (design spec §8). Total height is
          pinned to the navbar pill: 56 card + 8 rail py + 12 panel p + 2
          border = 78px (annotation: strip = navbar height). */}
      <div className="relative rounded-[22px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.93),rgba(248,248,243,0.86))] p-1.5 shadow-[0_22px_60px_rgba(6,25,11,0.18),0_3px_10px_rgba(6,25,11,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-[24px] backdrop-saturate-[1.3]">
        <div
          ref={railRef}
          // py-1 gives the 3px hover lift headroom INSIDE the scroll box —
          // Chrome counts transformed boxes in scrollable overflow, so without
          // it the rail gains a 3px vertical scroll; overflow-y-hidden is the
          // backstop (annotation: "no top-bottom scroll in this section").
          className="flex gap-2.5 overflow-x-auto overflow-y-hidden scroll-smooth py-1 pr-12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {isLoading && categories.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[56px] min-w-[190px] flex-none animate-pulse rounded-xl bg-black/[0.05]" />
              ))
            : categories.map((c: any, i: number) => {
                const img = c.image?.original ?? c.image?.thumbnail ?? '';
                return (
                  <motion.div
                    key={c.id ?? c.slug}
                    className="min-w-[190px] flex-[1_0_190px]"
                    initial={{ y: 20 }}
                    whileInView={{ y: 0 }}
                    viewport={{ once: true, margin: '-20px' }}
                    transition={{ duration: 0.5, delay: (i % 6) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={`/c/${c.slug}`}
                      className="group flex h-[56px] items-center rounded-xl border border-[rgba(30,65,36,0.06)] bg-[linear-gradient(135deg,rgba(255,255,255,0.7),rgba(245,247,241,0.45))] p-2 transition-all duration-200 hover:-translate-y-[3px] hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(243,248,238,0.85))] hover:shadow-[0_10px_25px_rgba(15,55,24,0.1)]"
                    >
                      {/* product photo — left, 44x44 on a soft radial tile. object-cover, not
                          contain: at 40px with 5px padding a 4:3 shot rendered ~30x22 and
                          read as washed out against the near-white tile. */}
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[10px] bg-[radial-gradient(circle_at_50%_30%,#ffffff_0%,#f2f4ed_70%,#e9ede4_100%)]">
                        <Thumb src={img} fallback={CATEGORY_FALLBACK} />
                      </div>
                      {/* 56px fits one text row: name + arrow, no "Shop Now" line */}
                      <h4 className="min-w-0 flex-1 truncate pl-2.5 pr-1 text-[13px] font-normal leading-none text-[#1b2b1e]">
                        {c.name}
                      </h4>
                      <ArrowRight size={14} className="mr-1 shrink-0 text-[#39772b] transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                    </Link>
                  </motion.div>
                );
              })}
        </div>

        {/* rail scroller — touch scrolls natively below md */}
        <button
          type="button"
          aria-label="Scroll categories"
          onClick={() => railRef.current?.scrollBy({ left: 452, behavior: 'smooth' })}
          className="absolute right-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-[rgba(30,70,38,0.12)] bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(235,241,231,0.9))] text-[#23442b] shadow-[0_6px_18px_rgba(15,45,20,0.12)] transition-all duration-200 hover:scale-[1.06] hover:shadow-[0_10px_25px_rgba(15,45,20,0.18)] md:grid"
        >
          <ChevronRight size={20} aria-hidden />
        </button>
      </div>
    </section>
  );
}

export default CategoryRow;
