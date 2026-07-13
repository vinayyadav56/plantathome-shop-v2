'use client';
import React from 'react';
import { goToSignin } from '@/lib/go-to-signin';
import Link from 'next/link';
import { useRouter } from '@/compat/next-router';
import { useAtom } from 'jotai';
import { cn } from '@/lib/cn';
import { PLACEHOLDER } from './_img';
import { useCart } from '@/store/quick-cart/cart.context';
import { generateCartItem } from '@/store/quick-cart/generate-cart-item';
import { useToggleWishlist } from '@/framework/wishlist';
import { authorizationAtom } from '@/store/authorization-atom';
import { useModalAction } from '@/components/ui/modal/modal.context';
import type { Product } from '@/types';

/** ₹ with no decimals + en-IN grouping (matches the design). */
function rupee(n?: number): string {
  const v = Number(n) || 0;
  return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function imgOf(p: Product): string {
  return p?.image?.original || p?.image?.thumbnail || PLACEHOLDER;
}

function badgeOf(p: Product): string | null {
  const t = (p?.tags || []).find((x) => /best.?sell|editor|new.?arriv|trend/i.test(`${x?.slug} ${x?.name}`));
  if (t) return t.name;
  if ((p as any)?.in_flash_sale) return 'Flash Deal';
  return null;
}

function descOf(p: Product): string {
  const a = p?.plant_attribute;
  if (a) {
    const bits: string[] = [];
    if (a.sunlight) bits.push(String(a.sunlight).split(/[,/]/)[0].trim());
    if (a.air_purifying) bits.push('Air purifying');
    else if (a.water_requirement) bits.push(`${String(a.water_requirement).split(/[,/]/)[0].trim()} water`);
    else if (a.pet_friendly) bits.push('Pet friendly');
    const s = bits.slice(0, 2).join(' · ');
    if (s) return s;
  }
  return p?.categories?.[0]?.name || (p as any)?.unit || '';
}

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { addItemToCart } = useCart();
  const [authorized] = useAtom(authorizationAtom);
  const { openModal } = useModalAction();
  const { toggleWishlist } = useToggleWishlist(product?.id);
  const [wished, setWished] = React.useState(Boolean((product as any)?.in_wishlist));
  const [err, setErr] = React.useState(false);
  const [added, setAdded] = React.useState(false);

  const isVariable = `${(product as any)?.product_type}`.toLowerCase() === 'variable';
  const hasSale = Boolean(product?.sale_price && product.sale_price < product.price);
  const price = isVariable ? product?.min_price || product?.price : hasSale ? product.sale_price : product.price;
  const mrp = hasSale ? product.price : null;
  const badge = badgeOf(product);
  const desc = descOf(product);

  function onWish(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!authorized) return goToSignin();
    setWished((v) => !v);
    toggleWishlist({ product_id: product?.id } as any);
  }

  function onAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isVariable) return router.push(`/products/${product?.slug}`);
    addItemToCart(generateCartItem(product as any, {} as any), 1);
    setAdded(true);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('pah-cart-bump'));
    setTimeout(() => setAdded(false), 1000);
  }

  return (
    <Link
      href={`/products/${product?.slug}`}
      className="group block w-[165px] shrink-0 overflow-hidden rounded-[18px] border border-kraft-200 bg-white shadow-[0_2px_8px_rgba(34,48,26,0.07)] transition duration-200 hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(34,48,26,0.09)]"
    >
      <div className="relative h-[150px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={err ? PLACEHOLDER : imgOf(product)}
          alt={product?.name}
          loading="lazy"
          onError={() => setErr(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {badge ? (
          <span className="absolute left-2 top-2 rounded-full bg-forest-600 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-white shadow-[0_2px_8px_rgba(0,0,0,0.18)]">
            {badge}
          </span>
        ) : null}
        <button
          type="button"
          onClick={onWish}
          aria-label="Add to wishlist"
          className="absolute right-2 top-2 grid h-[30px] w-[30px] place-items-center rounded-full bg-white/95 shadow-[0_1px_2px_rgba(34,48,26,0.06)] transition active:scale-90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={wished ? '#C26B45' : 'none'} stroke={wished ? '#C26B45' : '#908A7E'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20s-7-4.4-9.2-9C1.3 8.1 2.6 5 5.8 5 8 5 9.4 6.6 12 9c2.6-2.4 4-4 6.2-4 3.2 0 4.5 3.1 3 6-2.2 4.6-9.2 9-9.2 9Z" />
          </svg>
        </button>
      </div>
      <div className="px-3 pb-3 pt-[11px]">
        <div className="line-clamp-1 font-hanken text-[14px] font-bold leading-[1.15] text-forest-900">{product?.name}</div>
        {desc ? <div className="mt-[3px] line-clamp-1 text-[11px] text-stone-500">{desc}</div> : <div className="mt-[3px] h-[11px]" />}
        <div className="mt-[9px] flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-hanken text-[16px] font-semibold tabular-nums text-forest-900">{rupee(price)}</span>
            {mrp ? <span className="text-[12px] text-stone-400 line-through">{rupee(mrp)}</span> : null}
          </div>
          <button
            type="button"
            onClick={onAdd}
            aria-label={isVariable ? 'Select options' : 'Add to cart'}
            className={cn('grid h-[30px] w-[30px] place-items-center rounded-full text-white transition active:scale-90', added ? 'bg-forest-800' : 'bg-ds-btn hover:bg-ds-btn-hover')}
          >
            {added ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
