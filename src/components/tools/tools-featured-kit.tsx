'use client';

import Link from 'next/link';
import cn from 'classnames';
import SafeImage from '@/components/ui/safe-image';
import { ArrowRight, Check } from '@/components/ui/icon';
import { compactPrice } from '@/components/products/cards/card-helpers';
import { useProducts } from '@/framework/product';
import usePrice from '@/lib/use-price';
import { Routes } from '@/config/routes';
import type { Product } from '@/types';
import { HERO_PHOTO, HERO_PHOTO_SIZES, SECTION } from './tools-content';

/** List rows carry `is_bundle` (product_type === bundle). The shared Product type doesn't declare it. */
type KitProduct = Product & { is_bundle?: boolean };

/**
 * /tools featured kit band: a photo on the left and a cream panel on the right
 * with the kit's name, contents, real price and a "View Tool Kit" link to its PDP.
 *
 * The kit is the tools product tagged `featured-kit` in the admin, otherwise the
 * best-selling Tool Set. Both lists use the same options as loadToolsData, so
 * they hydrate from the server. The checklist comes only from real
 * `bundle_items`, otherwise the description preview is shown. The band is
 * absent while there is no kit.
 *
 * @param type the vertical slug (`tools`)
 */
export function FeaturedKit({ type }: { type: string }) {
  const tagged = useProducts({ type, tags: 'featured-kit', limit: 1 });
  const topSet = useProducts({
    type,
    categories: 'tool-sets',
    limit: 1,
    orderBy: 'sold_quantity',
    sortedBy: 'DESC',
  });
  // Wait for the tagged list before falling back, so a slow tag lookup never
  // paints the top Tool Set and then swaps it for the tagged kit.
  const kit = (tagged.isLoading ? undefined : (tagged.products[0] ?? topSet.products[0])) as
    | KitProduct
    | undefined;

  const amount = Number(kit?.sale_price || kit?.price || kit?.min_price) || 0;
  // usePrice strikes the base only when it is above the amount, i.e. a real sale.
  const { price, basePrice } = usePrice({ amount, baseAmount: Number(kit?.price) || undefined });

  if (!kit) return null;

  const hasOwnImage = Boolean(kit.image?.original);
  const included = kit.is_bundle ? (kit.bundle_items ?? []).filter((item) => item?.name) : [];
  const isVariable = kit.product_type?.toLowerCase() === 'variable';

  return (
    <section
      aria-labelledby="tools-kit"
      className="mt-4 grid overflow-hidden rounded-lg shadow-box lg:grid-cols-2"
    >
      {/* Below lg the stand-in is a 2:1 strip on phones and 256 px tall on tablets, the geometry
          HERO_PHOTO_SIZES describes. Sharing that string with the hero, it picks the file the
          hero already preloaded at every width (from lg both resolve to the 1920w file). */}
      <div
        className={cn(
          'relative bg-[#F7F5EF] lg:aspect-auto lg:min-h-[420px]',
          hasOwnImage ? 'aspect-[4/3]' : 'aspect-[2/1] sm:aspect-auto sm:h-64 lg:h-auto',
        )}
      >
        {/* Until the kit has its own photo, the owner's stand-in is the hero photo cropped to its
            watering-can / trowel / gloves side. It is decorative: the H2 names the kit. */}
        <SafeImage
          src={kit.image?.original || HERO_PHOTO}
          fallbackSrc={HERO_PHOTO}
          alt={hasOwnImage ? kit.name : ''}
          fill
          sizes={hasOwnImage ? '(max-width: 1023px) 100vw, 50vw' : HERO_PHOTO_SIZES}
          quality={70}
          className={cn('object-cover', !hasOwnImage && 'object-[78%_50%]')}
        />
      </div>

      {/* The mock's warm off-white, a shade lighter at the top left than toward the bottom right. */}
      <div className="flex flex-col justify-center bg-gradient-to-br from-[#FAF6EE] to-[#F6F0E4] p-6 sm:p-8 lg:px-12 lg:py-10 xl:px-16">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-forest-700">
          {SECTION.kit.eyebrow}
        </p>
        <h2
          id="tools-kit"
          // Balanced lines give the mock's "The PlantAtHome / Essential Garden Kit" break
          // for any kit name, instead of a one-word orphan.
          className="mt-2 text-balance font-heading text-[28px] font-medium leading-tight tracking-[-0.005em] text-forest-900 lg:text-[34px]"
        >
          {kit.name}
        </h2>
        <p className="mt-3 text-[15px] text-stone-600 lg:text-[19px]">{SECTION.kit.sub}</p>

        {included.length > 0 ? (
          <ul className="mt-5 space-y-2.5">
            {included.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-[14px] leading-5 text-forest-900">
                <Check size={16} className="shrink-0 text-forest-700" aria-hidden />
                {item.name}
              </li>
            ))}
          </ul>
        ) : kit.description_preview ? (
          <p className="mt-4 line-clamp-3 text-[14px] leading-relaxed text-stone-600">{kit.description_preview}</p>
        ) : null}

        {/* The mock puts the price and the CTA on one row. They wrap on narrow panels. */}
        <div className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-4">
          {amount > 0 && (
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-[30px] font-bold leading-none text-forest-900">{compactPrice(price)}</span>
              {/* stone-600, not 500: 4.5:1+ on the panel. */}
              {isVariable && <span className="text-[14px] text-stone-600">onwards</span>}
              {basePrice && (
                <del className="text-[15px] text-stone-600">
                  <span className="sr-only">Was </span>
                  {compactPrice(basePrice)}
                </del>
              )}
            </p>
          )}
          <Link
            href={Routes.product(kit.slug)}
            className="inline-flex h-11 w-fit items-center gap-2 rounded-control bg-ds-btn px-6 text-[14px] font-semibold text-white hover:bg-ds-btn-hover lg:h-[52px] lg:text-[16px]"
          >
            {SECTION.kit.cta}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default FeaturedKit;
