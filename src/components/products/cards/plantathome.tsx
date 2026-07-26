'use client';
import React, { useState } from 'react';
import { goToSignin } from '@/lib/go-to-signin';
import { motion } from 'framer-motion';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { useToggleWishlist, useInWishlist } from '@/framework/wishlist';
import { useUser } from '@/framework/user';
import { useAskAiEnabled } from '@/framework/ask-ai';
import usePrice from '@/lib/use-price';
import { getCardBadge, shortDescription } from '@/components/products/cards/card-helpers';
import { PlantMark } from '@/components/storefront/logo-mark';
import type { Product } from '@/types';

const AddToCart = dynamic(
  () => import('@/components/products/add-to-cart/add-to-cart').then((m) => m.AddToCart),
  { ssr: false },
);

/* ─── Loading Skeleton (export kept for callers) — mirrors the real card's
       geometry exactly so swapping in data causes no layout shift ─────── */
export const PlantAtHomeCardSkeleton: React.FC = () => (
  <div className="flex h-full flex-col overflow-hidden rounded-[18px] border border-kraft-200 bg-white">
    <div className="aspect-square w-full animate-pulse bg-gradient-to-br from-[#FBFCF8] to-[#E9F0E3]" />
    <div className="flex flex-1 flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="h-5 w-3/4 animate-pulse rounded bg-stone-200/80" />
          <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded bg-stone-200/60" />
        </div>
        <div className="h-4 w-10 shrink-0 animate-pulse rounded bg-stone-200/60" />
      </div>
      <div className="mt-2.5 h-3 w-full animate-pulse rounded bg-stone-200/60" />
      <div className="mt-1.5 h-3 w-2/3 animate-pulse rounded bg-stone-200/50" />
      <div className="mt-auto pt-3">
        <div className="h-5 w-24 animate-pulse rounded bg-stone-200/70" />
        <div className="mt-2.5 h-11 w-full animate-pulse rounded-[10px] bg-stone-200/70" />
      </div>
    </div>
  </div>
);

