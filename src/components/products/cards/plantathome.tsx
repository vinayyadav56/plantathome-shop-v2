'use client';
import React, { useEffect, useState } from 'react';
import { goToSignin } from '@/lib/go-to-signin';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Routes } from '@/config/routes';
// Still needed for Ask AI — the product quick-view popup is gone (cards link
// straight to the product page), but this card opens the ASK_AI modal too.
import { useModalAction } from '@/components/ui/modal/modal.context';
import { Heart as HeartGlyph, ShoppingBag, Sparkles, Star } from '@/components/ui/icon';
import { useToggleWishlist, useInWishlist } from '@/framework/wishlist';
import { useUser } from '@/framework/user';
import { useAskAiEnabled } from '@/framework/ask-ai';
import { useCart } from '@/store/quick-cart/cart.context';
import { useCitySupply } from '@/lib/use-city-supply';
import { generateCartItem } from '@/store/quick-cart/generate-cart-item';
import usePrice from '@/lib/use-price';
import { compactPrice, getCardBadge, plantQuickFacts, shortDescription, PRODUCT_LINK_PROPS } from '@/components/products/cards/card-helpers';
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
    <div className="aspect-[25/24] w-full animate-pulse bg-[#F7F5EF]" />
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
        <div className="flex gap-1.5">
          <div className="h-[19px] w-20 animate-pulse rounded-full bg-stone-200/60" />
          <div className="h-[19px] w-16 animate-pulse rounded-full bg-stone-200/60" />
        </div>
        <div className="mt-[11px] h-8 w-32 animate-pulse rounded bg-stone-200/70" />
        <div className="mt-[13px] h-12 w-full animate-pulse rounded-[14px] bg-stone-200/70" />
      </div>
    </div>
  </div>
);

/* ─── Heart (reference .wishlist: 48px white circle) ─────────────── */
const Heart = ({ active }: { active: boolean }) => (
  <HeartGlyph
    size={18}
    fill={active ? '#C26B45' : 'none'}
    style={{ color: active ? '#C26B45' : '#555555' }}
    aria-hidden
  />
);

/* ─── Gold star (reference .rating i: #FDBA12) ─────────────────── */
const GoldStar = () => (
  <Star size={16} fill="#FDBA12" strokeWidth={0} style={{ color: '#FDBA12' }} aria-hidden />
);

/* ─── Cart icon for the CTA ────────────────────────────────────── */
const CartGlyph = () => <ShoppingBag size={18} aria-hidden />;

type Props = {
  product: Product;
  className?: string;
  priority?: boolean;
  /** 'list' turns the card on its side: image column left, content right. */
  layout?: 'grid' | 'list';
};

