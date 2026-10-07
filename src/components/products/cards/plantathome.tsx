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
import cn from 'classnames';
import { Droplet, Heart as HeartGlyph, Home, Star, SunHigh, Truck, type IconSize } from '@/components/ui/icon';
import { LineIcon } from '@/components/icons/line-icons';
import SafeImage from '@/components/ui/safe-image';
import { useToggleWishlist, useInWishlist } from '@/framework/wishlist';
import { useUser } from '@/framework/user';
import { useAskAiEnabled } from '@/framework/ask-ai';
import { useCart } from '@/store/quick-cart/cart.context';
import { useCitySupply } from '@/lib/use-city-supply';
import { generateCartItem } from '@/store/quick-cart/generate-cart-item';
import usePrice from '@/lib/use-price';
import {
  compactPrice,
  getCardBadge,
  getCardBadges,
  plantFactRows,
  shortDescription,
  PRODUCT_LINK_PROPS,
  type BadgeTone,
} from '@/components/products/cards/card-helpers';
import { PlantMark } from '@/components/storefront/logo-mark';
import type { Product } from '@/types';

const AddToCart = dynamic(
  () => import('@/components/products/add-to-cart/add-to-cart').then((m) => m.AddToCart),
  { ssr: false },
);

export type CardVariant = 'default' | 'plp';

/* ─── Loading Skeleton (export kept for callers) — mirrors the real card's
       geometry exactly so swapping in data causes no layout shift ─────── */
export const PlantAtHomeCardSkeleton: React.FC<{ variant?: CardVariant }> = ({
  variant = 'default',
}) =>
  variant === 'plp' ? (
    /* plp geometry: 8/7 image, name / botanical / facts rows, price, 36px CTA */
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-kraft-200 bg-white">
      <div className="aspect-[8/7] w-full animate-pulse bg-[#F7F5EF]" />
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-stone-200/80" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-stone-200/60" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-stone-200/50" />
        <div className="mt-auto pt-1">
          <div className="h-5 w-24 animate-pulse rounded bg-stone-200/70" />
          <div className="mt-2 h-9 w-full animate-pulse rounded-control bg-stone-200/70" />
        </div>
      </div>
    </div>
  ) : (
  <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-kraft-200 bg-white shadow-box">
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
        <div className="mt-[13px] h-12 w-full animate-pulse rounded-control bg-stone-200/70" />
      </div>
    </div>
  </div>
  );

