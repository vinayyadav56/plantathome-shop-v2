'use client';
import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useCategories } from '@/framework/category';
import LineIcon from '@/components/icons/line-icons';
import BestSellers from '@/components/storefront/home/best-sellers';
import {
  resolveImageUrl,
  useHomeConfig,
  type HomeSection,
} from '@/lib/use-home-config';

/**
 * One homepage block for one vertical: a category row, then that vertical's
 * most-loved products.
 *
 * Replaces a single hardcoded "Shop Our Best Collections" section that could
 * show at most six cards and — the actual bug — was fetched with no vertical
 * filter, so it mixed Plants, Tools and FarmBox categories into one row.
 *
 * Nothing here knows the name of a vertical. It takes a config row and renders,
 * so adding Seeds later is one admin row and zero code.
 *
 * Used by BOTH homepage trees (desktop `storefront/home`, mobile
 * `storefront/pah`), which are otherwise separate component trees — one
 * implementation is why a change lands on both instead of drifting.
 */

const CATEGORY_LIMIT_CAP = 100; // API clamps here too; limit=1000 truncates the JSON mid-stream

type CardData = { slug: string; name: string; image?: string };

/** Round photo with a white ring, name beneath. */
function CategoryCard({ c }: { c: CardData }) {
  const [err, setErr] = React.useState(false);
  return (
    <Link
      href={`/c/${c.slug}`}
      className="group flex cursor-pointer flex-col items-center text-center"
    >
      <span className="relative block aspect-square w-full overflow-hidden rounded-full border-[3px] border-white bg-sage-100 shadow-[0_2px_10px_rgba(34,48,26,0.10)] ring-1 ring-kraft-200 transition duration-300 group-hover:shadow-[0_10px_26px_rgba(34,48,26,0.16)] group-hover:ring-forest-300">
        {c.image && !err ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.image}
            alt={c.name}
            loading="lazy"
            onError={() => setErr(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-sage-400">
            <LineIcon name="leaf" className="h-[26px] w-[26px]" />
          </span>
        )}
      </span>
      <span className="mt-3 font-hanken text-[14px] font-bold leading-tight text-forest-900 transition-colors group-hover:text-forest-700">
        {c.name}
      </span>
    </Link>
  );
}

export function VerticalSection({
  section,
  label,
}: {
  section: HomeSection;
  /** Vertical's display name, resolved by the caller from `types`. */
  label?: string;
}) {
  const { t } = useTranslation('common');

  const limit = Math.min(
    Math.max(Number(section.maxCategories) || 12, 1),
    CATEGORY_LIMIT_CAP,
  );

  // `home: 1` is the whole point — flagged + active categories of THIS vertical,
  // already ordered by homepage_sort_order server-side so every consumer agrees.
  const { categories, isLoading } = useCategories({
    type: section.typeSlug,
    parent: 'null',
    limit,
    home: 1,
  } as any);

  /**
   * Photos an admin uploaded against a category in the old Collections screen
   * (`homeCollections.cards[].image`).
   *
   * These are HAND-PICKED overrides — someone chose a nicer crop than the
   * category's own image — so they must keep winning. Reading only
   * `category.image` silently replaced every one of them with the un-curated
   * original, which looked exactly like the uploads had been thrown away.
   *
   * Keyed by slug, so an upload follows its category into whichever vertical
   * section that category now belongs to.
   */
  const { homeCollections } = useHomeConfig();
  const uploadedImage = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const card of homeCollections?.cards ?? []) {
      const url = resolveImageUrl(card?.image as any);
      if (card?.categorySlug && url) map.set(card.categorySlug, url);
    }
    return map;
  }, [homeCollections]);

  const cards: CardData[] = (categories ?? [])
    .map((c: any) => ({
      slug: c.slug,
      name: c.name,
      image:
        uploadedImage.get(c.slug) ||
        c.image?.original ||
        c.image?.thumbnail ||
        '',
    }))
    .filter((c: CardData) => c.slug && c.name);

  const showCategories = section.showCategories !== false && (isLoading || cards.length > 0);
  const showProducts = section.showProducts !== false;

  // Nothing to render → render NOTHING, not an empty shell. A heading with no
  // content below it is what makes a disabled section leave a blank band.
  if (!showCategories && !showProducts) return null;

  return (
    <>
      {showCategories ? (
        <section className="g-light-a">
          <div className="mx-auto max-w-none px-5 pb-[40px] pt-[40px] sm:px-8 lg:px-16 lg:pb-[52px] lg:pt-[48px]">
            <div className="mb-[26px] flex items-end justify-between gap-4">
              <div>
                <div className="mb-[9px] font-jost text-[11px] font-medium uppercase tracking-[0.2em] text-forest-600">
                  {label ?? t('home-collections-eyebrow')}
                </div>
                <h2 className="m-0 flex items-center gap-[9px] font-pahserif text-[26px] font-medium tracking-[-0.005em] text-forest-900 sm:text-[34px]">
                  {t('home-collections-title')}
                  <LineIcon name="lotus" className="h-[23px] w-[23px] text-forest-500" />
                </h2>
              </div>
              <Link
                href={`/${section.typeSlug}/search`}
                className="inline-flex shrink-0 items-center gap-[6px] whitespace-nowrap text-[14px] font-semibold text-forest-700"
              >
                {t('home-collections-view-all')}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>

            {/*
              Sits INSIDE the section gutter, so the first card lines up with the
              heading and with every other section on the page. It is deliberately
              not full-bleed — running to the screen edge lined the cards up with
              nothing and broke that symmetry.

              The widths are fractional (…/6.5, not /7) so when a row DOES
              overflow, a card is left half visible at the right — that half card
              is what says "this scrolls", with no fade or arrow needed.

              `[&>*]:!grow` is what stops that becoming a dead gap on short rows.
              .pah-rail pins every child to `flex: 0 0 var(--rail-w)`; adding
              flex-grow means a row with fewer cards than fit stretches them to
              fill the width exactly, while an overflowing row has no free space
              to distribute and keeps its half-card peek. One rule, both cases —
              no gap either way.

              No `justify-center`: these rows are unbounded, so overflow is the
              normal case, and centring a scrolling rail clips its leading cards.
            */}
            <div className="pah-rail grid grid-cols-2 gap-[18px] [&>*]:!grow [--rail-w:31%] sm:grid-cols-3 sm:[--rail-w:calc((100%_-_54px)/3.5)] md:[--rail-w:calc((100%_-_72px)/5.5)] lg:[--rail-w:calc((100%_-_90px)/6.5)]">
              {isLoading && cards.length === 0
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-3">
                      <div className="aspect-square w-full animate-pulse rounded-full bg-sage-100" />
                      <div className="h-3 w-2/3 animate-pulse rounded bg-sage-100" />
                    </div>
                  ))
                : cards.map((c) => <CategoryCard key={c.slug} c={c} />)}
            </div>
          </div>
        </section>
      ) : null}

      {/* Sibling, NOT nested: BestSellers renders its own <section> with its own
          gutters and full-bleed background band. Wrapping it in this section's
          padded container applied the gutters twice (px-16 inside px-16) and
          inset the band, so the row rendered visibly narrower than the page. */}
      {showProducts ? (
        <BestSellers
          typeSlug={section.typeSlug}
          limit={Number(section.maxProducts) || 10}
          headingLabel={label}
        />
      ) : null}
    </>
  );
}

export default VerticalSection;