const PlantAtHomeCard: React.FC<Props> = ({
  product,
  className = '',
  priority = false,
  layout = 'grid',
}) => {
  const isList = layout === 'list';
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
  const facts = plantQuickFacts(product);
  const inCart =
    mounted && !isVariable && isInCart(generateCartItem(product as any, undefined as any)?.id);

  // In a display-only city AddToCart renders an "Out of Stock" pill instead of
  // a CTA, so the qty stepper beside it is dead UI — and worse, it was eating
  // ~120px of a two-up card, which is what pushed the pill out of the box.
  const { displayOnly } = useCitySupply();

  const { data: askAiSettings } = useAskAiEnabled();
  const askAiEnabled = Boolean(askAiSettings?.data?.enabled);

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
      className={`group flex h-full overflow-hidden rounded-[22px] border border-[#ECECEC] bg-white shadow-[0_4px_10px_rgba(0,0,0,0.04),0_20px_40px_rgba(0,0,0,0.08)] transition-shadow duration-300 [container-type:inline-size] hover:shadow-[0_10px_18px_rgba(0,0,0,0.08),0_30px_60px_rgba(0,0,0,0.12)] ${
        isList ? 'flex-row items-stretch' : 'flex-col'
      } ${className}`}
    >
      {/* image zone (reference .image: #F7F5EF, zoom on hover) */}
      <div className={isList ? 'relative w-[40%] max-w-[250px] shrink-0' : 'relative'}>
      <Link
        {...PRODUCT_LINK_PROPS}
        href={Routes.product(product.slug)}
        aria-label={`View ${product.name}`}
        className={`relative block w-full overflow-hidden bg-[#F7F5EF] text-left ${
          isList ? 'h-full min-h-[170px]' : 'aspect-[25/24]'
        }`}
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

        {/*
          ONE badge slot, image bottom-left: the product's status badge when it
          has one, otherwise "New" for a product with no reviews yet. The "New"
          chip used to sit beside the product name, where it ate width from long
          names and could appear alongside a "New Arrival" badge on the image —
          two near-identical labels on one card.

          Top-left is Ask AI now, so only the no-image placeholder badge still
          uses that corner (and Ask AI is hidden on those cards, below).
        */}
        {noImage ? (
          <span className="absolute left-[clamp(10px,4.6cqw,18px)] top-[clamp(10px,4.6cqw,18px)] z-10 rounded-[10px] bg-[#1C5E3C] px-[clamp(9px,3.8cqw,15px)] py-[clamp(5px,2cqw,8px)] text-[clamp(11px,3.8cqw,14px)] font-semibold leading-none text-white">
            No Image
          </span>
        ) : badge ? (
          <span className="absolute bottom-[clamp(10px,4.6cqw,18px)] left-[clamp(10px,4.6cqw,18px)] z-10 rounded-[10px] bg-[#1C5E3C] px-[clamp(9px,3.8cqw,15px)] py-[clamp(5px,2cqw,8px)] text-[clamp(11px,3.8cqw,14px)] font-semibold leading-none text-white">
            {badge}
          </span>
        ) : reviewCount === 0 ? (
          <span className="absolute bottom-[clamp(10px,4.6cqw,18px)] left-[clamp(10px,4.6cqw,18px)] z-10 rounded-[10px] bg-sage-100 px-[clamp(9px,3.8cqw,15px)] py-[clamp(5px,2cqw,8px)] text-[clamp(11px,3.8cqw,14px)] font-semibold leading-none text-forest-800">
            New
          </span>
        ) : null}
      </Link>

        {/* wishlist — sibling of the image link (valid HTML, reliable click) */}
        <button
          type="button"
          onClick={handleWishlist}
          className="absolute right-[clamp(10px,4.6cqw,18px)] top-[clamp(10px,4.6cqw,18px)] z-10 grid h-[clamp(38px,12.4cqw,48px)] w-[clamp(38px,12.4cqw,48px)] place-items-center rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition hover:scale-110"
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart active={inWishlist} />
        </button>

        {/* Ask AI — per-plant chat (admin-toggled); overlay pill, TOP-left.
            Hidden on no-image cards — it overlapped the placeholder copy, and
            that is also the one case where the top-left slot is still a badge. */}
        {askAiEnabled && !noImage && (
          <button
            type="button"
            onClick={handleAskAi}
            aria-label={`Ask AI about ${product.name}`}
            /* Was a solid dark-green pill ringed in bright lime — two more greens on top of a photo
               of a green plant, competing with the primary CTA below for attention it does not
               deserve. This is a secondary, optional action, so it now reads as one: a neutral
               glass chip that sits on ANY photograph, with no colour of its own. Hover raises the
               contrast rather than the scale, so the card does not jitter under the cursor. */
            /* Same clamp insets as the wishlist heart opposite it — it used a
               fixed bottom-3/left-3, so it only lined up with the other
               overlays at one card width. */
            className="absolute left-[clamp(10px,4.6cqw,18px)] top-[clamp(10px,4.6cqw,18px)] z-10 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/45 px-2.5 py-1.5 text-[11px] font-medium text-white/95 backdrop-blur-md transition hover:border-white/40 hover:bg-black/60"
          >
            <Sparkles size={12} fill="currentColor" aria-hidden />
            Ask AI
          </button>
        )}

      </div>

      {/* content (reference .content: 24px padding at full card width).
          In list mode this column becomes its own query container, so the
          cqw-based type scale inside sizes off the CONTENT width rather than
          the full row — a list card is wide, and without this every clamp
          would pin to its maximum. */}
      <div
        className={`flex flex-1 flex-col p-[clamp(14px,6.2cqw,24px)] ${
          isList ? 'min-w-0 [container-type:inline-size]' : ''
        }`}
      >
        {/* title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {/* Product name — same family as the body text, bold (user note:
                weight alone distinguishes the name), #184A31 */}
            {/* Type spec given exactly: weight 500, 0.9rem, line-height 1. Fixed, not a clamp —
                the previous clamp scaled the name from 15.5px to 23px with card width, which is
                what made it read as oversized in the grid. */}
            <Link
              {...PRODUCT_LINK_PROPS}
              href={Routes.product(product.slug)}
              // The name is truncated to one line, so a long or awkward one is unreadable with no
              // way to see the rest. `title` is the one tooltip that works on both a desktop hover
              // and a mobile long-press without shipping a popover — same approach as cart-item.
              title={product.name}
              className="block w-full truncate text-left text-[0.9rem] font-medium leading-none text-[#184A31] transition hover:text-forest-700"
            >
              {product.name}
            </Link>
            {/* Botanical name — Inter 400, up to 16px, #8A8A8A */}
            {sciName ? (
              <p title={sciName} className="mt-[5px] truncate text-[clamp(10.5px,3.4cqw,12px)] leading-[1.4] text-[#8A8A8A]">{sciName}</p>
            ) : null}
          </div>
          {/* Rating only. The "New" chip that used to be the else-branch here
              now lives on the image, bottom-left — beside the name it stole
              width from long product names, and it could sit next to a "New
              Arrival" badge on the same card. For an unreviewed product this
              renders empty and the name takes the full row, which is the point.
              leading-none keeps the rating aligned with the name's first line. */}
          {reviewCount > 0 ? (
            <div className="shrink-0 text-right leading-none">
              <span className="flex items-center justify-end gap-1.5">
                <GoldStar />
                <strong className="text-[clamp(11.5px,3.6cqw,13px)] font-semibold leading-none text-gray-900">
                  {ratingVal.toFixed(1)}
                </strong>
              </span>
              <span className="mt-[6px] block text-[clamp(10px,3.2cqw,11px)] leading-none text-[#888888]">
                ({reviewCount.toLocaleString('en-IN')})
              </span>
            </div>
          ) : null}
        </div>

        {/* description — Inter 17px (15px mobile), #5B5B5B, lh 1.6; 2-line
            clamp with fixed min-height so grid rows stay aligned. Vertical
            margins are tighter than the reference's standalone card — inside a
            grid the full 18/22px rhythm made cards run too long. */}
        <p className="mb-[0.275rem] mt-[0.1rem] min-h-[2.6em] text-[clamp(11px,3.4cqw,12.5px)] leading-[1.3] text-[#5B5B5B] line-clamp-2">
          {desc}
        </p>

        <div
          className={`mt-auto ${isList ? 'max-w-[340px]' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Plant facts — replaced the "Free Delivery | 2–4 Days" band, which
              read identically on every card (so it distinguished nothing) while
              costing a full row of height and stretching the card's proportions.
              These say something per-plant instead, and sit ABOVE the price.
              Capped at 3 and never wrapped so a card can't grow a second row.
              No reserved min-height: this whole block is mt-auto, so the CTAs
              line up across a grid row whether or not a product has attributes,
              and an empty strip would just be the dead space we removed. */}
          {facts.length > 0 && (
            <div className="mb-[clamp(7px,2.8cqw,11px)] flex flex-nowrap items-center gap-1.5 overflow-hidden">
              {facts.slice(0, 3).map((f) => (
                <span
                  key={f.label}
                  className="truncate whitespace-nowrap rounded-full bg-[#F3F8EC] px-[clamp(6px,2.4cqw,9px)] py-[4px] text-[clamp(9px,2.9cqw,11px)] font-medium leading-none text-[#24693E]"
                >
                  {f.label}
                </span>
              ))}
            </div>
          )}

          {/* price row — 34px (28px mobile) #14532D · struck 18px #A0A0A0 ·
              chip #FFEAEA / #D73C3C. Sits directly on top of the CTA. */}
          {/*
            Price and struck price group on the LEFT, discount chip pinned
            RIGHT. Previously all three were loose flex items in one wrapping
            row: at two-up mobile they measure 63 + 46 + 58 = 167px inside a
            140px row, so the row broke onto THREE lines with the chip stranded
            underneath.

            `compactPrice` drops a whole-rupee ".00" (₹899.00 → ₹899), which is
            what buys the ~40px that lets all three share one line at that
            width. flex-wrap is kept so the narrowest cards still degrade by
            wrapping rather than overflowing.
          */}
          <div className="mb-[clamp(9px,3.4cqw,13px)] flex flex-wrap items-center justify-between gap-x-[clamp(6px,2.6cqw,14px)] gap-y-1">
            <span className="flex min-w-0 items-center gap-x-[clamp(5px,2.2cqw,10px)]">
              {/* variable products show the size range min–max */}
              <span
                className={`whitespace-nowrap leading-none text-[#14532D] ${
                  isVariable && hasRange
                    ? 'text-[clamp(13px,4.4cqw,16px)] font-semibold'
                    : 'text-[clamp(15px,5.4cqw,19px)] font-bold'
                }`}
              >
                {isVariable
                  ? hasRange
                    ? `${compactPrice(minPrice)} – ${compactPrice(maxPrice)}`
                    : compactPrice(minPrice)
                  : compactPrice(price)}
              </span>
              {!isVariable && basePrice && (
                <del className="whitespace-nowrap text-[clamp(12px,4.4cqw,18px)] leading-none text-[#A0A0A0]">
                  {compactPrice(basePrice)}
                </del>
              )}
            </span>
            {!isVariable && discount && (
              <span className="shrink-0 whitespace-nowrap rounded-[8px] bg-[#FFEAEA] px-[clamp(6px,2.6cqw,12px)] py-1.5 text-[clamp(10px,3.4cqw,14px)] font-bold leading-none text-[#D73C3C]">
                {discount} OFF
              </span>
            )}
          </div>

          {/* footer — qty stepper + Add to Cart (reference .footer) */}
          {isVariable ? (
            /* Sizes are chosen on the product page — this used to open a
               quick-view popup over the grid. */
            <Link
              {...PRODUCT_LINK_PROPS}
              href={Routes.product(product.slug)}
              /* Slimmer scale (2026-08-07): the 48px/18px ceilings made these read
                 as heavy slabs on wide cards. Kept in lockstep with the qty stepper
                 below and add-to-cart-btn/add-to-cart, which share this baseline —
                 changing one alone breaks the action row's alignment. */
              className="flex h-[clamp(34px,9.5cqw,40px)] w-full items-center justify-center gap-2 rounded-[12px] bg-ds-btn text-[clamp(12px,3.6cqw,14px)] font-medium text-white transition duration-300 hover:bg-ds-btn-hover focus:outline-0"
            >
              <CartGlyph />
              Select Options
            </Link>
          ) : (
            <div className="pah-card-actions flex gap-[clamp(8px,3.9cqw,15px)]">
              {!inCart && !displayOnly && (
                <div className="flex h-[clamp(34px,9.5cqw,40px)] w-[clamp(80px,27cqw,104px)] shrink-0 items-center justify-around rounded-[12px] border border-[#DDDDDD]">
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
