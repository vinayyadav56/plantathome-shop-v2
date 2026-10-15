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
  /** The category card follows and overlaps the band's foot (browse mode). Without it the
   *  88/100px of bottom padding kept for that overlap was an empty band (search mode). */
  tiles?: boolean;
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
export default function PlpHero({ type, title, subtitle, total, searchTerm, tiles = true }: PlpHeroProps) {
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
    <section className="relative -mx-5 overflow-hidden bg-page lg:-mx-6 lg:min-h-[290px] xl:-mx-8">
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

      <div className={`relative px-5 pt-5 lg:px-6 lg:pt-6 xl:px-8 ${tiles ? 'pb-[88px] lg:pb-[100px]' : 'pb-2 lg:pb-4'}`}>
        <Breadcrumb items={[{ label: 'Home', href: Routes.home }, { label: title }]} className="[&_a]:text-[#333333] [&_li>span]:text-[#333333]" />

        <div className="mt-4 lg:mt-5 lg:max-w-[58%]">
          <h1 className="font-heading text-[36px] font-medium leading-none tracking-[-0.015em] text-[#141414] sm:text-[48px] lg:text-[60px]">
            {title}
          </h1>
          <p className="mt-3 text-[17px] leading-snug text-[#333333] lg:text-[21px]">
            {searchTerm ? (
              <>
                Results for <span className="font-semibold text-[#333333]">“{searchTerm}”</span>
              </>
            ) : (
              subtitle
            )}
          </p>

          {/* Trust row, ONE row at every width (owner 2026-10-13: "Delivery across India and the
              other text should come in a single row"). Icon-left items need ~740px for three
              across and a phone has 320-390, so below md the items are equal grid columns with
              the icon above centred, balanced text; from md it is the icon-left row, forced
              onto one line (flex-nowrap) with the gap tightened to 16px until lg. */}
          {trust.length > 0 && (
            <ul className="mt-5 grid auto-cols-fr grid-flow-col gap-3 md:flex md:flex-nowrap md:gap-x-4 lg:mt-6 lg:gap-x-7">
              {trust.map((item) => {
                const Icon = TRUST_ICON[item.icon as keyof typeof TRUST_ICON];
                // min-w-0 on the li: a flex child defaults to min-width:auto and refuses to
                // shrink below its content, which would push the forced row off the edge
                // instead of letting the labels wrap.
                return (
                  <li
                    key={item.t}
                    className="flex min-w-0 flex-col items-center gap-1.5 text-center md:flex-row md:gap-2.5 md:text-left lg:gap-3"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sage-100 text-forest-700">
                      {Icon ? <Icon size={20} aria-hidden /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-balance text-[13.943px] font-semibold leading-tight text-forest-900 md:text-[15.943px]">
                        {item.t}
                      </span>
                      <span className="mt-0.5 block text-balance text-[11.943px] leading-tight text-stone-500 md:text-[12.943px]">
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
