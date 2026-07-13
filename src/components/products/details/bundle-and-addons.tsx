import React from 'react';
import Link from 'next/link';
import { useCart } from '@/store/quick-cart/cart.context';
import { generateCartItem } from '@/store/quick-cart/generate-cart-item';
import { productPlaceholder } from '@/lib/placeholders';
import type { Product } from '@/types';

const fmtINR = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN');
// variable items (size-priced) carry no price/sale_price → fall back to min_price
const unit = (p: any) =>
  Number(p?.sale_price) || Number(p?.price) || Number(p?.min_price) || 0;

function Thumb({ p }: { p: any }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={p?.image?.thumbnail || p?.image?.original || productPlaceholder}
      alt={p?.name}
      className="h-14 w-14 shrink-0 rounded-lg border border-kraft-200 object-cover"
    />
  );
}

/**
 * On the product page: shows a bundle's contents (what's inside + total value vs
 * offer) and/or buy-together add-ons (pots/planters) the customer can add.
 */
export default function BundleAndAddons({ product }: { product: Product }) {
  const { addItemToCart, isInCart, removeItemFromCart } = useCart();
  const isBundle = product?.product_type === 'bundle';
  const bundleItems = product?.bundle_items ?? [];
  const addons = product?.addons ?? [];
  const total = Number(product?.bundle_total_value ?? 0);
  const offer = Number(product?.sale_price ?? 0) || Number(product?.price ?? 0);
  const save = total > offer ? total - offer : 0;

  const toggle = (p: any) => {
    const item = generateCartItem(p as any, {} as any);
    if (isInCart(item.id)) removeItemFromCart(item.id);
    else addItemToCart(item, 1);
  };

  if (!isBundle && addons.length === 0) return null;

  return (
    <div className="mt-8 space-y-8 border-t border-kraft-200 pt-8">
      {/* Bundle contents */}
      {isBundle && bundleItems.length > 0 && (
        <div>
          <h3 className="font-serif text-2xl font-semibold text-forest-900">What&apos;s inside this bundle</h3>
          <div className="mt-4 space-y-3">
            {bundleItems.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                className="flex items-center gap-3 rounded-lg border border-kraft-200 bg-white p-3 transition hover:border-forest-700/40"
              >
                <Thumb p={p} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-lg font-semibold text-forest-900">{p.name}</p>
                  {p.scientific_name && <p className="text-xs italic text-stone-500">{p.scientific_name}</p>}
                </div>
                <span className="text-sm font-semibold text-stone-600">{fmtINR(unit(p))}</span>
              </Link>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-sage-100 px-4 py-3">
            <span className="text-sm text-forest-800">
              Total value <span className="line-through">{fmtINR(total)}</span> · bundle price{' '}
              <span className="font-bold">{fmtINR(offer)}</span>
            </span>
            {save > 0 && <span className="rounded-full bg-clay-500 px-3 py-1 text-xs font-bold text-white">Save {fmtINR(save)}</span>}
          </div>
        </div>
      )}

      {/* Buy together — pots / planters */}
      {addons.length > 0 && (
        <div>
          <h3 className="font-serif text-2xl font-semibold text-forest-900">Complete the look</h3>
          <p className="mt-1 text-sm text-stone-600">Add a pot or planter to buy together — or skip it, your choice.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {addons.map((p) => {
              const item = generateCartItem(p as any, {} as any);
              const inCart = isInCart(item.id);
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border border-kraft-200 bg-white p-3">
                  <Thumb p={p} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-base font-semibold text-forest-900">{p.name}</p>
                    <p className="text-sm font-semibold text-stone-600">{fmtINR(unit(p))}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(p)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      inCart
                        ? 'bg-sage-100 text-forest-800 hover:bg-sage-200'
                        : 'bg-ds-btn text-white hover:bg-ds-btn-hover'
                    }`}
                  >
                    {inCart ? 'Added ✓' : 'Add pot'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
