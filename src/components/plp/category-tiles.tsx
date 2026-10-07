'use client';

import Link from 'next/link';
import cn from 'classnames';
import SafeImage from '@/components/ui/safe-image';
import { ArrowRight } from '@/components/ui/icon';
import { useCategories } from '@/framework/category';
import { CATEGORIES_PER_PAGE } from '@/framework/client/variables';

/** Tile backdrops, cycled by index: what shows while a photo loads, or instead of a
 *  missing/dead one. Forest tones, so the white name reads (≥ 6:1) with no photo at all. */
const TINTS = ['bg-forest-700', 'bg-forest-600', 'bg-forest-800'];
const MAX_TILES = 12;
const SKELETON_TILES = 10;

/**
 * "Shop by Category" — the white card that overlaps the hero's bottom edge
 * (`-mt-14 lg:-mt-[70px]`, so render it directly after the hero inside the
 * page's gutter container): title row + one snap-scrolling `.pah-rail` of
 * full-bleed 4:5 photo tiles linking to /c/{slug}, the category name written
 * on the photo over a dark scrim (owner 2026-10-07), 10 per row from `lg`.
 *
 * Tiles are the vertical's flagged root categories (`home: 1`, flagged order)
 * — the exact `useCategories` options loadPlpData seeds for SSR, so the first
 * paint is the server HTML; do not change them. A flagged, active category
 * shows even while it holds no plant (the owner's call, 2026-10-07): which
 * tiles appear is curated in the admin (active + "show on homepage" + order),
 * not derived from stock. Capped at 12 tiles. Renders nothing when there is
 * nothing to show.
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
  const items = (categories ?? []).filter((c) => c?.slug && c?.name).slice(0, MAX_TILES);

  const showSkeleton = isLoading && !items.length;
  if (!showSkeleton && !items.length) return null;

  return (
    <section
      aria-labelledby="plp-categories"
      // p-5 on every width: .pah-rail bleeds 20px into its parent's padding by design.
      className="relative z-10 -mt-14 rounded-2xl bg-white p-5 shadow-box lg:-mt-[70px]"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id="plp-categories" className="font-heading text-[18px] font-medium leading-none text-forest-900 sm:text-[22px]">
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
          three empty slots; phones and tablets keep the snap rail. Tiles never go
          under 120px (lg below ~1410px, phones below ~350px): narrower, "Palms &
          Tropical Plants" can't fit two lines at 14px — the rail scrolls instead. */}
      <ul
        className="pah-rail gap-3 [--rail-w:max(120px,44%)] sm:[--rail-w:30%] lg:[--rail-w:max(120px,calc((100%_-_(var(--rail-n)_-_1)*12px)/var(--rail-n)))]"
        style={{ ['--rail-n' as string]: String(Math.min(Math.max(showSkeleton ? SKELETON_TILES : items.length, 6), 10)) } as React.CSSProperties}
      >
        {showSkeleton
          ? Array.from({ length: SKELETON_TILES }, (_, i) => (
              <li key={`sk-${i}`} aria-hidden>
                <div className="aspect-[4/5] animate-pulse rounded-lg bg-sage-100" />
              </li>
            ))
          : items.map((c, i) => (
              <li key={c.id ?? c.slug}>
                {/* `isolate` keeps Safari clipping the zoomed photo to the radius. */}
                <Link
                  href={`/c/${c.slug}`}
                  className={cn(
                    'group relative isolate block aspect-[4/5] overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2',
                    TINTS[i % TINTS.length],
                  )}
                >
                  <SafeImage
                    src={c.image?.original ?? c.banner_image?.original ?? ''}
                    alt=""
                    fill
                    // The painted tile: 44% of the phone rail, 30% sm–md, then the
                    // 120px floor until the exact-fit tenth overtakes it (~1410px).
                    sizes="(max-width: 639px) 40vw, (max-width: 1023px) 28vw, (max-width: 1439px) 120px, 9vw"
                    quality={70}
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    fallback={null}
                  />
                  {/* ≥ 65% forest ink up to 35% of the height (a two-line name tops
                      out at ~29% on the shortest tile), so white holds ≥ 4.5:1 even
                      over a pure-white photo; it fades out by 80%. */}
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-forest-950/90 via-forest-950/65 via-35% to-transparent to-80%"
                  />
                  <span className="absolute inset-x-0 bottom-0 p-2">
                    <span className="line-clamp-2 break-words font-heading text-[14px] font-semibold leading-tight text-white">
                      {c.name}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
      </ul>
    </section>
  );
}
