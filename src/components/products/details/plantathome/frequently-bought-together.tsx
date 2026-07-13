'use client';
import React from 'react';
import type { Product } from '@/types';
import { formatINR } from '@/components/storefront/verticals';
import { useCart } from '@/store/quick-cart/cart.context';
import { generateCartItem } from '@/store/quick-cart/generate-cart-item';

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
);
const ArrowR = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
);
const Stand = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4h8l-1 6H9zM7 10h10M9 10l-2 10M15 10l2 10M6 20h12" /></svg>
);
const Food = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2v3M15 2v3M7 5h10l-1 5H8zM8 10v8a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-8" /></svg>
);
const Meter = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M12 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM9 6l3-3 3 3" /></svg>
);

export default function FrequentlyBoughtTogether({ product }: { product: Product }) {
  const { addItemToCart, updateCartLanguage, language } = useCart();
  const p: any = product;
  const img = p?.image?.original || p?.image?.thumbnail || '';
  const base = Number(p?.sale_price ? p.sale_price : p?.price) || 0;

  const addons = [
    { name: 'Luxury Pot Stand', price: 1299, icon: <Stand /> },
    { name: 'Organic Plant Food', price: 499, icon: <Food /> },
    { name: 'Moisture Meter', price: 599, icon: <Meter /> },
  ];
  const sum = base + addons.reduce((a, b) => a + b.price, 0);
  const save = 600;
  const bundle = Math.max(0, sum - save);

  const items = [
    { name: p?.name, price: base, img },
    ...addons,
  ];

  const addAll = () => {
    const item = generateCartItem(product as any, {} as any);
    if (item?.language && item.language !== language) updateCartLanguage(item.language);
    addItemToCart(item, 1);
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_12px_34px_-22px_rgba(34,48,26,0.28)]">
      <h3 className="font-poppins text-[1.2rem] font-bold text-forest-700">Frequently Bought Together</h3>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* scrollable product track (left/right) — min-w-0 so ONLY this scrolls, not the page */}
        <div className="flex min-w-0 flex-1 flex-nowrap snap-x snap-mandatory items-start gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:snap-start">
          {items.map((it: any, i) => (
            <React.Fragment key={i}>
              <div className="flex w-[84px] shrink-0 flex-col items-center text-center">
                <div className="grid h-[72px] w-[72px] place-items-center overflow-hidden rounded-xl border border-kraft-200 bg-sage-100 text-forest-700">
                  {it.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.img} alt={it.name} className="h-full w-full object-cover" />
                  ) : (
                    it.icon
                  )}
                </div>
                <span className="mt-1.5 line-clamp-2 text-[10.5px] font-medium leading-tight text-forest-900">{it.name}</span>
                <span className="text-[10.5px] text-stone-500">{formatINR(it.price)}</span>
              </div>
              {i < items.length - 1 && (
                <span className="mt-7 shrink-0 text-forest-600"><PlusIcon /></span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* fixed CTA — does not scroll */}
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-stretch sm:gap-2">
          <button
            type="button"
            onClick={addAll}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-ds-btn px-5 py-3 text-[13.5px] font-semibold text-white transition hover:bg-ds-btn-hover"
          >
            Add All To Cart {formatINR(bundle)}
          </button>
          <span className="whitespace-nowrap rounded-full bg-clay-100 px-3 py-1.5 text-center text-[12px] font-semibold text-clay-600">Save {formatINR(save)}</span>
        </div>
      </div>
    </div>
  );
}
