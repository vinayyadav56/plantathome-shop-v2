'use client';

import Link from 'next/link';
import SafeImage from '@/components/ui/safe-image';
import { ArrowRight } from '@/components/ui/icon';
import { useCategories } from '@/framework/category';
import { CATEGORIES_PER_PAGE } from '@/framework/client/variables';
import { SectionHead } from './section-head';
import { SECTION } from './tools-content';

const MAX_TILES = 6;

/**
 * /tools "Shop by Category": the vertical's flagged root categories as image
 * tiles linking to /c/{slug}. The row holds 6 tiles from `lg` and becomes a
 * snap rail below that. Each tile shows the category's real image and its
 * `details` line from the admin.
 *
 * The useCategories options are the exact key loadToolsData prefetches, so the
 * tiles arrive as server HTML. Change both or neither.
 *
 * Shows skeleton tiles while loading and renders nothing once loaded with no
 * categories. `id="categories"` is the hero CTA's anchor.
 *
 * @param type the vertical slug (`tools`)
 */
export function ToolsCategories({ type }: { type: string }) {
  const { categories, isLoading } = useCategories({
    type,
    parent: 'null',
    limit: CATEGORIES_PER_PAGE,
    home: 1,
  });
  const items = categories.filter((c) => c?.slug && c?.name).slice(0, MAX_TILES);

  const showSkeleton = isLoading && !items.length;
  if (!showSkeleton && !items.length) return null;

  return (
    <section id="categories" aria-labelledby="tools-categories" className="mt-7 scroll-mt-24">
      <SectionHead id="tools-categories" {...SECTION.categories} />

      {/* The gap sits on a wrapper because .pah-rail sets its own negative margins
          to make room for the card shadows, and a margin utility on the rail would fight them. */}
      <div className="mt-5">
        <ul className="pah-rail [--rail-w:44%] sm:[--rail-w:30%] lg:[--rail-w:calc((100%_-_5*16px)/6)] gap-4">
          {showSkeleton
            ? Array.from({ length: MAX_TILES }, (_, i) => (
                <li key={i} aria-hidden className="overflow-hidden rounded-lg bg-white shadow-box">
                  <div className="aspect-[8/7] animate-pulse bg-sage-50" />
                  {/* Same line boxes as a loaded tile (20 / 4+2×18 / 16+20 px). Real `details` copy
                      wraps to two lines at every width, so the loaded row lands at this height. */}
                  <div className="p-3.5">
                    <div className="flex h-5 items-center">
                      <div className="h-3 w-2/3 animate-pulse rounded-full bg-sage-100" />
                    </div>
                    <div className="mt-1 flex h-9 flex-col justify-center gap-2">
                      <div className="h-2.5 w-5/6 animate-pulse rounded-full bg-sage-100" />
                      <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-sage-100" />
                    </div>
                    <div className="mt-4 flex h-5 items-center">
                      <div className="h-3 w-1/3 animate-pulse rounded-full bg-sage-100" />
                    </div>
                  </div>
                </li>
              ))
            : items.map((c) => (
                <li key={c.id ?? c.slug}>
                  {/* A flex column whose Explore line is pinned with mt-auto. The rail stretches
                      every tile to the tallest one, so a two-line `details` doesn't push its
                      Explore below the rest of the row (the mock's "Plant Care" tile). */}
                  <Link
                    href={`/c/${c.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-box focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
                  >
                    <div className="relative aspect-[8/7] overflow-hidden bg-sage-50">
                      {/* Decorative: the tile's heading already names the link. */}
                      <SafeImage
                        src={c.image?.original ?? ''}
                        alt=""
                        fill
                        sizes="(max-width: 639px) 44vw, (max-width: 1023px) 30vw, 16vw"
                        quality={70}
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        fallback={null}
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-3.5">
                      {/* Two lines, never an ellipsis: "Pruning & Cutting" needs 120 px and a six-up
                          tile at 1024 (or a phone rail tile) has a little less. */}
                      <h3 className="line-clamp-2 text-[14px] font-bold leading-5 text-forest-900">{c.name}</h3>
                      {c.details ? (
                        <p className="mt-1 line-clamp-2 text-[12px] leading-[18px] text-stone-600">{c.details}</p>
                      ) : null}
                      <span className="mt-auto flex items-center gap-1 pt-4 text-[13px] font-semibold leading-5 text-forest-900">
                        Explore
                        <ArrowRight size={14} aria-hidden />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
        </ul>
      </div>
    </section>
  );
}

export default ToolsCategories;
