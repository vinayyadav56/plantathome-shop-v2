'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { goToSignin } from '@/lib/go-to-signin';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { useToggleWishlist, useInWishlist } from '@/framework/wishlist';
import { useUser } from '@/framework/user';
import usePrice from '@/lib/use-price';
import { getCardBadge } from '@/components/products/cards/card-helpers';
import { PlantMark } from '@/components/storefront/logo-mark';
import { plantFeatures, FeatureGlyph } from '@/components/products/cards/plant-features';
import type { Product } from '@/types';

/**
 * The LISTING card — the reference design's anatomy (large 2-up card: image
 * with heart + badge, name, a labelled "Features" 2×3 icon grid, then a BIG
 * price beside a black "View Details →" pill) with our plant data and copy.
 *
 * Used only by the listing grid (search + category pages) via Grid's
 * `variant="listing"`; home grids and rails keep the compact PlantAtHome card.
 * STATIC import chain only — next/dynamic of always-rendered cards
 * infinite-loops hydration under React 19 in this codebase.
 */

const Heart = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill={active ? '#C26B45' : 'none'} stroke={active ? '#C26B45' : '#555555'} strokeWidth="1.8" className="h-5 w-5">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

type Props = { product: Product; className?: string; priority?: boolean };

const PrimeListingCard: React.FC<Props> = ({ product, className = '', priority = false }) => {
  const [imgError, setImgError] = useState(false);
  const { openModal } = useModalAction();
  const { isAuthorized } = useUser();
  const { toggleWishlist } = useToggleWishlist(product.id);
  const { inWishlist } = useInWishlist({ product_id: product.id, enabled: isAuthorized });

  const { price } = usePrice({
    amount: product.sale_price ? product.sale_price : product.price,
  });
  const { price: minPrice } = usePrice({ amount: product.min_price });
  const { price: maxPrice } = usePrice({ amount: product.max_price });
  const hasRange =
    Number(product.max_price) > Number(product.min_price) && Number(product.min_price) > 0;
  const priceLabel = hasRange
    ? `${minPrice} – ${maxPrice}`
    : Number(product.min_price) > 0
      ? minPrice
      : price;

  const badge = getCardBadge(product);
  const image = product.image?.original ?? product.image?.thumbnail ?? '';
  const noImage = !image || imgError;
  const sciName =
    (product as any).scientific_name ??
    (product.plant_attribute as any)?.scientific_name ??
    null;
  const features = plantFeatures(product);

  function open() {
    openModal('PRODUCT_DETAILS', product.slug);
  }
  function handleWishlist(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthorized) {
      goToSignin();
      return;
    }
    toggleWishlist({ product_id: product.id });
  }

  return (
    <motion.article
      data-product-card
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-[#ECECEC] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)] ${className}`}
    >
      {/* image — generous, light backdrop, heart top-right, badge top-left */}
      <div className="relative">
        <button
          type="button"
          onClick={open}
          aria-label={`View ${product.name}`}
          className="relative block aspect-[4/3] w-full overflow-hidden bg-[#F7F5EF] text-left"
        >
          {!noImage ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 33vw"
              priority={priority}
              onError={() => setImgError(true)}
              className="object-cover transition duration-[450ms] ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-5 text-center">
              <PlantMark className="h-12 w-12 text-forest-800/35" />
              <span className="text-sm font-medium text-stone-400">No image available</span>
            </span>
          )}
        </button>

        {badge ? (
          <span className="absolute left-4 top-4 z-10 rounded-lg bg-[#EAF4FB] px-3 py-1.5 text-[13px] font-semibold leading-none text-[#1F5673]">
            {badge}
          </span>
        ) : null}

        <button
          type="button"
          onClick={handleWishlist}
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-xl bg-white shadow-[0_4px_14px_rgba(0,0,0,0.10)] transition hover:scale-105"
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart active={inWishlist} />
        </button>
      </div>

      {/* body — name, botanical, Features grid, price + View Details */}
      <div className="flex flex-1 flex-col p-5 lg:p-6">
        <button
          type="button"
          onClick={open}
          className="block w-full truncate text-left text-[19px] font-bold leading-tight text-[#111827] transition hover:text-forest-700 lg:text-[21px]"
        >
          {product.name}
        </button>
        {sciName ? (
          <p className="mt-1 truncate text-[13.5px] italic leading-snug text-[#8A8A8A]">{sciName}</p>
        ) : (
          <p className="mt-1 text-[13.5px] leading-snug">&nbsp;</p>
        )}

        {/* Features — the reference's labelled 2×3 icon grid (present-only) */}
        <div className="mt-4 min-h-[92px]">
          {features.length >= 2 && (
            <>
              <span className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-stone-400">
                Features
              </span>
              {/* Two columns, never three: our values ("Bright Indirect",
                  "Moderate water") are longer than the reference's car specs
                  and ellipsize at 3-up. Full labels beat matching the column
                  count. */}
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                {features.map((f) => (
                  <span
                    key={f.key}
                    className="flex min-w-0 items-center gap-1.5 text-[13px] leading-snug text-[#4B5563]"
                    title={`${f.title}: ${f.label}`}
                  >
                    <FeatureGlyph name={f.icon} className="h-4 w-4" />
                    <span className="truncate">{f.label}</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* bottom row — BIG price left, black "View Details →" right */}
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <span className="min-w-0 truncate text-[22px] font-extrabold tracking-tight text-[#14532D] lg:text-[24px]">
            {priceLabel}
          </span>
          <button
            type="button"
            onClick={open}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-[#1F2937]"
            aria-label={`View details of ${product.name}`}
          >
            View Details
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-4 w-4">
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </motion.article>
  );
};

export default PrimeListingCard;
