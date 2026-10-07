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
 *  it (the second line is the longer one), so every width gets an explicit <br> before "for" (at
 *  26 px the second line is 261 px, inside a 320 px phone's column); the space kept before the
 *  <br> leaves the H1's text exactly HERO.title. */
const TITLE_LINES = HERO.title.match(/^(.+?) (for .+)$/);

/** Both CTAs, 44 px at every width: two equal columns on phones (one row down to 320 px; 13 px
 *  there keeps "Shop Gardening Tools" on one line at 360), auto width from sm. */
const CTA =
  'inline-flex h-11 items-center justify-center gap-2 rounded-control px-2 text-center text-[13px] font-semibold leading-tight transition-colors sm:px-5 sm:text-[14px]';

/**
 * The /tools hero (owner's mock, 2026-10-07): a compact full-bleed warm-cream strip (owner's
 * annotation: "make this in a strip and reduce the fonts size"; ~320–340 px tall from lg) with
 * the breadcrumb, eyebrow, H1 (site heading font), one-line pitch, two CTAs and the three-item
 * trust row; from lg up the potting-table photo fills the right 55% and fades in under the copy.
 * The band is the mock's own beige (#F1E8DA), not `bg-cream`: that token is near-white, so the
 * band vanished against the page and the photo's fade read as a white haze.
 *
 * Render it INSIDE the page's gutter container (`px-5 lg:px-6 xl:px-8`): the section bleeds
 * with matching negative margins and the copy re-adds the gutter, so it stays on the page grid.
 *
 * ONE photo element for every width, and it is the page's only `priority` image: below lg it is
 * a strip after the copy (`order-last`: 21:9 on phones, 208 px tall on tablets), from lg the
 * faded right 55%. So the photo on screen is always the eager, preloaded one.
 */
export function ToolsHero() {
  return (
    <section className="relative -mx-5 flex flex-col overflow-hidden bg-[#F1E8DA] lg:-mx-6 lg:block lg:min-h-[320px] xl:-mx-8 xl:min-h-[340px]">
      {/* Absolute from lg ⇒ painted above in-flow content, so the copy (later in the DOM) is `relative`. */}
      <div className="relative order-last aspect-[21/9] sm:aspect-auto sm:h-52 lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[55%] lg:[mask-image:linear-gradient(to_right,transparent,black_30%)]">
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

      {/* 52% (not 48%) so the 16 px pitch is one line from ~1050 px; text that reaches past 45%
          only meets the photo's transparent fade. */}
      <div className="relative px-5 pb-5 pt-4 lg:max-w-[52%] lg:px-6 lg:py-5 xl:px-8 xl:py-6">
        {/* Phones skip the visible trail to keep the hero short; the route's BreadcrumbList stays. */}
        <Breadcrumb
          className="mb-4 hidden sm:block"
          items={[{ label: 'Home', href: Routes.home }, { label: 'Tools' }]}
        />

        <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.18em] text-forest-700">
          {HERO.eyebrow}
        </p>
        <h1 className="mt-2 font-heading text-[26px] font-medium leading-[1.08] tracking-[-0.01em] text-forest-900 sm:text-[30px] lg:text-[38px]">
          {TITLE_LINES ? (
            <>
              {TITLE_LINES[1]} <br />
              {TITLE_LINES[2]}
            </>
          ) : (
            HERO.title
          )}
        </h1>
        {/* One line wherever the column allows (466 px at 15 px, 497 at 16; 52ch is 476 / 508);
            where it wraps (phones, 1024 px), `text-pretty` keeps "garden." from wrapping alone. */}
        <p className="mt-2 max-w-[52ch] text-pretty text-[15px] leading-normal text-forest-900/80 lg:text-[16px]">
          {HERO.sub}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 lg:mt-5">
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
        <ul className="mt-4 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-x-8 sm:gap-y-2 lg:mt-5 xl:gap-x-10">
          {HERO.trust.map((item) => {
            const Icon = TRUST_ICON[item.icon];
            return (
              <li key={item.t} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2.5">
                {Icon && <Icon size={20} className="shrink-0 text-forest-800" aria-hidden />}
                <span>
                  <span className="block text-[12px] font-semibold leading-tight text-forest-900">
                    {item.t}
                  </span>
                  {/* /70, not stone-500: 4.96:1 on the band (stone-500 was 2.82:1). */}
                  <span className="mt-0.5 block text-[11px] leading-tight text-forest-900/70">
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
