'use client';
import React from 'react';
import Link from 'next/link';
import { productPlaceholder } from '@/lib/placeholders';
import { LineIcon } from '@/components/icons/line-icons';

/** ₹ with en-IN grouping, no decimals (matches the card design). */
const fmtINR = (n: number) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

/** Variable items (size-priced) carry no price/sale_price → fall back to min_price. */
const unitPrice = (p: any) =>
  Number(p?.sale_price) || Number(p?.price) || Number(p?.min_price) || 0;

/** Per-item quantity inside the bundle (Laravel pivot) — NEVER p.quantity (stock). */
const itemQty = (p: any) =>
  Number(p?.pivot?.quantity ?? p?.bundle_quantity ?? 1) || 1;

/**
 * "What's inside this bundle" — real bundle_items with qty × unit and per-item
 * value, plus a total-value vs bundle-price footer. Self-gates: renders null
 * unless the product is a bundle with items.
 */
export function BundleContents({
  product,
  compact = false,
}: {
  product: any;
  compact?: boolean;
}) {
  const isBundle =
    Boolean(product?.is_bundle) || product?.product_type === 'bundle';
  const items: any[] = product?.bundle_items ?? [];
  if (!isBundle || items.length === 0) return null;

  const totalValue = Number(product?.bundle_total_value ?? 0);
  const bundlePrice =
    Number(product?.sale_price ?? 0) || Number(product?.price ?? 0);
  const save = totalValue > bundlePrice ? totalValue - bundlePrice : 0;

  const rows = compact ? items.slice(0, 2) : items;
  const more = items.length - rows.length;

  return (
    <div className="rounded-[22px] border border-[#ECECEC] bg-white p-5 shadow-[0_4px_10px_rgba(0,0,0,0.04),0_20px_40px_rgba(0,0,0,0.08)]">
      <h3 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[#184A31]">
        <LineIcon name="box" className="h-4 w-4 text-[#24693E]" />
        What&apos;s inside this bundle ({items.length} item{items.length === 1 ? '' : 's'})
      </h3>

      <div className="mt-4 space-y-2.5">
        {rows.map((p) => {
          const qty = itemQty(p);
          const unit = unitPrice(p);
          return (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              className="flex items-center gap-3 rounded-[14px] border border-[#ECECEC] bg-white p-2.5 transition hover:border-[#14532D]/30"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p?.image?.thumbnail || p?.image?.original || productPlaceholder}
                alt={p?.name}
                loading="lazy"
                className="h-11 w-11 shrink-0 rounded-[10px] border border-[#ECECEC] object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold leading-tight text-[#184A31]">
                  {p.name}
                </p>
                <p className="mt-0.5 text-[12px] text-[#8A8A8A]">
                  {qty} × {fmtINR(unit)}
                </p>
              </div>
              <span className="shrink-0 text-[13.5px] font-semibold text-[#5B5B5B]">
                {fmtINR(qty * unit)}
              </span>
            </Link>
          );
        })}
      </div>

      {compact ? (
        more > 0 ? (
          <p className="mt-3 text-[13px] font-semibold text-[#24693E]">
            +{more} more item{more === 1 ? '' : 's'}
          </p>
        ) : null
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[#ECECEC] pt-4">
          {totalValue > 0 && (
            <span className="text-[13.5px] text-[#8A8A8A]">
              Total value <del>{fmtINR(totalValue)}</del>
            </span>
          )}
          <span className="text-[13.5px] text-[#5B5B5B]">
            Bundle price{' '}
            <span className="text-[15px] font-bold text-[#14532D]">
              {fmtINR(bundlePrice)}
            </span>
          </span>
          {save > 0 && (
            <span className="rounded-full bg-[#F3F8EC] px-3 py-1.5 text-[12px] font-bold leading-none text-[#24693E]">
              You save {fmtINR(save)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default BundleContents;
