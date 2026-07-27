'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { useToggleWishlist, useInWishlist } from '@/framework/wishlist';
import { useUser } from '@/framework/user';
import { goToSignin } from '@/lib/go-to-signin';
import usePrice from '@/lib/use-price';
import { getCardBadge, shortDescription } from '@/components/products/cards/card-helpers';
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
  const { price: maxPrice } = usePrice({ amount: product.max_price });
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

  function handleQuickView() {
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
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-[16px] border border-kraft-200 bg-white transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(34,48,26,0.1)] ${className}`}
    >
      {/* photo + badge + heart (heart is a sibling of the button — valid HTML) */}
      <div className="relative">
        <button
          type="button"
          onClick={handleQuickView}
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
        </button>
        <button
          type="button"
          onClick={handleWishlist}
          className="absolute right-2.5 top-2.5 z-10 grid h-7 w-7 place-items-center rounded-full bg-white shadow-sm transition hover:scale-105"
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill={inWishlist ? '#C26B45' : 'none'} stroke={inWishlist ? '#C26B45' : '#1E4023'} strokeWidth="1.8" aria-hidden>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* body — rating sits top-right of this section (like the big card);
          the line under the name is a short plant blurb, never "New" */}
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={handleQuickView}
            className="min-w-0 truncate text-left font-heading text-[17px] font-bold leading-[1.15] text-[#1D4D35]"
          >
            {product.name}
          </button>
          {count > 0 ? (
            <span className="flex shrink-0 items-center gap-1 pt-0.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#FDBA12" aria-hidden>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
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
        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
          <span className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="text-[15.5px] font-bold leading-none text-[#14532D]">
              {isVariable ? (hasRange ? `${minPrice} – ${maxPrice}` : minPrice) : price}
            </span>
            {!isVariable && basePrice && (
              <del className="text-[11px] font-medium leading-none text-[#9CA3AF]">{basePrice}</del>
            )}
            {!isVariable && discount && (
              <span className="rounded-md bg-[#FFEAEA] px-1.5 py-0.5 text-[10px] font-bold leading-none text-[#D73C3C]">
                {discount} OFF
              </span>
            )}
          </span>
          {isVariable ? (
            <button
              type="button"
              onClick={handleQuickView}
              aria-label="Select options"
              title="Select options"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-ds-btn text-white transition duration-200 hover:bg-ds-btn-hover"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                <circle cx="9" cy="21" r="1.6" />
                <circle cx="19" cy="21" r="1.6" />
                <path d="M1 1h3l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
              </svg>
            </button>
          ) : (
            <AddToCart variant="homeMini" counterVariant="plantathome" counterClass="!h-9 !w-[96px]" data={product} />
          )}
        </div>
      </div>
    </article>
  );
};

export default HomeMiniCard;
