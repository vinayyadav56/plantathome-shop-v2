'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useModalAction } from '@/components/ui/modal/modal.context';
import usePrice from '@/lib/use-price';
import type { Product } from '@/types';

const AddToCart = dynamic(
  () => import('@/components/products/add-to-cart/add-to-cart').then((m) => m.AddToCart),
  { ssr: false },
);

/** Compact bestseller card for the home page (per the home reference): photo,
 *  name, single-star rating, price + square cart button. Listing/search pages
 *  keep the richer PlantAtHomeCard. */
const HomeMiniCard: React.FC<{ product: Product; className?: string }> = ({
  product,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const { openModal } = useModalAction();

  const { price } = usePrice({
    amount: product.sale_price ? product.sale_price : product.price,
    baseAmount: product.price,
  });
  const { price: minPrice } = usePrice({ amount: product.min_price });

  const rating = Number((product as any).ratings) || 0;
  const count = Number((product as any).total_reviews) || 0;
  const isVariable = product.product_type?.toLowerCase() === 'variable';
  const image = product.image?.original ?? product.image?.thumbnail ?? '';

  function handleQuickView() {
    openModal('PRODUCT_DETAILS', product.slug);
  }

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-[14px] border border-kraft-200 bg-white transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(34,48,26,0.1)] ${className}`}
    >
      {/* photo */}
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
      </button>

      {/* body */}
      <div className="flex flex-1 flex-col p-3">
        <button
          type="button"
          onClick={handleQuickView}
          className="truncate text-left text-[13.5px] font-semibold text-forest-900"
        >
          {product.name}
        </button>

        {/* rating */}
        <div className="mt-1 flex items-center gap-1 text-[11.5px] font-medium text-stone-500">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#B58E39" stroke="#B58E39" strokeWidth="1.4" aria-hidden>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          {rating > 0 ? <span className="text-forest-900">{rating.toFixed(1)}</span> : null}
          <span>{count > 0 ? `(${count.toLocaleString('en-IN')})` : 'New'}</span>
        </div>

        {/* price + cart */}
        <div className="mt-auto flex items-center justify-between pt-2.5">
          <span className="text-[16.5px] font-bold leading-none text-forest-900">
            {isVariable ? minPrice : price}
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
