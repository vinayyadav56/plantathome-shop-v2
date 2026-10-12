'use client';

import { useState } from 'react';
import Link from 'next/link';
import cn from 'classnames';
import { useQueryClient } from 'react-query';
import SafeImage from '@/components/ui/safe-image';
import { Grid } from '@/components/products/grid';
import { SectionHead } from '@/components/tools/section-head';
import VerticalSearch from '@/components/ui/search/vertical-search';
import {
  ArrowDown,
  ArrowRight,
  Basket,
  Carrot,
  FlaskOff,
  Heart,
  Home,
  Package,
  Tractor,
  Truck,
  type LucideIcon,
} from '@/components/ui/icon';
import { useCategories } from '@/framework/category';
import { useProducts } from '@/framework/product';
import { API_ENDPOINTS } from '@/framework/client/api-endpoints';
import {
  HERO,
  HERO_BENEFITS,
  SEASONAL,
  SECTION,
  STORY,
  TRUST,
  categoriesQuery,
  combosQuery,
  type FarmboxIconKey,
  type IconCopy,
} from './farmbox-content';

/** farmbox-content's icon keys → glyphs. */
const ICONS: Record<FarmboxIconKey, LucideIcon> = {
  carrot: Carrot,
  truck: Truck,
  flask: FlaskOff,
  heart: Heart,
  tractor: Tractor,
  basket: Basket,
  package: Package,
  home: Home,
};

/** The page's content width: the spec's 1280–1440 px, not /tools' 1920. Sections sit inside the
 *  page's gutter container, so this is the content box; the hero re-adds the gutter itself. */
const WRAP = 'mx-auto w-full max-w-[1440px]';
const HERO_WRAP = 'mx-auto w-full max-w-[1504px] px-5 lg:px-6 xl:px-8';

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700';

/** Caveat, loaded by the route for /farmbox only (next/font, `--font-farmbox-script`). */
const SCRIPT = { fontFamily: 'var(--font-farmbox-script), cursive' } as const;

const EYEBROW = 'pa-eyebrow text-[11px] font-semibold uppercase leading-4 tracking-[0.42em] text-forest-700 sm:text-[12px]';

const BTN =
  'inline-flex h-12 items-center justify-center gap-2 rounded-control px-5 text-center text-[14px] font-semibold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2';
const BTN_PRIMARY = `${BTN} bg-ds-btn text-white hover:bg-ds-btn-hover`;
const BTN_OUTLINE = `${BTN} border border-forest-900/25 bg-white/70 text-forest-900 hover:bg-white`;

/** An outline glyph in a thin circle + title + one line (benefit bar, trust strip). */
function IconLine({ item, className }: { item: IconCopy; className?: string }) {
  const Icon = ICONS[item.icon];
  return (
    <li className={cn('flex items-center gap-3', className)}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-forest-900/15 bg-white text-forest-800 lg:h-11 lg:w-11">
        <Icon size={20} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold leading-tight text-forest-900 lg:text-[14px]">{item.t}</span>
        <span className="mt-0.5 block text-[12px] leading-tight text-forest-900/70">{item.d}</span>
      </span>
    </li>
  );
}

/** The hero note's hand-drawn arrow, curving down-left towards the crate. */
function NoteArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 44"
      width="48"
      height="44"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M42 3c-1 15-11 28-31 34" />
      <path d="M11 37l6-8M11 37l10 1" />
    </svg>
  );
}

/**
 * Hero (owner's mock): the produce photo fills the band edge to edge and the copy sits straight on
 * its calm, sunlit left side; no card behind it. A soft cream wash on the far left keeps the
 * copy's contrast where the photo's foreground leaves turn dark. Below lg the photo is a strip
 * first and the copy follows on cream. The benefit bar is ONE translucent bar that overlaps the
 * band's bottom edge from lg.
 *
 * Render it INSIDE the page's gutter container: the section bleeds with matching negative
 * margins, and the copy aligns with the 1440 px content box.
 *
 * The photo is the page's only `priority` image (LCP).
 */
