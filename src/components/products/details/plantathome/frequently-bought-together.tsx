'use client';
import React, { useState } from 'react';
import type { Product } from '@/types';
import { formatINR } from '@/components/storefront/verticals';
import { PLACEHOLDER } from '@/components/storefront/pah/_img';
import { useCart } from '@/store/quick-cart/cart.context';
import { generateCartItem } from '@/store/quick-cart/generate-cart-item';
import { getVariations } from '@/lib/get-variations';
import { findVariant, sellable, type Groups, type VariantRow } from '@/lib/variant-match';
import { LineIcon } from '@/components/icons/line-icons';
import { useAttributes } from '../attributes.context';

/** Effective unit price — variable items (size-priced) fall back to min_price. */
const unitPrice = (p: any) =>
  Number(p?.sale_price) || Number(p?.price) || Number(p?.min_price) || 0;

/** Real sale saving for one product — 0 unless sale_price < price (both real). */
const saving = (p: any) => {
  const base = Number(p?.price) || 0;
  const sale = Number(p?.sale_price) || 0;
  return sale > 0 && base > sale ? base - sale : 0;
};

const isVariable = (p: any) => String(p?.product_type ?? '').toLowerCase() === 'variable';
/** A companion that can only be added as a variant: variable, or without a price of its own
 *  (curated addons carry no product_type, and a variable product's own price is NULL). */
const needsVariant = (p: any) => isVariable(p) || !(Number(p?.sale_price) || Number(p?.price));
/** A companion joins "Add all" only with the variant the API picked for it (`default_variation`,
 *  its cheapest enabled one); without one it is left out of the add and the total. */
const joins = (p: any) => !needsVariant(p) || !!p?.default_variation;

/**
 * "Frequently Bought Together" — REAL data only: curated addons when present,
 * otherwise the first 3 related products. Prices come from each product
 * (sale_price ?? price ?? min_price), or from the variant it is added as; the
 * savings chip only shows when real sale-vs-base prices make it computable.
 * "Add all" puts the main product AND every companion in the cart as separate
 * lines — a variable product never without its variant.
 */
export default function FrequentlyBoughtTogether({ product }: { product: Product }) {
  const { addItemToCart, updateCartLanguage, language } = useCart();
  // The size picked on the page above: FBT sits inside the PDP's AttributesProvider.
  const { attributes } = useAttributes();
  const [added, setAdded] = useState(false);
  const p: any = product;

  // Related products arrive from the API already buyable (published, listed, in stock, priced),
  // same categories, nearest in price first. Owner 2026-10-14: keep the price range too — half to
  // 2.5× this product's price; if fewer than two sit in that band, the closest ones stand in.
  const anchor = unitPrice(p);
  const related = ((p?.related_products ?? []) as any[]).filter((r) => r?.id !== p?.id && joins(r));
  const inBand = anchor > 0
    ? related.filter((r) => { const v = unitPrice(r); return v >= anchor * 0.5 && v <= anchor * 2.5; })
    : related;
  const addons = ((p?.addons ?? []) as any[]).filter(joins);
  const companions: any[] = (addons.length ? addons : inBand.length >= 2 ? inBand : related).slice(0, 3);

  if (companions.length === 0) return null;

  // The main product joins with the variant picked above, once it can be sold (the PDP's own
  // CTA gate); a variable one without it keeps "Add all" disabled.
  const rows = (p?.variation_options ?? []) as VariantRow[];
  const picked = isVariable(p) ? findVariant(rows, getVariations(p?.variations) as Groups, attributes) : undefined;
  const mainVariant = picked && sellable(picked, rows) ? picked : undefined;
  const mainReady = !isVariable(p) || !!mainVariant;

  // [product, the variant it is added as (undefined = a simple product)], main product first.
  const lines: [any, any][] = [
    [p, mainVariant],
    ...companions.map((it): [any, any] => [it, needsVariant(it) ? it.default_variation : undefined]),
  ];
  const total = lines.reduce((sum, [it, v]) => sum + unitPrice(v ?? it), 0);
  // Savings only when computable from real sale vs base prices (else omitted).
  const save = lines.reduce((sum, [it, v]) => sum + saving(v ?? it), 0);

  const addAll = () => {
    if (!mainReady) return;
    // generateCartItem reads shop.id for a variant line; related and addon payloads carry no shop.
    const [main, ...rest] = lines.map(([it, v]) =>
      generateCartItem({ ...it, shop: it.shop ?? { id: it.shop_id } }, v),
    );
    if (main?.language && main.language !== language) updateCartLanguage(main.language);
    for (const item of [main, ...rest]) addItemToCart(item, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="rounded-2xl border border-kraft-200 bg-white p-6 shadow-box">
      <h3 data-t="pdp.h.upper" className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#141414]">
        Frequently Bought Together
      </h3>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* scrollable product track — min-w-0 so ONLY this scrolls, not the page */}
        <div className="flex min-w-0 flex-1 flex-nowrap snap-x snap-mandatory items-start gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:snap-start">
          {lines.map(([it, v], i) => {
            const img = it?.image?.thumbnail || it?.image?.original || '';
            return (
              <React.Fragment key={it?.id ?? i}>
                <div className="flex w-[84px] shrink-0 flex-col items-center text-center">
                  <div className="h-[72px] w-[72px] overflow-hidden rounded-xl border border-kraft-200 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img || PLACEHOLDER}
                      alt={it?.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="mt-1.5 line-clamp-2 text-[12.387px] font-semibold leading-tight text-[#141414]">
                    {it?.name}
                  </span>
                  <span className="text-[12.387px] text-[#141414]">
                    {formatINR(unitPrice(v ?? it))}
                  </span>
                </div>
                {i < lines.length - 1 && (
                  <span className="mt-7 shrink-0 text-[#24693E]">
                    <LineIcon name="plus" className="h-4 w-4" />
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
            disabled={!mainReady}
            data-t="pdp.button"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control bg-ds-btn px-5 py-3 text-[14.443px] font-semibold text-white transition hover:bg-ds-btn-hover disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {added ? (
              <>
                <LineIcon name="check" className="h-4 w-4" />
                Added to Cart
              </>
            ) : !mainReady ? (
              'Select a size first'
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
