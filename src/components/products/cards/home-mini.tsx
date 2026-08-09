'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Routes } from '@/config/routes';
import { useToggleWishlist, useInWishlist } from '@/framework/wishlist';
import { useUser } from '@/framework/user';
import { goToSignin } from '@/lib/go-to-signin';
import usePrice from '@/lib/use-price';
import { compactPrice, getCardBadge, shortDescription, PRODUCT_LINK_PROPS } from '@/components/products/cards/card-helpers';
import { Heart, Star, ShoppingBag } from '@/components/ui/icon';
import type { Product } from '@/types';

const AddToCart = dynamic(
  () => import('@/components/products/add-to-cart/add-to-cart').then((m) => m.AddToCart),
  { ssr: false },
);

/** Compact bestseller card for the home page: photo + badge + heart, serif
 *  name, single-star rating, price + square cart button. Styling matches the
 *  full PlantAtHomeCard (listing/search pages) — this one just stays compact. */
const HomeMiniCard: React.FC<{ product: Product; className?: string }> = ({
  product,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
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
  const { price: maxPrice } = usePrice({ amount: product.max_price });

  // Whole-rupee ".00" is dropped so "₹1,299.00" doesn't ellipsise in this
  // card's ~65px price column. Shared with the big card — see compactPrice.
  const compact = compactPrice;
  const hasRange =
    Number(product.max_price) > Number(product.min_price) && Number(product.min_price) > 0;

  const rating = Number((product as any).ratings) || 0;
  const count = Number((product as any).total_reviews) || 0;
  const isVariable = product.product_type?.toLowerCase() === 'variable';
  const image = product.image?.original ?? product.image?.thumbnail ?? '';
  const badge = getCardBadge(product);
  const sciName =
    (product as any).scientific_name ??
    (product.plant_attribute as any)?.scientific_name ??
    null;

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
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-[16px] border border-kraft-200 bg-white transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(34,48,26,0.1)] ${className}`}
    >
      {/* photo + badge + heart (heart is a sibling of the link — valid HTML) */}
      <div className="relative">
        <Link
          {...PRODUCT_LINK_PROPS}
          href={Routes.product(product.slug)}
          aria-label={product.name}
          className="relative block aspect-square w-full overflow-hidden bg-[#F6F8F4]"
        >
          {image && !imgError ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 17vw"
              onError={() => setImgError(true)}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(130%_130%_at_30%_15%,#FBFCF8,#E9F0E3_70%,#DEE9D6)]" />
          )}
          {badge ? (
            <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-forest-800 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-white shadow-sm">
              {badge}
            </span>
          ) : null}
          {/* Discount rides on the IMAGE, not in the price row. This card is
              ~131px wide in a two-up rail, which leaves ~65px beside the cart
              button — the chip could never fit there, so it overflowed and ran
              under the button along with the price. Bottom-left is the only
              free corner (badge top-left, wishlist top-right). */}
          {!isVariable && discount ? (
            <span className="absolute bottom-2.5 left-2.5 z-10 rounded-md bg-[#D73C3C] px-1.5 py-0.5 text-[9px] font-bold leading-none tracking-wide text-white shadow-sm">
              {discount} OFF
            </span>
          ) : null}
        </Link>
        <button
          type="button"
          onClick={handleWishlist}
          className="absolute right-2.5 top-2.5 z-10 grid h-7 w-7 place-items-center rounded-full bg-white shadow-sm transition hover:scale-105"
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={14}
            fill={inWishlist ? '#C26B45' : 'none'}
            style={{ color: inWishlist ? '#C26B45' : '#1E4023' }}
            aria-hidden
          />
        </button>
      </div>

      {/* body — rating sits top-right of this section (like the big card);
          the line under the name is a short plant blurb, never "New" */}
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-start justify-between gap-2">
          <Link
            {...PRODUCT_LINK_PROPS}
            href={Routes.product(product.slug)}
            className="min-w-0 truncate text-left text-[15px] font-bold leading-[1.2] text-[#1D4D35]"
          >
            {product.name}
          </Link>
          {count > 0 ? (
            <span className="flex shrink-0 items-center gap-1 pt-0.5">
              <Star size={14} fill="currentColor" strokeWidth={0} style={{ color: '#FDBA12' }} aria-hidden />
              <span className="text-[12px] font-semibold leading-none text-gray-900">
                {rating.toFixed(1)}
              </span>
            </span>
          ) : null}
        </div>
        {sciName ? (
          <p className="mt-0.5 truncate text-[11px] text-[#6B7280]">{sciName}</p>
        ) : null}
        <p className="mt-1 line-clamp-1 text-[11.5px] leading-[1.5] text-stone-500">
          {shortDescription(product)}
        </p>

        {/* price + cart — variable products show the size range min–max */}
        <div className="mt-auto flex items-center justify-between gap-1.5 pt-2.5">
          {/*
            A COLUMN, not a wrapping row. The card is ~131px wide (two-up rail),
            so after the 36px button and the gap the price gets ~65px. The old
            row put price + struck price + discount chip in there at 76/51/57px
            each: every one overflowed its box and ran underneath the cart
            button. Price on its own line, struck price beneath, discount moved
            to the image, and smaller type throughout.

            A variable product shows "₹359+" rather than the full "₹359 – ₹929"
            range — the range needs ~105px and simply cannot fit beside a button
            at this width, so it used to wrap mid-price.
          */}
          <span className="flex min-w-0 flex-col gap-[3px]">
            <span className="truncate text-[13px] font-bold leading-none text-[#14532D]">
              {isVariable ? (hasRange ? `${compact(minPrice)}+` : compact(minPrice)) : compact(price)}
            </span>
            {!isVariable && basePrice && (
              <del className="truncate text-[10px] font-medium leading-none text-[#9CA3AF]">
                {compact(basePrice)}
              </del>
            )}
          </span>
          {isVariable ? (
            <Link
              {...PRODUCT_LINK_PROPS}
              href={Routes.product(product.slug)}
              aria-label="Select options"
              title="Select options"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-ds-btn text-white transition duration-200 hover:bg-ds-btn-hover"
            >
              <ShoppingBag size={16} aria-hidden />
            </Link>
          ) : (
            <AddToCart variant="homeMini" counterVariant="plantathome" counterClass="!h-9 !w-[96px]" data={product} />
          )}
        </div>
      </div>
    </article>
  );
};

export default HomeMiniCard;