/* ─── Heart (reference .wishlist: 48px white circle) ─────────────── */
const Heart = ({ active, size = 18 }: { active: boolean; size?: IconSize }) => (
  <HeartGlyph
    size={size}
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

type Props = {
  product: Product;
  className?: string;
  priority?: boolean;
  /** 'list' turns the card on its side: image column left, content right. */
  layout?: 'grid' | 'list';
  /**
   * 'plp' — the /plants listing card (plan B3): fixed sizes tuned for 170–230px
   * cells, up to two coloured badges, 28px wishlist circle, facts rows, price
   * "onwards", delivery line and a 36px full-width "Add to cart" that opens the
   * size sheet for variable products. 'default' (omitted) is the canonical card
   * every other listing renders — its behaviour is untouched by the variant.
   */
  variant?: CardVariant;
  /**
   * plp only. The shopper's pincode ETA in days (page-level, from the
   * serviceability lookup). Used when `product.city_local` isn't true:
   * positive → "Delivery in {n} days"; null/absent/0 → no delivery line.
   */
  deliveryEtaDays?: number | null;
};

/** Badge pill colours for the plp variant (plan B3 tones). */
const BADGE_TONE_CLASS: Record<BadgeTone, string> = {
  orange: 'bg-orange-500 text-white',
  emerald: 'bg-emerald-600 text-white',
  sky: 'bg-sky-500 text-white',
  violet: 'bg-violet-500 text-white',
  clay: 'bg-clay text-white',
  sage: 'bg-sage-100 text-forest-800',
};

const PlantAtHomeCard: React.FC<Props> = ({
  product,
  className = '',
  priority = false,
  layout = 'grid',
  variant = 'default',
  deliveryEtaDays = null,
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
  const facts = plantFactRows(product);
  // With facts on the card, don't also spell them out as the description line.
  const desc = shortDescription(product, facts.length === 0);
  const inCart =
    mounted && !isVariable && isInCart(generateCartItem(product as any, undefined as any)?.id);

  // In a display-only city AddToCart renders an "Out of Stock" pill instead of
  // a CTA, so the qty stepper beside it is dead UI — and worse, it was eating
  // ~120px of a two-up card, which is what pushed the pill out of the box.
  const { city, displayOnly } = useCitySupply();

  const { data: askAiSettings } = useAskAiEnabled();
  // Ask AI is the per-plant care chatbot — meaningless on a trowel or a pot, so it
  // shows on plants only (a row without its type keeps the old behaviour).
  const typeSlug = (product.type as { slug?: string } | undefined)?.slug;
  const askAiEnabled = Boolean(askAiSettings?.data?.enabled) && (!typeSlug || typeSlug === 'plants');

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

  /* ═══ PLP variant (plan B3 "Card") — the /plants listing card ═══════════
     Fixed sizes (no cqw): the PLP grid cells are 170–230px wide. Shares every
     hook/handler above; the default tree below is untouched. */
  if (variant === 'plp') {
    const badges = getCardBadges(product);
    const placement = facts.find((f) => f.key === 'placement');
    const water = facts.find((f) => f.key === 'water');
    const light = facts.find((f) => f.key === 'light');
    const etaDays = Number(deliveryEtaDays) || 0;
    // city_local true = a vendor in the city stocks it (owner's PDP rule: local = 1 day).
    // null = unknown, never "courier" — then only a real pincode ETA earns a line.
    const delivery = displayOnly
      ? null
      : product.city_local === true
        ? 'Delivery by Tomorrow'
        : etaDays > 0
          ? `Delivery in ${etaDays} day${etaDays === 1 ? '' : 's'}`
          : null;

    const cta = displayOnly ? (
      <button
        type="button"
        disabled
        className="h-9 w-full cursor-not-allowed truncate rounded-control bg-stone-200 px-2 text-[13px] font-semibold text-stone-500"
      >
        {city ? `Out of stock in ${city}` : 'Out of stock'}
      </button>
    ) : isVariable ? (
      /* Every plant carries sizes — the size sheet picks one and adds to cart. */
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openModal('SELECT_PRODUCT_VARIATION', product.slug);
        }}
        className="h-9 w-full rounded-control bg-ds-btn text-[13px] font-semibold text-white transition hover:bg-ds-btn-hover"
      >
        Add to cart
      </button>
    ) : (
      /* Simple product: the shared AddToCart (quantity 1, no stepper). Its
         plantathome button is cqw-sized for the default card; the descendant
         rules pin it to this card's 36px / 13px, and counterClass does the same
         for the in-cart counter (twMerge'd over the variant's h-12/18px). The
         short label fits a 150px six-up card ("Add To Shopping Cart" truncated). */
      <div className="[&_button]:h-9 [&_button]:text-[13px] [&_button]:font-semibold">
        <AddToCart
          variant="plantathome"
          counterVariant="plantathome"
          counterClass="h-9 text-[13px] sm:text-[13px]"
          data={product}
          quantity={1}
          label="Add to Cart"
        />
      </div>
    );

    return (
      <motion.article
        data-product-card
        whileHover={{ y: -3 }}
        transition={{ duration: 0.25 }}
        className={cn(
          'group flex h-full overflow-hidden rounded-lg border border-kraft-200 bg-white transition-shadow duration-300 hover:shadow-box',
          isList ? 'flex-row items-stretch' : 'flex-col',
          className,
        )}
      >
        {/* image box — same-tab PDP link (a shop grid, not the new-tab PRODUCT_LINK_PROPS) */}
        <div
          className={cn(
            'relative shrink-0 bg-[#F7F5EF]',
            isList ? 'min-h-[140px] w-40 self-stretch' : 'aspect-[8/7] w-full',
          )}
        >
          <Link
            href={Routes.product(product.slug)}
            aria-label={`View ${product.name}`}
            className="absolute inset-0 block overflow-hidden"
          >
            <SafeImage
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 16vw"
              quality={70}
              priority={priority}
              className="object-cover transition duration-[450ms] ease-out group-hover:scale-[1.04]"
              fallback={
                <span className="absolute inset-0 grid place-items-center">
                  <PlantMark className="h-12 w-12 text-forest-800/30" />
                </span>
              }
            />
          </Link>

          {badges.length > 0 && (
            <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
              {badges.map((b) => (
                <span
                  key={b.label}
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-semibold leading-[1.4]',
                    BADGE_TONE_CLASS[b.tone],
                  )}
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleWishlist}
            className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-white shadow-box transition hover:scale-110"
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart active={inWishlist} size={14} />
          </button>

          {askAiEnabled && (
            <button
              type="button"
              onClick={handleAskAi}
              aria-label={`Ask AI about ${product.name}`}
              className="absolute bottom-2 right-2 z-10 inline-flex items-center rounded-full border border-white/25 bg-black/45 px-2 py-1 text-[10.5px] font-medium text-white/95 backdrop-blur-md transition hover:border-white/40 hover:bg-black/60"
            >
              Ask AI
            </button>
          )}
        </div>

        {/* body */}
        <div className="flex min-w-0 flex-1 flex-col gap-1 p-2.5">
          <Link
            href={Routes.product(product.slug)}
            title={product.name}
            className="block truncate text-[14px] font-semibold leading-tight text-forest-900 transition hover:text-forest-700"
          >
            {product.name}
          </Link>
          {sciName ? (
            <p title={sciName} className="truncate text-[12px] leading-tight text-stone-500">
              {sciName}
            </p>
          ) : null}
          {reviewCount > 0 ? (
            <p className="flex items-center gap-1 text-[12px] leading-none">
              <Star size={14} fill="#FDBA12" strokeWidth={0} style={{ color: '#FDBA12' }} aria-hidden />
              <strong className="font-semibold text-forest-900">{ratingVal.toFixed(1)}</strong>
              <span className="text-stone-500">
                ({reviewCount.toLocaleString('en-IN')} reviews)
              </span>
            </p>
          ) : null}
          {placement || water ? (
            <p className="flex min-w-0 items-center gap-1 text-[11.5px] leading-tight text-stone-600">
              {placement && (
                <>
                  <Home size={12} className="shrink-0" aria-hidden />
                  <span className="truncate">{placement.value}</span>
                </>
              )}
              {placement && water && <span aria-hidden>·</span>}
              {water && (
                <>
                  <Droplet size={12} className="shrink-0" aria-hidden />
                  <span className="truncate">{water.chip}</span>
                </>
              )}
            </p>
          ) : null}
          {light ? (
            <p className="flex min-w-0 items-center gap-1 text-[11.5px] leading-tight text-stone-600">
              <SunHigh size={12} className="shrink-0" aria-hidden />
              <span className="truncate">{light.value}</span>
            </p>
          ) : null}

          <div
            className={cn(
              'mt-auto pt-1',
              isList ? 'flex flex-wrap items-end justify-between gap-2' : 'flex flex-col gap-1.5',
            )}
          >
            <div className="flex min-w-0 flex-col gap-1">
              <p className="flex flex-wrap items-baseline gap-x-1.5 leading-none">
                {isVariable ? (
                  <>
                    <span className="text-[16px] font-bold text-forest-900">{compactPrice(minPrice)}</span>
                    <span className="text-[12px] text-stone-500">onwards</span>
                  </>
                ) : (
                  <>
                    <span className="text-[16px] font-bold text-forest-900">{compactPrice(price)}</span>
                    {basePrice && (
                      <del className="text-[12px] text-stone-500">{compactPrice(basePrice)}</del>
                    )}
                    {discount && (
                      <span className="rounded bg-[#FFEAEA] px-1.5 py-0.5 text-[10.5px] font-bold text-[#D73C3C]">
                        {discount} OFF
                      </span>
                    )}
                  </>
                )}
              </p>
              {delivery ? (
                <p className="flex items-center gap-1 text-[12px] font-semibold leading-none text-emerald-700">
                  <Truck size={14} className="shrink-0" aria-hidden />
                  {delivery}
                </p>
              ) : null}
            </div>
            <div
              className={cn('w-full', isList && 'max-w-[200px]')}
              onClick={(e) => e.stopPropagation()}
            >
              {cta}
            </div>
          </div>
        </div>
      </motion.article>
    );
  }

  /* ── pieces shared by the grid and list bodies ── */
  const titleRow = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {/* Product name — same family as the body text, bold (user note:
            weight alone distinguishes the name), #184A31 */}
        {/* Type spec given exactly: weight 500, 0.9rem, line-height 1. Fixed, not a clamp —
            the previous clamp scaled the name from 15.5px to 23px with card width, which is
            what made it read as oversized in the grid. A list row has the room for a
            slightly larger name on up to two lines. */}
        <Link
          {...PRODUCT_LINK_PROPS}
          href={Routes.product(product.slug)}
          // The name is truncated, so a long or awkward one is unreadable with no
          // way to see the rest. `title` is the one tooltip that works on both a desktop hover
          // and a mobile long-press without shipping a popover — same approach as cart-item.
          title={product.name}
          className={`block w-full text-left font-medium text-[#184A31] transition hover:text-forest-700 ${
            isList
              ? 'text-[14px] leading-snug line-clamp-2 sm:text-[16px]'
              : 'truncate text-[12.5px] leading-tight sm:text-[0.9rem]'
          }`}
        >
          {product.name}
        </Link>
        {/* Botanical name — Inter 400, up to 16px, #8A8A8A */}
        {sciName ? (
          <p title={sciName} className="mt-[5px] truncate text-[clamp(10px,3.4cqw,12px)] leading-[1.4] text-[#8A8A8A]">{sciName}</p>
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
            <strong className="text-[clamp(11px,3.6cqw,13px)] font-semibold leading-none text-gray-900">
              {ratingVal.toFixed(1)}
            </strong>
          </span>
          <span className="mt-[6px] block text-[clamp(9.5px,3.2cqw,11px)] leading-none text-[#888888]">
            ({reviewCount.toLocaleString('en-IN')})
          </span>
        </div>
      ) : null}
    </div>
  );

  /* Plant facts as chips — whole chips only, on at most two lines.
     flex-wrap + a two-row max-height shows as many complete chips as fit and
     hides the rest cleanly, with no JS measuring. Chips are a fixed 20px tall
     so the cap (2 x 20 + 6 gap) is exact. */
  const chips =
    facts.length > 0 ? (
      <div
        className={`flex max-h-[46px] flex-wrap items-center gap-1.5 overflow-hidden ${
          isList ? 'pah-list-chips mt-2.5' : 'mb-[clamp(7px,2.8cqw,11px)]'
        }`}
      >
        {facts.slice(0, 4).map((f) => (
          <span
            key={f.key}
            className={`inline-flex h-5 max-w-full items-center gap-1 whitespace-nowrap rounded-full bg-[#F3F8EC] font-medium leading-none text-[#24693E] ${
              isList ? 'px-2 text-[10.5px]' : 'px-[clamp(6px,2.4cqw,9px)] text-[clamp(9px,2.9cqw,11px)]'
            }`}
          >
            {/* icon shrink-0 so truncation only ever eats the label */}
            <LineIcon name={f.icon} className="h-3 w-3 shrink-0" aria-hidden />
            <span className="min-w-0 truncate">{f.chip}</span>
          </span>
        ))}
      </div>
    ) : null;

  /* price row — 34px (28px mobile) var(--ds-btn, #2E5E2A) · struck 18px #A0A0A0 ·
     chip #FFEAEA / #D73C3C. Sits directly on top of the CTA.

     Price and struck price group on the LEFT, discount chip pinned RIGHT.
     Previously all three were loose flex items in one wrapping row: at two-up
     mobile they measure 63 + 46 + 58 = 167px inside a 140px row, so the row
     broke onto THREE lines with the chip stranded underneath.

     `compactPrice` drops a whole-rupee ".00" (₹899.00 → ₹899), which is what
     buys the ~40px that lets all three share one line at that width. flex-wrap
     is kept so the narrowest cards still degrade by wrapping rather than
     overflowing. (No bottom margin in the list body — its own gap spaces it.) */
  const priceRow = (
    <div
      className={`flex flex-wrap items-center justify-between gap-x-[clamp(6px,2.6cqw,14px)] gap-y-1 ${
        isList ? '' : 'mb-[clamp(9px,3.4cqw,13px)]'
      }`}
    >
      <span className="flex min-w-0 items-center gap-x-[clamp(5px,2.2cqw,10px)]">
        {/* variable products show the size range min–max */}
        <span
          className={`whitespace-nowrap leading-none text-ds-btn ${
            isVariable && hasRange
              ? 'text-[clamp(12px,4.4cqw,16px)] font-semibold'
              : 'text-[clamp(13.5px,5.4cqw,19px)] font-bold'
          }`}
        >
          {isVariable
            ? hasRange
              ? `${compactPrice(minPrice)} – ${compactPrice(maxPrice)}`
              : compactPrice(minPrice)
            : compactPrice(price)}
        </span>
        {!isVariable && basePrice && (
          <del className="whitespace-nowrap text-[clamp(11px,4.4cqw,18px)] leading-none text-[#A0A0A0]">
            {compactPrice(basePrice)}
          </del>
        )}
      </span>
      {!isVariable && discount && (
        <span className="shrink-0 whitespace-nowrap rounded bg-[#FFEAEA] px-[clamp(6px,2.6cqw,12px)] py-1.5 text-[clamp(9.5px,3.4cqw,14px)] font-bold leading-none text-[#D73C3C]">
          {discount} OFF
        </span>
      )}
    </div>
  );

  /* footer — qty stepper + Add to Cart (reference .footer) */
  const cta = isVariable ? (
    /* Sizes are chosen on the product page — this used to open a
       quick-view popup over the grid. */
    <Link
      {...PRODUCT_LINK_PROPS}
      href={Routes.product(product.slug)}
      /* Slimmer scale (2026-08-07): the 48px/18px ceilings made these read
         as heavy slabs on wide cards. Kept in lockstep with the qty stepper
         below and add-to-cart-btn/add-to-cart, which share this baseline —
         changing one alone breaks the action row's alignment. */
      className="flex h-[clamp(34px,9.5cqw,40px)] w-full items-center justify-center gap-2 whitespace-nowrap rounded-control bg-ds-btn px-2 text-[clamp(11px,3.6cqw,14px)] font-medium text-white transition duration-300 hover:bg-ds-btn-hover focus:outline-0"
    >
      {/* Cart glyph dropped: on a ~150px two-up card it ate the width the label
          needed, crowding "Select Options". The wording alone is unambiguous —
          this opens the product page to choose a size, it does not add to cart. */}
      Select Options
    </Link>
  ) : (
    <div className="pah-card-actions flex gap-[clamp(8px,3.9cqw,15px)]">
      {!inCart && !displayOnly && (
        <div className="flex h-[clamp(34px,9.5cqw,40px)] w-[clamp(80px,27cqw,104px)] shrink-0 items-center justify-around rounded border border-[#DDDDDD]">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-1.5 text-[clamp(18px,7.2cqw,28px)] leading-none text-[#333333] transition hover:text-ds-btn"
          >
            −
          </button>
          <span className="text-[clamp(13.5px,5.2cqw,20px)] font-semibold leading-none text-gray-900">{qty}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => q + 1)}
            className="px-1.5 text-[clamp(18px,7.2cqw,28px)] leading-none text-[#333333] transition hover:text-ds-btn"
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
  );

  return (
    <motion.article
      data-product-card
      whileHover={{ y: -8 }}
      transition={{ duration: 0.35 }}
      // container-type makes every size inside scale with the CARD's width
      // (cqw units): full reference sizes at its native 390px, fluidly smaller
      // in dense grids (search page cells are ~230px) — nothing truncates or
      // wraps at any grid density.
      className={`group flex h-full overflow-hidden rounded-2xl border border-kraft-200 bg-white shadow-box transition-shadow duration-300 [container-type:inline-size] hover:shadow-[0_10px_18px_rgba(0,0,0,0.08),0_30px_60px_rgba(0,0,0,0.12)] ${
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
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
          <span className="absolute left-[clamp(10px,4.6cqw,18px)] top-[clamp(10px,4.6cqw,18px)] z-10 rounded bg-[#1C5E3C] px-[clamp(9px,3.8cqw,15px)] py-[clamp(5px,2cqw,8px)] text-[clamp(11px,3.8cqw,14px)] font-semibold leading-none text-white">
            No Image
          </span>
        ) : badge ? (
          <span className="absolute bottom-[clamp(10px,4.6cqw,18px)] left-[clamp(10px,4.6cqw,18px)] z-10 rounded bg-[#1C5E3C] px-[clamp(9px,3.8cqw,15px)] py-[clamp(5px,2cqw,8px)] text-[clamp(11px,3.8cqw,14px)] font-semibold leading-none text-white">
            {badge}
          </span>
        ) : reviewCount === 0 ? (
          <span className="absolute bottom-[clamp(10px,4.6cqw,18px)] left-[clamp(10px,4.6cqw,18px)] z-10 rounded bg-sage-100 px-[clamp(9px,3.8cqw,15px)] py-[clamp(5px,2cqw,8px)] text-[clamp(11px,3.8cqw,14px)] font-semibold leading-none text-forest-800">
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
            className="absolute left-[clamp(10px,4.6cqw,18px)] top-[clamp(10px,4.6cqw,18px)] z-10 inline-flex items-center rounded-full border border-white/25 bg-black/45 px-2.5 py-1.5 text-[11px] font-medium text-white/95 backdrop-blur-md transition hover:border-white/40 hover:bg-black/60"
          >
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
        className={`flex flex-1 p-[clamp(14px,6.2cqw,24px)] ${
          isList ? 'min-w-0 [container-type:inline-size]' : 'flex-col'
        }`}
      >
        {isList ? (
          /* LIST (annotation 2026-10-05): the row is wide, so the plant facts
             get a real spec grid and the price + a compact CTA move to a zone
             on the right — instead of three clipped chips, a 340px button and
             an empty right half. Layout lives in plantathome-overrides.css
             (.pah-list-*), keyed off THIS column's width by container query. */
          <div className="pah-list-body">
            <div className="flex min-w-0 flex-1 flex-col">
              {titleRow}
              {desc ? (
                <p className="mt-1.5 text-[12.5px] leading-[1.45] text-[#5B5B5B] line-clamp-2">{desc}</p>
              ) : null}
              {/* A phone-width row can't seat a label/value grid (values cut to
                  "Brig…"), so it gets the same whole-chip row as the grid card;
                  the spec grid takes over from 300px. Both are in the DOM and
                  swapped by container query — display:none also keeps the
                  hidden one out of the accessibility tree. */}
              {chips}
              {facts.length > 0 && (
                <dl className="pah-list-facts">
                  {facts.slice(0, 6).map((f) => (
                    <div key={f.key} className="flex min-w-0 items-center gap-2">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#F3F8EC] text-[#24693E]">
                        <LineIcon name={f.icon} className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <dt className="text-[10px] font-semibold uppercase leading-none tracking-[0.08em] text-stone-500">
                          {f.label}
                        </dt>
                        <dd title={f.value} className="mt-1 truncate text-[12.5px] font-medium leading-tight text-forest-900">
                          {f.value}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>
              )}
            </div>
            <div className="pah-list-actions border-kraft-200" onClick={(e) => e.stopPropagation()}>
              {priceRow}
              <div className="pah-list-cta">{cta}</div>
            </div>
          </div>
        ) : (
          <>
            {titleRow}

            {/* description — Inter 17px (15px mobile), #5B5B5B, lh 1.6; 2-line
                clamp with fixed min-height so grid rows stay aligned. Vertical
                margins are tighter than the reference's standalone card — inside a
                grid the full 18/22px rhythm made cards run too long. */}
            <p className="mb-[0.275rem] mt-[0.1rem] min-h-[2.6em] text-[clamp(10.5px,3.4cqw,12.5px)] leading-[1.3] text-[#5B5B5B] line-clamp-2">
              {desc}
            </p>

            <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
              {/* Plant facts — replaced the "Free Delivery | 2–4 Days" band, which
                  read identically on every card (so it distinguished nothing).
                  These say something per-plant instead, and sit ABOVE the price
                  (annotation 2026-10-05: "if there is some data about the plant,
                  it should be shown"). The row used to be nowrap with each chip
                  capped at 46%: labels truncated to "Bright Indir…" and the third
                  chip was sliced mid-pill by the card edge — see `chips` above.
                  No reserved min-height: this whole block is mt-auto, so the CTAs
                  line up across a grid row whether or not a product has attributes. */}
              {chips}
              {priceRow}
              {cta}
            </div>
          </>
        )}
      </div>
    </motion.article>
  );
};

export default PlantAtHomeCard;
