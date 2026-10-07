'use client';

import Breadcrumb from '@/components/ui/breadcrumb';
import SafeImage from '@/components/ui/safe-image';
import { Leaf, ShieldCheck, Truck } from '@/components/ui/icon';
import { getVerticalMeta } from '@/components/storefront/verticals';
import { resolveImageUrl, useHomeConfig } from '@/lib/use-home-config';
import { Routes } from '@/config/routes';

const TRUST_ICON = { truck: Truck, shield: ShieldCheck, leaf: Leaf } as const;

/** Built-in hero photo (owner's #5) when the admin has not set a Plants tile image. */
const FALLBACK_HERO = '/plants-plp-hero.webp';

export type PlpHeroProps = {
  /** The vertical slug (`plants`): picks the trust copy and the admin tile photo. */
  type: string;
  /** Rendered verbatim as the H1 (the e2e asserts /^Plants$/). */
  title: string;
  /** The line under the H1 (`meta.shopBlurb`); replaced by "Results for" in search mode. */
  subtitle: string;
  /** City-less catalogue total (`loadPlpData().productTotal`) — fills `{count}` in the
   *  trust row, rounded DOWN to tens ("860+ plants"); null hides that item. */
  total: number | null;
  /** Set on /plants/search: the subtitle becomes `Results for “term”`. */
  searchTerm?: string;
};

/**
 * The PLP hero band (mock 2026-10-07): full-bleed cream, H1 + subtitle,
 * the three-item trust row, and (lg+) the plants photo fading in from the
 * right. The parent renders it INSIDE the gutter container
 * (`px-5 lg:px-6 xl:px-8`); the section bleeds with matching negative margins
 * and re-adds the gutter so the copy stays on the page grid. Bottom padding
 * leaves room for the category card to overlap by 56px / 70px (`-mt-14 lg:-mt-[70px]`).
 *
 * No city line: the header chip is the one city control, on every page and
 * width (owner 2026-10-07 — the "Delivering to … · Change" line is gone).
 */
export default function PlpHero({ type, title, subtitle, total, searchTerm }: PlpHeroProps) {
  const { verticalsBand } = useHomeConfig();

  const tile = verticalsBand?.tiles?.find((t) => t?.typeSlug === type);
  const photo = resolveImageUrl(tile?.image ?? null) || FALLBACK_HERO;

  // "{count}+ plants" is filled from the real total rounded down to tens — never typed in.
  const rounded = typeof total === 'number' ? Math.floor(total / 10) * 10 : 0;
  const trust = (getVerticalMeta(type).heroTrust ?? [])
    .filter((item) => rounded > 0 || !item.t.includes('{count}'))
    .map((item) => ({
      ...item,
      t: item.t.replace('{count}', rounded.toLocaleString('en-IN')),
    }));

  return (
    <section className="relative -mx-5 overflow-hidden bg-[#FAF7F2] lg:-mx-6 lg:min-h-[290px] xl:-mx-8">
      {/* The photo sits behind the copy (lg+): absolute → painted above in-flow
          content, so the copy wrapper below is `relative` and later in the DOM. */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 hidden w-[44%] lg:block [mask-image:linear-gradient(to_right,transparent,black_35%)]"
      >
        <SafeImage
          variant="banner"
          src={photo}
          fallbackSrc={FALLBACK_HERO}
          alt=""
          fill
          priority
          className="object-cover"
        />
      </div>

      <div className="relative px-5 pb-[88px] pt-5 lg:px-6 lg:pb-[100px] lg:pt-6 xl:px-8">
        <Breadcrumb items={[{ label: 'Home', href: Routes.home }, { label: title }]} />

        <div className="mt-4 lg:mt-5 lg:max-w-[58%]">
          <h1 className="font-heading text-[36px] font-medium leading-none tracking-[-0.015em] text-forest-900 sm:text-[48px] lg:text-[60px]">
            {title}
          </h1>
          <p className="mt-3 text-[17px] leading-snug text-forest-800/80 lg:text-[21px]">
            {searchTerm ? (
              <>
                Results for <span className="font-semibold text-forest-900">“{searchTerm}”</span>
              </>
            ) : (
              subtitle
            )}
          </p>

          {trust.length > 0 && (
            <ul className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-7 sm:gap-y-3 lg:mt-6">
              {trust.map((item) => {
                const Icon = TRUST_ICON[item.icon as keyof typeof TRUST_ICON];
                return (
                  <li key={item.t} className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sage-100 text-forest-700">
                      {Icon ? <Icon size={20} aria-hidden /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold leading-tight text-forest-900">
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
          )}
        </div>
      </div>
    </section>
  );
}
