'use client';
import React, { useState } from 'react';
import type { Product } from '@/types';
import { formatINR } from '@/components/storefront/verticals';
import { productPlaceholder } from '@/lib/placeholders';
import { useCart } from '@/store/quick-cart/cart.context';
import { generateCartItem } from '@/store/quick-cart/generate-cart-item';
import { LineIcon } from '@/components/icons/line-icons';

/** Effective unit price — variable items (size-priced) fall back to min_price. */
const unitPrice = (p: any) =>
  Number(p?.sale_price) || Number(p?.price) || Number(p?.min_price) || 0;

/** Real sale saving for one product — 0 unless sale_price < price (both real). */
const saving = (p: any) => {
  const base = Number(p?.price) || 0;
  const sale = Number(p?.sale_price) || 0;
  return sale > 0 && base > sale ? base - sale : 0;
};

/**
 * "Frequently Bought Together" — REAL data only: curated addons when present,
 * otherwise the first 3 related products. Prices come from each product
 * (sale_price ?? price ?? min_price); the savings chip only shows when real
 * sale-vs-base prices make it computable. "Add all" puts the main product AND
 * every companion in the cart as separate lines.
 */
export default function FrequentlyBoughtTogether({ product }: { product: Product }) {
  const { addItemToCart, updateCartLanguage, language } = useCart();
  const [added, setAdded] = useState(false);
  const p: any = product;

  const companions: any[] = (
    p?.addons?.length
      ? p.addons
      : ((p?.related_products ?? []) as any[]).filter((r) => r?.id !== p?.id)
  ).slice(0, 3);

  if (companions.length === 0) return null;

  const mainPrice = unitPrice(p);
  const total = mainPrice + companions.reduce((sum, it) => sum + unitPrice(it), 0);
  // Savings only when computable from real sale vs base prices (else omitted).
  const save = saving(p) + companions.reduce((sum, it) => sum + saving(it), 0);

  const items = [p, ...companions];

  const addAll = () => {
    const main = generateCartItem(p, undefined as any);
    if (main?.language && main.language !== language) updateCartLanguage(main.language);
    addItemToCart(main, 1);
    for (const it of companions) {
      addItemToCart(generateCartItem(it, undefined as any), 1);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="rounded-[22px] border border-[#ECECEC] bg-white p-6 shadow-[0_4px_10px_rgba(0,0,0,0.04),0_20px_40px_rgba(0,0,0,0.08)]">
      <h3 className="text-[19px] font-bold text-[#184A31]">
        Frequently Bought Together
      </h3>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* scrollable product track — min-w-0 so ONLY this scrolls, not the page */}
        <div className="flex min-w-0 flex-1 flex-nowrap snap-x snap-mandatory items-start gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:snap-start">
          {items.map((it: any, i) => {
            const img = it?.image?.thumbnail || it?.image?.original || '';
            return (
              <React.Fragment key={it?.id ?? i}>
                <div className="flex w-[84px] shrink-0 flex-col items-center text-center">
                  <div className="h-[72px] w-[72px] overflow-hidden rounded-[14px] border border-[#ECECEC] bg-[#F7F5EF]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img || productPlaceholder}
                      alt={it?.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="mt-1.5 line-clamp-2 text-[10.5px] font-semibold leading-tight text-[#184A31]">
                    {it?.name}
                  </span>
                  <span className="text-[10.5px] text-[#8A8A8A]">
                    {formatINR(unitPrice(it))}
                  </span>
                </div>
                {i < items.length - 1 && (
                  <span className="mt-7 shrink-0 text-[#24693E]">
                    <LineIcon name="plus" className="h-4 w-4" strokeWidth={2.4} />
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* fixed CTA — does not scroll */}
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-stretch sm:gap-2">
          <button
            type="button"
            onClick={addAll}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] bg-[#14532D] px-5 py-3 text-[13.5px] font-semibold text-white transition hover:bg-[#0D4324]"
          >
            {added ? (
              <>
                <LineIcon name="check" className="h-4 w-4" strokeWidth={2.4} />
                Added to Cart
              </>
            ) : (
              <>
                <LineIcon name="cart" className="h-4 w-4" />
                Add All to Cart {formatINR(total)}
              </>
            )}
          </button>
          {save > 0 && (
            <span className="whitespace-nowrap rounded-full bg-[#FFEAEA] px-3 py-1.5 text-center text-[12px] font-bold text-[#D73C3C]">
              Save {formatINR(save)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
