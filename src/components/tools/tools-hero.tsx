'use client';

import Link from 'next/link';
import Breadcrumb from '@/components/ui/breadcrumb';
import SafeImage from '@/components/ui/safe-image';
import { ArrowRight, BadgeCheck, Heart, Truck } from '@/components/ui/icon';
import { Routes } from '@/config/routes';
import { HERO, type ToolIconKey } from './tools-content';

const TRUST_ICON: Partial<Record<ToolIconKey, typeof Truck>> = {
  badge: BadgeCheck,
  truck: Truck,
  heart: Heart,
};

const PHOTO = '/tools-hero.webp';
const PHOTO_ALT = 'Gardening tools on a potting table — secateurs, trowel, watering can and gloves';

/** The mock's H1 break: "Gardening Tools / for Every Green Space". Greedy wrapping can't produce
 *  it (the second line is the longer one), so sm+ gets an explicit <br> before "for"; the space
 *  kept before the <br> leaves the H1's text exactly HERO.title. */
const TITLE_LINES = HERO.title.match(/^(.+?) (for .+)$/);

/**
 * The /tools hero (owner's mock, 2026-10-07): a full-bleed warm-cream band with the breadcrumb,
 * eyebrow, serif H1, one-line pitch, two CTAs and the three-item trust row; from lg up the
 * potting-table photo fills the right 55% and fades in under the copy. The band is the mock's
 * own beige (#F1E8DA), not `bg-cream`: that token is near-white, so the band vanished against
 * the page and the photo's fade read as a white haze.
 *
 * Render it INSIDE the page's gutter container (`px-5 lg:px-6 xl:px-8`): the section bleeds
 * with matching negative margins and the copy re-adds the gutter, so it stays on the page grid.
 * Below lg the copy comes first, then the same photo as a strip (16:9 phones, 5:2 tablets).
 *
 * The desktop photo is the page's only `priority` image. Below lg its `sizes` resolves to 100vw,
 * the same as the strip's, so both pick the same candidate and the photo downloads once.
 */
export function ToolsHero() {
  return (
    <section className="relative -mx-5 overflow-hidden bg-[#F1E8DA] lg:-mx-6 lg:min-h-[440px] xl:-mx-8 xl:min-h-[480px]">
      {/* Absolute ⇒ painted above in-flow content, so the copy below is `relative` and later in the DOM. */}
      <div className="absolute inset-y-0 right-0 hidden w-[55%] lg:block [mask-image:linear-gradient(to_right,transparent,black_30%)]">
        <SafeImage
          src={PHOTO}
          variant="banner"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="object-cover object-right"
          alt={PHOTO_ALT}
        />
      </div>

      {/* 52% (not 48%) so the trust row stays one line at 1024; text that reaches past 45%
          only meets the photo's transparent fade. */}
      <div className="relative px-5 pb-7 pt-4 lg:max-w-[52%] lg:px-6 lg:py-10 xl:px-8">
        <Breadcrumb items={[{ label: 'Home', href: Routes.home }, { label: 'Tools' }]} />

        <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.18em] text-forest-700">
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
        <p className="mt-4 max-w-[42ch] text-[16px] leading-relaxed text-forest-900/80 lg:text-[17px]">
          {HERO.sub}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={HERO.primary.href}
            className="inline-flex h-11 items-center gap-2 rounded-control bg-ds-btn px-5 text-[14px] font-semibold text-white transition-colors hover:bg-ds-btn-hover"
          >
            {HERO.primary.label}
            <ArrowRight size={16} aria-hidden />
          </Link>
          <Link
            href={HERO.secondary.href}
            className="inline-flex h-11 items-center rounded-control border border-forest-900/25 bg-white/70 px-5 text-[14px] font-semibold text-forest-900 transition-colors hover:bg-white"
          >
            {HERO.secondary.label}
          </Link>
        </div>

        <ul className="mt-7 flex flex-wrap gap-x-7 gap-y-3">
          {HERO.trust.map((item) => {
            const Icon = TRUST_ICON[item.icon];
            return (
              <li key={item.t} className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sage-100 text-forest-700">
                  {Icon && <Icon size={18} aria-hidden />}
                </span>
                <span>
                  <span className="block text-[13px] font-semibold leading-tight text-forest-900">
                    {item.t}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-tight text-stone-500">
                    {item.d}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="relative mt-2 aspect-[16/9] sm:aspect-[5/2] lg:hidden">
        <SafeImage
          src={PHOTO}
          variant="banner"
          fill
          sizes="100vw"
          className="object-cover object-[70%_50%]"
          alt={PHOTO_ALT}
        />
      </div>
    </section>
  );
}

export default ToolsHero;
