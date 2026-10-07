'use client';

import Link from 'next/link';
import Breadcrumb from '@/components/ui/breadcrumb';
import SafeImage from '@/components/ui/safe-image';
import { ArrowRight, Leaf, ShieldCheck, Truck } from '@/components/ui/icon';
import { Routes } from '@/config/routes';
import { HERO, HERO_PHOTO, HERO_PHOTO_SIZES, type ToolIconKey } from './tools-content';

const TRUST_ICON: Partial<Record<ToolIconKey, typeof Truck>> = {
  shield: ShieldCheck,
  truck: Truck,
  leaf: Leaf,
};

const PHOTO_ALT = 'Gardening tools on a potting table — secateurs, trowel, watering can and gloves';

/** The mock's H1 break: "Gardening Tools / for Every Green Space". Greedy wrapping can't produce
 *  it (the second line is the longer one), so sm+ gets an explicit <br> before "for"; the space
 *  kept before the <br> leaves the H1's text exactly HERO.title. */
const TITLE_LINES = HERO.title.match(/^(.+?) (for .+)$/);

/** Both CTAs: two equal columns on phones (one row down to 320 px), auto width from sm. */
const CTA =
  'inline-flex h-11 items-center justify-center gap-2 rounded-control px-2 text-center text-[13px] font-semibold leading-tight transition-colors sm:px-5 sm:text-[14px] lg:h-[52px] lg:px-6 lg:text-[16px]';

/**
 * The /tools hero (owner's mock, 2026-10-07): a full-bleed warm-cream band with the breadcrumb,
 * eyebrow, serif H1, one-line pitch, two CTAs and the three-item trust row; from lg up the
 * potting-table photo fills the right 55% and fades in under the copy. The band is the mock's
 * own beige (#F1E8DA), not `bg-cream`: that token is near-white, so the band vanished against
 * the page and the photo's fade read as a white haze.
 *
 * Render it INSIDE the page's gutter container (`px-5 lg:px-6 xl:px-8`): the section bleeds
 * with matching negative margins and the copy re-adds the gutter, so it stays on the page grid.
 *
 * ONE photo element for every width, and it is the page's only `priority` image: below lg it is
 * a strip after the copy (`order-last`: 2:1 on phones, 256 px tall on tablets), from lg the
 * faded right 55%. So the photo on screen is always the eager, preloaded one.
 */
export function ToolsHero() {
  return (
    <section className="relative -mx-5 flex flex-col overflow-hidden bg-[#F1E8DA] lg:-mx-6 lg:block lg:min-h-[440px] xl:-mx-8 xl:min-h-[480px]">
      {/* Absolute from lg ⇒ painted above in-flow content, so the copy (later in the DOM) is `relative`. */}
      <div className="relative order-last aspect-[2/1] sm:aspect-auto sm:h-64 lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[55%] lg:[mask-image:linear-gradient(to_right,transparent,black_30%)]">
        <SafeImage
          src={HERO_PHOTO}
          variant="banner"
          fill
          priority
          sizes={HERO_PHOTO_SIZES}
          className="object-cover object-[70%_50%] lg:object-right"
          alt={PHOTO_ALT}
        />
      </div>

      {/* 52% (not 48%) so the trust row stays one line at 1024; text that reaches past 45%
          only meets the photo's transparent fade. */}
      <div className="relative px-5 pb-7 pt-6 sm:pt-4 lg:max-w-[52%] lg:px-6 lg:py-10 xl:px-8">
        {/* Phones skip the visible trail to keep the hero short; the route's BreadcrumbList stays. */}
        <Breadcrumb
          className="mb-6 hidden sm:block"
          items={[{ label: 'Home', href: Routes.home }, { label: 'Tools' }]}
        />

        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-forest-700">
          {HERO.eyebrow}
        </p>
        {/* 42px at lg: the second line is 529px at 52px, wider than the 1024 column. */}
        <h1 className="mt-3 font-[family-name:var(--font-plp-serif)] text-[34px] font-bold leading-[1.08] text-forest-900 sm:text-[44px] lg:text-[42px] xl:text-[52px]">
          {TITLE_LINES ? (
            <>
              {TITLE_LINES[1]} <br className="hidden sm:block" />
              {TITLE_LINES[2]}
            </>
          ) : (
            HERO.title
          )}
        </h1>
        {/* 40ch: the mock's break, "…water and care / for your garden." (490 px of 504 at 20 px). */}
        <p className="mt-4 max-w-[40ch] text-[16px] leading-relaxed text-forest-900/80 lg:text-[20px]">
          {HERO.sub}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <Link href={HERO.primary.href} className={`${CTA} bg-ds-btn text-white hover:bg-ds-btn-hover`}>
            {HERO.primary.label}
            <ArrowRight size={16} className="hidden shrink-0 sm:block" aria-hidden />
          </Link>
          <Link
            href={HERO.secondary.href}
            className={`${CTA} border border-forest-900/25 bg-white/70 text-forest-900 hover:bg-white`}
          >
            {HERO.secondary.label}
          </Link>
        </div>

        {/* Bare icons, as in the mock. Phones: three compact columns, icon above the two lines. */}
        <ul className="mt-6 grid grid-cols-3 gap-2 sm:mt-7 sm:flex sm:flex-wrap sm:gap-x-8 sm:gap-y-3 lg:mt-10 xl:gap-x-12">
          {HERO.trust.map((item) => {
            const Icon = TRUST_ICON[item.icon];
            return (
              <li key={item.t} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                {Icon && <Icon size={24} className="shrink-0 text-forest-800" aria-hidden />}
                <span>
                  <span className="block text-[13px] font-semibold leading-tight text-forest-900">
                    {item.t}
                  </span>
                  {/* /70, not stone-500: 4.96:1 on the band (stone-500 was 2.82:1). */}
                  <span className="mt-0.5 block text-[12px] leading-tight text-forest-900/70">
                    {item.d}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default ToolsHero;