export function FarmboxHero() {
  return (
    <section aria-labelledby="farmbox-hero-title" className="-mx-5 lg:-mx-6 xl:-mx-8">
      <div className="relative flex flex-col overflow-hidden bg-page lg:block">
        <div className="relative aspect-[16/9] sm:aspect-[21/9] lg:absolute lg:inset-0 lg:aspect-auto">
          <SafeImage
            src={HERO.photo}
            alt={HERO.photoAlt}
            fill
            priority
            quality={70}
            // Drawn wider than the viewport on phones: the 2.38:1 photo covers a 16:9 box.
            sizes="(min-width: 640px) 100vw, 135vw"
            className="object-cover object-[86%_50%] sm:object-[75%_50%] lg:object-[68%_46%]"
          />
          {/* Stronger below xl: there the copy column reaches ~49% of the band, over the photo's
              dark door frame and foliage (the lighter wash measured 1.31:1 under "sourced from"
              at 1024). From xl the column ends nearer 40% and the lighter wash keeps AA. */}
          <div
            aria-hidden
            className="absolute inset-0 hidden lg:block lg:bg-[linear-gradient(90deg,rgba(250,247,240,0.9)_0%,rgba(250,247,240,0.85)_50%,rgba(250,247,240,0)_64%)] xl:bg-[linear-gradient(90deg,rgba(250,247,240,0.9)_0%,rgba(250,247,240,0.72)_26%,rgba(250,247,240,0.28)_46%,rgba(250,247,240,0)_60%)]"
          />
        </div>

        <div
          className={cn(
            HERO_WRAP,
            'relative pb-7 pt-6 sm:pb-8 sm:pt-8 lg:flex lg:min-h-[470px] lg:flex-col lg:justify-center lg:pb-24 lg:pt-12 xl:min-h-[510px] 2xl:min-h-[550px]',
          )}
        >
          <div className="lg:max-w-[500px] xl:max-w-[580px]">
            <p className={EYEBROW}>{HERO.eyebrow}</p>
            <h1
              id="farmbox-hero-title"
              className="mt-3 font-heading text-[34px] font-medium leading-[1.06] tracking-[-0.02em] text-forest-950 sm:text-[42px] lg:text-[48px] xl:text-[56px] 2xl:text-[60px]"
            >
              {/* The spaces before each <br> keep the H1's text exactly HERO.title. */}
              {HERO.titleLines[0]} <br />
              {HERO.titleLines[1]} <br />
              {HERO.titleLines[2]}
            </h1>
            <p className="mt-4 max-w-[46ch] text-pretty text-[15px] leading-relaxed text-forest-900/80 sm:text-[16px] lg:text-[17px]">
              {HERO.sub}
            </p>
            {/* Plain <a>, not next/link: these jump within the page, and only a native fragment
                navigation moves the focus start (and a screen reader's cursor) to the section —
                with next/link the next Tab went back up to the hero. */}
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-3 lg:mt-8">
              <a href={HERO.primary.href} className={BTN_PRIMARY}>
                {HERO.primary.label}
                <ArrowRight size={16} className="shrink-0" aria-hidden />
              </a>
              <a href={HERO.secondary.href} className={BTN_OUTLINE}>
                <ArrowDown size={16} className="shrink-0" aria-hidden />
                {HERO.secondary.label}
              </a>
            </div>
          </div>

          {/* Decorative, so screen readers skip it; the H1 already says it. The mock's photo
              had a calm window up here; this one has leaves, so the note sits on a soft pool
              of sunlight that keeps the handwriting legible over any crop. */}
          <div
            aria-hidden
            className="pointer-events-none absolute right-[4%] top-8 hidden -rotate-6 text-forest-900 lg:block xl:right-[5%] xl:top-10"
          >
            <span className="absolute -inset-x-14 -inset-y-10 bg-[radial-gradient(closest-side,rgba(250,247,240,0.96),rgba(250,247,240,0.8)_55%,rgba(250,247,240,0))]" />
            <p style={SCRIPT} className="relative text-right text-[30px] leading-[1.02] xl:text-[36px]">
              {HERO.note[0]}
              <br />
              {HERO.note[1]}
            </p>
            <NoteArrow className="relative ml-auto mr-10 mt-1 h-10 w-11 xl:h-11 xl:w-12" />
          </div>
        </div>
      </div>

      <div className={cn(HERO_WRAP, 'relative z-10 bg-page pb-7 lg:-mt-16 lg:bg-transparent lg:pb-0')}>
        <ul
          aria-label="Why FarmBox"
          // Centred under the hero, each promise centred in its column (owner annotation 2026-10-09).
          className="grid grid-cols-2 gap-x-3 gap-y-5 rounded-lg border border-white/70 bg-white/80 p-4 shadow-box backdrop-blur-md md:grid-cols-4 md:gap-x-4 md:px-5 lg:mx-auto lg:w-[88%] lg:py-5 xl:w-[76%] 2xl:w-[68%]"
        >
          {HERO_BENEFITS.map((item) => (
            <IconLine key={item.t} item={item} className="md:justify-center" />
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * "Shop by Category": every root FarmBox category the API returns, as a round photo on a sage
 * disc with its name and an arrow, linking to /c/{slug}. One centred row from lg; a snap rail
 * below that (about 2.5–3 visible, so the row reads as scrollable).
 *
 * The useCategories options are categoriesQuery, which loadFarmboxData prefetches, so the
 * circles arrive as server HTML. Skeleton discs show only if that prefetch failed; the section
 * is absent when the API has no categories. `id="categories"` is the hero CTA's anchor.
 */
export function FarmboxCategories({ type }: { type: string }) {
  const { categories, isLoading } = useCategories(categoriesQuery(type));
  const items = categories.filter((c) => c?.slug && c?.name);

  const showSkeleton = isLoading && !items.length;
  if (!showSkeleton && !items.length) return null;

  return (
    <section id="categories" aria-labelledby="farmbox-categories" className={cn(WRAP, 'mt-12 scroll-mt-24 sm:mt-16 lg:mt-20')}>
      {/* The vertical's search box in the first row's right corner, as on /plants (owner 2026-10-12). */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-6">
        <SectionHead
          id="farmbox-categories"
          className="min-w-0 lg:flex-1"
          title={SECTION.categories.title}
          sub={SECTION.categories.sub}
          link={{ label: SECTION.categories.viewAll, href: `/categories/${type}` }}
        />
        <VerticalSearch type={type} className="lg:w-[340px] lg:shrink-0" />
      </div>

      {/* The gap sits on a wrapper: .pah-rail sets its own negative margins for the shadow room. */}
      <div className="mt-6 lg:mt-8">
        <ul className="pah-rail gap-4 [--rail-w:34%] sm:[--rail-w:min(30%,200px)] lg:gap-6 lg:[--rail-w:min(180px,calc((100%_-_6*24px)/7))] lg:[justify-content:safe_center]">
          {showSkeleton
            ? Array.from({ length: 6 }, (_, i) => (
                <li key={i} aria-hidden className="flex flex-col items-center">
                  <div className="aspect-square w-full animate-pulse rounded-full bg-sage-100" />
                  <div className="mt-3 flex h-5 items-center">
                    <div className="h-3 w-20 animate-pulse rounded-full bg-sage-100" />
                  </div>
                </li>
              ))
            : items.map((c) => (
                <li key={c.id ?? c.slug}>
                  <Link
                    href={`/c/${c.slug}`}
                    className={cn(
                      'group flex flex-col items-center rounded-lg text-center focus-visible:ring-offset-4 focus-visible:ring-offset-cream',
                      FOCUS_RING,
                    )}
                  >
                    <span className="block w-full rounded-full bg-sage-100 p-1.5 transition-colors duration-300 group-hover:bg-forest-200/60 sm:p-2">
                      <span className="relative block aspect-square overflow-hidden rounded-full bg-sage-50">
                        {/* Decorative: the link's text names the category. */}
                        <SafeImage
                          src={c.image?.original ?? ''}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 180px, (min-width: 640px) 200px, 34vw"
                          quality={65}
                          className="object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
                          fallback={
                            <span className="grid h-full w-full place-items-center text-forest-700/70">
                              <Basket size={32} aria-hidden />
                            </span>
                          }
                        />
                      </span>
                    </span>
                    <span className="mt-3 inline-flex max-w-full items-center gap-1 text-[14px] font-semibold leading-snug text-forest-900 lg:text-[15px]">
                      <span className="line-clamp-2">{c.name}</span>
                      <ArrowRight
                        size={14}
                        aria-hidden
                        className="shrink-0 text-forest-700 transition-transform duration-300 motion-safe:group-hover:translate-x-0.5"
                      />
                    </span>
                  </Link>
                </li>
              ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * "Seasonal Freshness in Every Box": a rounded sage-cream panel with the copy on the left, the
 * crate photo centre-right fading in at both edges, and a pale organic shape on the right edge
 * carrying the handwritten "Eat Fresh / Live Healthy". Stacks below lg (photo first).
 */
export function SeasonalBanner() {
  return (
    <section aria-labelledby="farmbox-seasonal" className={cn(WRAP, 'mt-12 sm:mt-16 lg:mt-20')}>
      <div className="relative flex flex-col overflow-hidden rounded-lg bg-sage-50 lg:block lg:min-h-[290px] xl:min-h-[310px]">
        <div className="relative aspect-[16/9] sm:aspect-[21/9] lg:absolute lg:inset-y-0 lg:left-[30%] lg:right-[12%] lg:aspect-auto lg:[mask-image:linear-gradient(to_right,transparent,black_18%,black_84%,transparent)]">
          <SafeImage
            src={SEASONAL.photo}
            alt={SEASONAL.photoAlt}
            fill
            quality={70}
            // The DRAWN width: the 2.73:1 photo is scaled to its box's height, ~920–990 px at every
            // lg+ width, ~1.35–1.55× the viewport on phones and tablets.
            sizes="(min-width: 1024px) 1000px, 135vw"
            className="object-cover object-[55%_50%]"
          />
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 top-1/2 hidden h-[122%] w-[24%] -translate-y-1/2 rounded-[46%_54%_42%_58%/55%_45%_55%_45%] bg-sage-100/60 lg:block"
        />
        <p
          aria-hidden
          style={SCRIPT}
          className="pointer-events-none absolute right-[4%] top-1/2 hidden -translate-y-1/2 -rotate-6 text-center text-[32px] leading-[1.05] text-forest-800 lg:block xl:right-[5%] xl:text-[38px]"
        >
          {SEASONAL.note[0]}
          <br />
          {SEASONAL.note[1]}
        </p>

        <div className="relative px-5 py-6 sm:px-8 sm:py-8 lg:flex lg:min-h-[290px] lg:max-w-[38%] lg:flex-col lg:justify-center lg:py-10 lg:pl-10 xl:min-h-[310px] xl:pl-14">
          <p className={EYEBROW}>{SEASONAL.eyebrow}</p>
          <h2
            id="farmbox-seasonal"
            className="mt-3 font-heading text-[26px] font-medium leading-[1.1] tracking-[-0.01em] text-forest-950 sm:text-[30px] lg:text-[32px] xl:text-[38px]"
          >
            {SEASONAL.titleLines[0]} <br />
            {SEASONAL.titleLines[1]}
          </h2>
          <p className="mt-3 max-w-[40ch] text-pretty text-[15px] leading-relaxed text-forest-900/80 lg:text-[16px]">
            {SEASONAL.sub}
          </p>
          <div className="mt-5">
            {/* In-page jump: a plain <a> for the same focus reason as the hero's CTAs. */}
            <a href={SEASONAL.cta.href} className={BTN_PRIMARY}>
              {SEASONAL.cta.label}
              <ArrowRight size={16} className="shrink-0" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * "Our FarmBox Combos": the vertical's listable products in the site's one product card, on the
 * same column ladder as /c (owner, 2026-10-09). Real products only.
 *
 * Grid only renders when there is something to draw (cards or first-load skeletons), so its own
 * empty state — hard-coded to /plants — never shows here. Ours: the empty line + a way on to the
 * categories, or, when the list failed, the error line + Try Again. The retry holds `retrying`
 * because a city-scoped query that never had data shows the server's (empty) list as placeholder
 * while it refetches, which would otherwise flash the empty state and unmount the button.
 */
export function FarmboxCombos({ type }: { type: string }) {
  const { products, isLoading, error } = useProducts(combosQuery(type));
  const queryClient = useQueryClient();
  const [retrying, setRetrying] = useState(false);

  const retry = () => {
    if (retrying) return;
    setRetrying(true);
    queryClient.invalidateQueries(API_ENDPOINTS.PRODUCTS).finally(() => setRetrying(false));
  };

  // Skeletons only on a first load — never during a retry, which keeps its disabled button up.
  const hasCards = products.length > 0 || (isLoading && !error && !retrying);
  const failed = !hasCards && (Boolean(error) || retrying);

  return (
    <section id="combos" aria-labelledby="farmbox-combos" className={cn(WRAP, 'mt-12 scroll-mt-24 sm:mt-16 lg:mt-20')}>
      <SectionHead
        id="farmbox-combos"
        title={SECTION.combos.title}
        sub={SECTION.combos.sub}
        link={products.length ? { label: SECTION.combos.viewAll, href: `/${type}/search` } : undefined}
      />

      {hasCards ? (
        <Grid
          products={products}
          isLoading={isLoading}
          // Below the hero's LCP image: no card image is preloaded.
          priorityCount={0}
          hasMore={false}
          limit={6}
          className="mt-6"
        />
      ) : (
        <div
          role="status"
          className="mt-6 flex flex-col items-center gap-4 rounded-lg border border-forest-900/10 bg-white px-6 py-10 text-center sm:py-12"
        >
          <span className="grid h-14 w-14 place-items-center rounded-full bg-sage-100 text-forest-800">
            <Basket size={24} aria-hidden />
          </span>
          <p className="max-w-[36ch] text-[16px] font-medium leading-snug text-forest-900 sm:text-[17px]">
            {failed ? SECTION.combos.error : SECTION.combos.empty}
          </p>
          {failed ? (
            // aria-disabled, not disabled: disabling the button the user just pressed drops their
            // keyboard focus to <body>.
            <button
              type="button"
              onClick={retry}
              aria-disabled={retrying || undefined}
              className={cn(BTN_PRIMARY, 'aria-disabled:cursor-wait aria-disabled:opacity-60')}
            >
              {SECTION.combos.retry}
            </button>
          ) : (
            <Link href={`/categories/${type}`} className={BTN_OUTLINE}>
              {SECTION.combos.emptyCta}
              <ArrowRight size={16} className="shrink-0" aria-hidden />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

/** The four promises on a light beige band, separated by thin rules from lg (2×2 below). */
export function TrustStrip() {
  return (
    <div className={cn(WRAP, 'mt-12 sm:mt-16 lg:mt-20')}>
      <ul
        aria-label="The FarmBox promise"
        className="grid grid-cols-2 gap-x-4 gap-y-6 rounded-lg bg-page px-5 py-6 sm:px-8 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-forest-900/10 lg:px-2 lg:py-7"
      >
        {TRUST.map((item) => (
          <IconLine key={item.t} item={item} className="lg:justify-center lg:px-5" />
        ))}
      </ul>
    </div>
  );
}

/**
 * "From Farm to Your Home": the farm photo beside the promise and four numbered steps (photo
 * first on phones). `id="how-it-works"` is the hero's secondary CTA. No "Our Sourcing Process"
 * button until a sourcing page exists (owner, 2026-10-09).
 */
export function FarmStory() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="farmbox-story"
      className={cn(WRAP, 'mt-12 scroll-mt-24 sm:mt-16 lg:mt-20')}
    >
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg lg:aspect-auto lg:h-full lg:min-h-[440px]">
          <SafeImage
            src={STORY.photo}
            alt={STORY.photoAlt}
            fill
            quality={70}
            // The DRAWN width: the 2.39:1 photo fills its box by height (≥440 px tall from lg, so
            // ~1050–1180 px wide; ~1.5× the viewport in the 16:10 box below lg).
            sizes="(min-width: 1024px) 1200px, 150vw"
            className="object-cover object-[58%_55%]"
          />
        </div>

        <div>
          <p className={EYEBROW}>{STORY.eyebrow}</p>
          <h2
            id="farmbox-story"
            className="mt-3 font-heading text-[28px] font-medium leading-[1.1] tracking-[-0.01em] text-forest-950 sm:text-[34px] lg:text-[38px] xl:text-[44px]"
          >
            {STORY.title}
          </h2>
          <p className="mt-4 max-w-[52ch] text-pretty text-[15px] leading-relaxed text-forest-900/80 lg:text-[17px]">
            {STORY.sub}
          </p>
          <ol className="mt-8 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {STORY.steps.map((step, i) => {
              const Icon = ICONS[step.icon];
              return (
                <li key={step.t} className="flex flex-col items-start">
                  <span className="grid h-14 w-14 place-items-center rounded-full border border-forest-900/15 bg-white text-forest-800 shadow-box">
                    <Icon size={24} aria-hidden />
                  </span>
                  <span aria-hidden className="mt-4 text-[12px] font-semibold tracking-[0.2em] text-forest-700">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="mt-1 text-[15px] font-semibold leading-snug text-forest-900">{step.t}</span>
                  <span className="text-[13px] leading-snug text-stone-600">{step.d}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
