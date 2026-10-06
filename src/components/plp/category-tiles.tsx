'use client';

import Link from 'next/link';
import SafeImage from '@/components/ui/safe-image';
import { useCategories } from '@/framework/category';
import { CATEGORIES_PER_PAGE } from '@/framework/client/variables';
import { ArrowRight } from '@/components/ui/icon';

/**
 * "Shop by category" — the vertical's flagged, active root categories as photo
 * tiles linking to /c/{slug}. Images come from the category record (admin →
 * Categories → image); a category without one gets a quiet sage tile rather
 * than a placeholder photo. `home: 1` is what keeps unflagged duplicates out —
 * the old rail used `parent: 'null'` alone and showed empty categories.
 *
 * The query options must equal the SSR prefetch in loadPlpData exactly.
 */
export default function CategoryTiles({ type }: { type: string }) {
  const { categories, isLoading } = useCategories({
    type,
    parent: 'null',
    limit: CATEGORIES_PER_PAGE,
    home: 1,
  } as any);

  const items = (categories ?? []).filter((c: any) => c?.slug && c?.name);
  if (!isLoading && !items.length) return null;

  return (
    <section aria-labelledby="plp-categories" className="mt-10 sm:mt-12">
      <div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
        <h2 id="plp-categories" className="font-heading text-[26px] font-medium leading-none tracking-[-0.01em] text-forest-900 sm:text-[32px]">
          Shop by category
        </h2>
        <Link
          href="/categories"
          className="inline-flex shrink-0 items-center gap-1 text-[13.5px] font-semibold text-forest-700 hover:text-forest-900"
        >
          All categories <ArrowRight size={14} aria-hidden />
        </Link>
      </div>

      {/* Rail on phones (the parent carries ≥ 20px gutters), a 6-up grid from lg. */}
      <ul className="pah-rail [--rail-w:44%] sm:[--rail-w:30%] lg:[--rail-w:calc((100%_-_80px)/6)] grid grid-cols-2 gap-3 sm:gap-4">
        {(isLoading && !items.length ? Array.from({ length: 6 }) : items).map((c: any, i: number) =>
          c ? (
            <li key={c.id ?? c.slug}>
              <Link
                href={`/c/${c.slug}`}
                className="group relative block aspect-[4/3] overflow-hidden rounded-2xl border border-kraft-200 bg-sage-100 shadow-box focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
              >
                <SafeImage
                  src={c.image?.original ?? c.banner_image?.original ?? ''}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 60vw, (max-width: 1024px) 33vw, 16vw"
                  quality={70}
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  fallback={null}
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest-950/70 via-forest-950/20 to-transparent px-3 pb-3 pt-10">
                  <span className="block text-[14px] font-semibold leading-tight text-white drop-shadow sm:text-[15px]">
                    {c.name}
                  </span>
                </span>
              </Link>
            </li>
          ) : (
            <li key={`sk-${i}`} className="aspect-[4/3] animate-pulse rounded-2xl bg-sage-100" aria-hidden />
          ),
        )}
      </ul>
    </section>
  );
}
