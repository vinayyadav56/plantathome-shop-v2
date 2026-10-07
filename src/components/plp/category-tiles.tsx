'use client';

import Link from 'next/link';
import cn from 'classnames';
import SafeImage from '@/components/ui/safe-image';
import { ArrowRight } from '@/components/ui/icon';
import { useCategories } from '@/framework/category';
import { useFilterFacets } from '@/framework/product';
import { CATEGORIES_PER_PAGE } from '@/framework/client/variables';

/** Image-box tints, cycled by tile index (the mock's pastel backdrops). */
const TINTS = ['bg-emerald-50', 'bg-sage-100', 'bg-rose-50', 'bg-amber-50', 'bg-sky-50', 'bg-lime-50'];
const MAX_TILES = 12;
const SKELETON_TILES = 10;

/**
 * "Shop by Category" — the white card that overlaps the hero's bottom edge
 * (`-mt-14 lg:-mt-[70px]`, so render it directly after the hero inside the
 * page's gutter container): title row + one snap-scrolling `.pah-rail` of
 * category tiles linking to /c/{slug}, 10 per row from `lg`.
 *
 * Tiles are the vertical's flagged root categories (`home: 1`, flagged order)
 * — the exact `useCategories` options loadPlpData seeds for SSR, so the first
 * paint is the server HTML; do not change them. Once the city-scoped facets
 * land, categories with no listed product in the city are dropped (matched by
 * slug), which also hides the empty duplicate categories prod has flagged.
 * Capped at 12 tiles. Renders nothing when there is nothing to show.
 *
 * @param type the vertical slug (`plants`)
 */
export default function CategoryTiles({ type }: { type: string }) {
  const { categories, isLoading } = useCategories({
    type,
    parent: 'null',
    limit: CATEGORIES_PER_PAGE,
    home: 1,
  });
  const facetCategories = useFilterFacets({ type }).data?.facets?.categories;

  // Facets absent (loading / 404) → every flagged category; present → only the
  // ones with a count > 0 in this city.
  const listed = facetCategories
    ? new Set(facetCategories.filter((f) => f.count > 0).map((f) => f.slug))
    : null;
  const items = (categories ?? [])
    .filter((c) => c?.slug && c?.name && (!listed || listed.has(c.slug)))
    .slice(0, MAX_TILES);

  const showSkeleton = isLoading && !items.length;
  if (!showSkeleton && !items.length) return null;

  return (
    <section
      aria-labelledby="plp-categories"
      // p-5 on every width: .pah-rail bleeds 20px into its parent's padding by design.
      className="relative z-10 -mt-14 rounded-2xl bg-white p-5 shadow-box lg:-mt-[70px]"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id="plp-categories" className="text-[18px] font-bold leading-none text-forest-900 sm:text-[22px]">
          Shop by Category
        </h2>
        <Link
          href="/categories"
          className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-forest-700 hover:text-forest-900"
        >
          <span>
            View all<span className="hidden sm:inline"> categories</span>
          </span>
          <ArrowRight size={14} aria-hidden />
        </Link>
      </div>

      {/* From lg the row holds every tile (6–10 slots, the mock's 10 when there are
          that many), so a seven-category vertical fills the card instead of leaving
          three empty slots; phones and tablets keep the snap rail. */}
      <ul
        className="pah-rail [--rail-w:44%] sm:[--rail-w:30%] lg:[--rail-w:calc((100%_-_(var(--rail-n)_-_1)*12px)/var(--rail-n))] gap-3"
        style={{ ['--rail-n' as string]: String(Math.min(Math.max(showSkeleton ? SKELETON_TILES : items.length, 6), 10)) } as React.CSSProperties}
      >
        {showSkeleton
          ? Array.from({ length: SKELETON_TILES }, (_, i) => (
              <li key={`sk-${i}`} className="rounded-lg border border-kraft-200 bg-white p-2" aria-hidden>
                <div className={cn('aspect-[7/5] animate-pulse rounded-md', TINTS[i % TINTS.length])} />
                <div className="mx-auto mt-2 h-3 w-2/3 animate-pulse rounded-full bg-sage-100" />
              </li>
            ))
          : items.map((c, i) => (
              <li key={c.id ?? c.slug}>
                <Link
                  href={`/c/${c.slug}`}
                  className="group block rounded-lg border border-kraft-200 bg-white p-2 hover:border-forest-700/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
                >
                  <span className={cn('relative block aspect-[7/5] overflow-hidden rounded-md', TINTS[i % TINTS.length])}>
                    <SafeImage
                      src={c.image?.original ?? c.banner_image?.original ?? ''}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 44vw, (max-width: 1024px) 30vw, 10vw"
                      quality={70}
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      fallback={null}
                    />
                  </span>
                  <span className="mt-2 block truncate text-center text-[13px] font-semibold leading-tight text-forest-900">
                    {c.name}
                  </span>
                </Link>
              </li>
            ))}
      </ul>
    </section>
  );
}
