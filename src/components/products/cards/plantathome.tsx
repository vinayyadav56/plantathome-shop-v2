'use client';
import React, { useEffect, useState } from 'react';
import { goToSignin } from '@/lib/go-to-signin';
import { motion } from 'framer-motion';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { useToggleWishlist, useInWishlist } from '@/framework/wishlist';
import { useUser } from '@/framework/user';
import { useAskAiEnabled } from '@/framework/ask-ai';
import { useCart } from '@/store/quick-cart/cart.context';
import { generateCartItem } from '@/store/quick-cart/generate-cart-item';
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
  <div className="flex h-full flex-col overflow-hidden rounded-[22px] border border-[#ECECEC] bg-white shadow-[0_4px_10px_rgba(0,0,0,0.04),0_20px_40px_rgba(0,0,0,0.08)]">
    <div className="aspect-square w-full animate-pulse bg-[#F7F5EF]" />
    <div className="flex flex-1 flex-col p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="h-7 w-3/4 animate-pulse rounded bg-stone-200/80" />
          <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-stone-200/60" />
        </div>
        <div className="h-5 w-12 shrink-0 animate-pulse rounded bg-stone-200/60" />
      </div>
      <div className="mt-4 h-4 w-full animate-pulse rounded bg-stone-200/60" />
      <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-stone-200/50" />
      <div className="mt-auto pt-5">
        <div className="h-8 w-32 animate-pulse rounded bg-stone-200/70" />
        <div className="mt-6 h-12 w-full animate-pulse rounded-[14px] bg-stone-200/70" />
      </div>
    </div>
  </div>
);

/* ─── Heart (reference .wishlist: 48px white circle, ~21px outline heart) ── */
const Heart = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" fill={active ? '#C26B45' : 'none'} stroke={active ? '#C26B45' : '#555555'} strokeWidth="1.8" className="h-[21px] w-[21px]">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

/* ─── Gold star (reference .rating i: #FDBA12) ─────────────────── */
const GoldStar = () => (
  <svg viewBox="0 0 24 24" fill="#FDBA12" aria-hidden className="h-[17px] w-[17px]">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/* ─── Truck (reference .delivery i) ────────────────────────────── */
const TruckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-5 w-5 shrink-0">
    <path d="M1 3h15v13H1z" />
    <path d="M16 8h4l3 3v5h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

/* ─── Cart icon for the CTA ────────────────────────────────────── */
const CartGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-[18px] w-[18px]">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
  </svg>
);

type Props = { product: Product; className?: string; priority?: boolean };