/* ─── Heart icon ───────────────────────────────────────────────── */
const Heart = ({ active }: { active: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={active ? '#C26B45' : 'none'} stroke={active ? '#C26B45' : '#1E4023'} strokeWidth="1.8">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

/* ─── Single gold star (rating block shows ★ 4.8 + review count) ── */
const GoldStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#EAB308" aria-hidden>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

type Props = { product: Product; className?: string; priority?: boolean };

const PlantAtHomeCard: React.FC<Props> = ({
  product,
  className = '',
  priority = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const { openModal } = useModalAction();
  const { isAuthorized } = useUser();
  const { toggleWishlist } = useToggleWishlist(product.id);
  const { inWishlist } = useInWishlist({
    product_id: product.id,
    enabled: isAuthorized,
  });

  const { price, basePrice, discount } = usePrice({
    amount: product.sale_price ? product.sale_price : product.price,
    baseAmount: product.price,
  });
  const { price: minPrice } = usePrice({ amount: product.min_price });

  const badge = getCardBadge(product);
  const ratingVal = Number((product as any).ratings) || 0;
  const reviewCount = Number((product as any).total_reviews) || 0;
  const isVariable = product.product_type?.toLowerCase() === 'variable';
  const image = product.image?.original ?? product.image?.thumbnail ?? '';
  const noImage = !image || imgError;
  const sciName =
    (product as any).scientific_name ??
    (product.plant_attribute as any)?.scientific_name ??
    null;
  const desc = shortDescription(product);

  const { data: askAiSettings } = useAskAiEnabled();
  const askAiEnabled = Boolean(askAiSettings?.data?.enabled);

  function handleQuickView() {
    openModal('PRODUCT_DETAILS', product.slug);
  }
  function handleAskAi(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthorized) {
      goToSignin();
      return;
    }
    openModal('ASK_AI', { product });
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
      transition={{ duration: 0.25 }}
      className={`group flex h-full flex-col overflow-hidden rounded-[18px] border border-kraft-200 bg-white shadow-[0_2px_12px_rgba(22,48,26,0.06)] transition-all duration-300 hover:shadow-[0_18px_40px_-24px_rgba(22,48,26,0.35)] ${className}`}
    >
      {/* photo + wishlist (heart is a sibling of the image button — not nested) */}
      <div className="relative">
      <button
        type="button"
        onClick={handleQuickView}
        aria-label={`View ${product.name}`}
        className="relative block aspect-square w-full overflow-hidden bg-[radial-gradient(130%_130%_at_30%_15%,#FBFCF8,#E9F0E3_70%,#DEE9D6)] text-left"
      >
        {!noImage ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            onError={() => setImgError(true)}
            className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          /* Designed no-image state (mockup 2): soft wash, line-art plant,
             serif heading + helper copy. */
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-5 text-center">
            <PlantMark className="h-16 w-16 text-forest-800/35" />
            <span className="font-heading text-[16px] font-semibold leading-tight text-forest-900/80">
              No Image Available
            </span>
            <span className="max-w-[190px] text-[11px] leading-snug text-stone-500">
              We&rsquo;re working on adding a beautiful image for this plant.
            </span>
          </span>
        )}

        {/* top-left pill: "No Image" supersedes the tag badge (mockup 2) */}
        {noImage ? (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-forest-800 px-3 py-1 text-[10.5px] font-semibold tracking-wide text-white shadow-sm">
            No Image
          </span>
        ) : badge ? (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-forest-800 px-3 py-1 text-[10.5px] font-semibold tracking-wide text-white shadow-sm">
            {badge}
          </span>
        ) : null}
      </button>

        {/* wishlist — sibling of the image button (valid HTML, reliable click) */}
        <button
          type="button"
          onClick={handleWishlist}
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white shadow-sm transition hover:scale-105"
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart active={inWishlist} />
        </button>

        {/* Ask AI — per-plant chat (admin-toggled); overlay pill, bottom-left */}
        {askAiEnabled && (
          <button
            type="button"
            onClick={handleAskAi}
            aria-label={`Ask AI about ${product.name}`}
            className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#0D3B2E] px-3 py-2 text-[12px] font-bold text-white shadow-[0_6px_18px_-6px_rgba(0,0,0,0.6)] ring-1 ring-[#8FD56F]/60 transition hover:scale-[1.04] hover:ring-[#8FD56F]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#DCC07A" aria-hidden>
              <path d="M12 2l1.9 5.6L19.5 9.5 13.9 11.4 12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2z" />
            </svg>
            Ask AI
          </button>
        )}

      </div>

      {/* body — mockup layout: name+botanical | rating, description, price, CTA */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <button
              type="button"
              onClick={handleQuickView}
              className="block w-full truncate text-left font-heading text-[17px] font-bold leading-snug text-forest-800 transition hover:text-forest-700 sm:text-[18px]"
            >
              {product.name}
            </button>
            {sciName ? (
              <p className="mt-0.5 truncate text-[12px] text-stone-500">{sciName}</p>
            ) : null}
          </div>
          <div className="shrink-0 pt-0.5 text-right">
            {reviewCount > 0 ? (
              <>
                <span className="flex items-center justify-end gap-1">
                  <GoldStar />
                  <span className="text-[13.5px] font-bold leading-none text-forest-900">
                    {ratingVal.toFixed(1)}
                  </span>
                </span>
                <span className="mt-0.5 block text-[11px] leading-none text-stone-500">
                  ({reviewCount.toLocaleString('en-IN')})
                </span>
              </>
            ) : (
              <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[10.5px] font-semibold text-forest-800">
                New
              </span>
            )}
          </div>
        </div>

        {/* 2-line supporting copy; fixed min-height keeps grid rows aligned
            even when a product has no description */}
        <p className="mt-2 min-h-[34px] text-[12.5px] leading-[17px] text-stone-500 line-clamp-2">
          {desc}
        </p>

        <div className="mt-auto pt-3" onClick={(e) => e.stopPropagation()}>
          {/* price row: ₹ price + struck MRP + red % OFF chip */}
          <div className="mb-2.5 flex items-center gap-2">
            {isVariable && (
              <span className="text-[10px] uppercase tracking-[0.14em] text-stone-400">from</span>
            )}
            <span className="text-[19px] font-bold leading-none text-forest-700">
              {isVariable ? minPrice : price}
            </span>
            {!isVariable && basePrice && (
              <del className="text-[12px] leading-none text-stone-400">{basePrice}</del>
            )}
            {!isVariable && discount && (
              <span className="rounded-md bg-[#FDECEC] px-2 py-1 text-[11px] font-bold leading-none text-[#DC2626]">
                {discount} OFF
              </span>
            )}
          </div>

          {/* full-width action */}
          {isVariable ? (
            <button
              type="button"
              onClick={handleQuickView}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-ds-btn px-5 text-[13px] font-semibold text-white transition duration-200 hover:bg-ds-btn-hover focus:outline-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[15px] w-[15px]"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></svg>
              Select Options
            </button>
          ) : (
            <AddToCart variant="plantathome" counterVariant="plantathome" data={product} />
          )}
        </div>
      </div>
    </motion.article>
  );
};

export default PlantAtHomeCard;