const PlantAtHomeCard: React.FC<Props> = ({
  product,
  className = '',
  priority = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const [qty, setQty] = useState(1);
  const [mounted, setMounted] = useState(false);
  const { openModal } = useModalAction();
  const { isAuthorized } = useUser();
  const { isInCart } = useCart();
  const { toggleWishlist } = useToggleWishlist(product.id);
  const { inWishlist } = useInWishlist({
    product_id: product.id,
    enabled: isAuthorized,
  });

  // Cart state is client-only (localStorage) — only branch on it after mount,
  // or the server HTML mismatches and React discards the tree (#418 class).
  useEffect(() => setMounted(true), []);

  const { price, basePrice, discount } = usePrice({
    amount: product.sale_price ? product.sale_price : product.price,
    baseAmount: product.price,
  });
  const { price: minPrice } = usePrice({ amount: product.min_price });
  const { price: maxPrice } = usePrice({ amount: product.max_price });
  const hasRange =
    Number(product.max_price) > Number(product.min_price) && Number(product.min_price) > 0;

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
  const inCart =
    mounted && !isVariable && isInCart(generateCartItem(product as any, undefined as any)?.id);

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
      whileHover={{ y: -8 }}
      transition={{ duration: 0.35 }}
      // container-type makes every size inside scale with the CARD's width
      // (cqw units): full reference sizes at its native 390px, fluidly smaller
      // in dense grids (search page cells are ~230px) — nothing truncates or
      // wraps at any grid density.
      className={`group flex h-full flex-col overflow-hidden rounded-[22px] border border-[#ECECEC] bg-white shadow-[0_4px_10px_rgba(0,0,0,0.04),0_20px_40px_rgba(0,0,0,0.08)] transition-shadow duration-300 [container-type:inline-size] hover:shadow-[0_10px_18px_rgba(0,0,0,0.08),0_30px_60px_rgba(0,0,0,0.12)] ${className}`}
    >
      {/* image zone (reference .image: #F7F5EF, zoom on hover) */}
      <div className="relative">
      <button
        type="button"
        onClick={handleQuickView}
        aria-label={`View ${product.name}`}
        className="relative block aspect-square w-full overflow-hidden bg-[#F7F5EF] text-left"
      >
        {!noImage ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            onError={() => setImgError(true)}
            className="object-cover transition duration-[450ms] ease-out group-hover:scale-[1.04]"
          />
        ) : (
          /* Designed no-image state: soft wash, line-art plant, heading */
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-5 text-center">
            <PlantMark className="h-[clamp(44px,18cqw,64px)] w-[clamp(44px,18cqw,64px)] text-forest-800/35" />
            <span className="text-[clamp(14px,5.6cqw,19px)] font-bold leading-tight text-forest-900/80">
              No Image Available
            </span>
            <span className="max-w-[200px] text-[clamp(10.5px,3.8cqw,12px)] leading-snug text-stone-500">
              We&rsquo;re working on adding a beautiful image for this plant.
            </span>
          </span>
        )}

        {/* badge (reference: #1C5E3C rounded-rect, 14px/600, 18px inset) */}
        {noImage ? (
          <span className="absolute left-[clamp(10px,4.6cqw,18px)] top-[clamp(10px,4.6cqw,18px)] z-10 rounded-[10px] bg-[#1C5E3C] px-[clamp(9px,3.8cqw,15px)] py-[clamp(5px,2cqw,8px)] text-[clamp(11px,3.8cqw,14px)] font-semibold leading-none text-white">
            No Image
          </span>
        ) : badge ? (
          <span className="absolute left-[clamp(10px,4.6cqw,18px)] top-[clamp(10px,4.6cqw,18px)] z-10 rounded-[10px] bg-[#1C5E3C] px-[clamp(9px,3.8cqw,15px)] py-[clamp(5px,2cqw,8px)] text-[clamp(11px,3.8cqw,14px)] font-semibold leading-none text-white">
            {badge}
          </span>
        ) : null}
      </button>

        {/* wishlist — sibling of the image button (valid HTML, reliable click) */}
        <button
          type="button"
          onClick={handleWishlist}
          className="absolute right-[clamp(10px,4.6cqw,18px)] top-[clamp(10px,4.6cqw,18px)] z-10 grid h-[clamp(38px,12.4cqw,48px)] w-[clamp(38px,12.4cqw,48px)] place-items-center rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition hover:scale-110"
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart active={inWishlist} />
        </button>

        {/* Ask AI — per-plant chat (admin-toggled); overlay pill, bottom-left.
            Hidden on no-image cards — it overlapped the placeholder copy. */}
        {askAiEnabled && !noImage && (
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

      {/* content (reference .content: 24px padding at full card width) */}
      <div className="flex flex-1 flex-col p-[clamp(14px,6.2cqw,24px)]">
        {/* title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {/* Product name — same family as the body text, bold (user note:
                weight alone distinguishes the name), #184A31 */}
            <button
              type="button"
              onClick={handleQuickView}
              className="block w-full truncate text-left text-[clamp(15.5px,6.6cqw,23px)] font-bold leading-[1.2] text-[#184A31] transition hover:text-forest-700"
            >
              {product.name}
            </button>
            {/* Botanical name — Inter 400, up to 16px, #8A8A8A */}
            {sciName ? (
              <p className="mt-[5px] truncate text-[clamp(12px,4.4cqw,16px)] leading-[1.4] text-[#8A8A8A]">{sciName}</p>
            ) : null}
          </div>
          <div className="shrink-0 pt-1.5 text-right">
            {reviewCount > 0 ? (
              <>
                <span className="flex items-center justify-end gap-1.5">
                  <GoldStar />
                  <strong className="text-[clamp(13px,4.9cqw,18px)] font-semibold leading-none text-gray-900">
                    {ratingVal.toFixed(1)}
                  </strong>
                </span>
                <span className="mt-[6px] block text-[clamp(11px,4.1cqw,15px)] leading-none text-[#888888]">
                  ({reviewCount.toLocaleString('en-IN')})
                </span>
              </>
            ) : (
              <span className="rounded-full bg-sage-100 px-2.5 py-1 text-[clamp(11px,3.8cqw,13px)] font-semibold text-forest-800">
                New
              </span>
            )}
          </div>
        </div>

        {/* description — Inter 17px (15px mobile), #5B5B5B, lh 1.6; 2-line
            clamp with fixed min-height so grid rows stay aligned. Vertical
            margins are tighter than the reference's standalone card — inside a
            grid the full 18/22px rhythm made cards run too long. */}
        <p className="mb-3.5 mt-2.5 min-h-[3.2em] text-[clamp(12.5px,4.6cqw,17px)] leading-[1.6] text-[#5B5B5B] line-clamp-2">
          {desc}
        </p>

        <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
          {/* price row — 34px (28px mobile) #14532D · struck 18px #A0A0A0 ·
              chip #FFEAEA / #D73C3C */}
          <div className="flex flex-wrap items-center gap-x-[clamp(8px,3.6cqw,14px)] gap-y-1">
            {/* variable products show the size range min–max */}
            <span
              className={`whitespace-nowrap leading-none text-[#14532D] ${
                isVariable && hasRange
                  ? 'text-[clamp(14px,6.2cqw,24px)] font-semibold'
                  : 'text-[clamp(20px,9.2cqw,34px)] font-bold'
              }`}
            >
              {isVariable ? (hasRange ? `${minPrice} – ${maxPrice}` : minPrice) : price}
            </span>
            {!isVariable && basePrice && (
              <del className="text-[clamp(12px,4.9cqw,18px)] leading-none text-[#A0A0A0]">{basePrice}</del>
            )}
            {!isVariable && discount && (
              <span className="rounded-[8px] bg-[#FFEAEA] px-[clamp(7px,3cqw,12px)] py-1.5 text-[clamp(10.5px,3.8cqw,14px)] font-bold leading-none text-[#D73C3C]">
                {discount} OFF
              </span>
            )}
          </div>

          {/* delivery band — #F3F8EC / #24693E, truck + copy. 16px at the
              reference's 390px card width; steps down inside narrower grid
              cells so it never wraps. */}
          <div className="my-4 flex items-center gap-[clamp(6px,2.6cqw,12px)] whitespace-nowrap rounded-[12px] bg-[#F3F8EC] px-[clamp(10px,4.4cqw,18px)] py-[clamp(9px,3.6cqw,14px)] text-[clamp(11px,4.1cqw,16px)] font-semibold leading-none text-[#24693E]">
            <TruckIcon />
            Free Delivery&nbsp;|&nbsp;2–4 Days
          </div>

          {/* footer — qty stepper + Add to Cart (reference .footer) */}
          {isVariable ? (
            <button
              type="button"
              onClick={handleQuickView}
              className="flex h-[clamp(40px,12.4cqw,48px)] w-full items-center justify-center gap-2.5 rounded-[14px] bg-[#14532D] text-[clamp(13px,4.7cqw,18px)] font-semibold text-white transition duration-300 hover:bg-[#0D4324] focus:outline-0"
            >
              <CartGlyph />
              Select Options
            </button>
          ) : (
            <div className="flex gap-[clamp(8px,3.9cqw,15px)]">
              {!inCart && (
                <div className="flex h-[clamp(40px,12.4cqw,48px)] w-[clamp(88px,31cqw,120px)] shrink-0 items-center justify-around rounded-[14px] border border-[#DDDDDD]">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="px-1.5 text-[clamp(20px,7.2cqw,28px)] leading-none text-[#333333] transition hover:text-[#14532D]"
                  >
                    −
                  </button>
                  <span className="text-[clamp(15px,5.2cqw,20px)] font-semibold leading-none text-gray-900">{qty}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQty((q) => q + 1)}
                    className="px-1.5 text-[clamp(20px,7.2cqw,28px)] leading-none text-[#333333] transition hover:text-[#14532D]"
                  >
                    +
                  </button>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <AddToCart
                  variant="plantathome"
                  counterVariant="plantathome"
                  data={product}
                  quantity={qty}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
};

export default PlantAtHomeCard;
