'use client';
import React from 'react';
import VendorAvailabilityNote from '../vendor-availability-note';
import DeliveryCheck from './delivery-check';
import { LineIcon } from '@/components/icons/line-icons';

/**
 * "Delivery & availability" card — one bordered card grouping the ETA line
 * (local vs courier), the vendor-availability note (self-gating), the
 * vertical-blocked amber notice and the browse-only stone notice.
 *
 * Renders null when no city is known AND nothing is blocked/display-only —
 * the VendorAvailabilityNote inside self-gates, so the card shell only mounts
 * when at least the city/blocked/displayOnly context exists.
 */
export function DeliveryCard(props: {
  city?: string | null;
  etaDays?: number | null;
  fulfillmentMode?: string | null;
  product: any;
  /** Selected variation — keeps the vendor-availability note variation-specific. */
  variationOptionId?: number | null;
  verticalBlocked?: boolean;
  verticalMessage?: string | null;
  displayOnly?: boolean;
}) {
  const {
    city,
    etaDays,
    fulfillmentMode,
    product,
    variationOptionId = null,
    verticalBlocked = false,
    verticalMessage,
    displayOnly = false,
  } = props;

  // The pincode checker is useful with or without a chosen city — it is often
  // the FIRST thing a customer reaches for — so the card now mounts always.

  // Business rule (owner): local same-city delivery always promises 1 day —
  // vendor-fed eta_days only applies to courier shipments.
  const shownEta = fulfillmentMode === 'local' ? 1 : etaDays;
  const showEta = shownEta != null && Boolean(city);
  const dayWord = `day${shownEta === 1 ? '' : 's'}`;

  return (
    <div className="rounded-[14px] border border-[#ECECEC] bg-white p-4">
      <h3 className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#184A31]">
        Delivery &amp; availability
      </h3>

      {/* ETA — local same-city vs courier (never names the vendor) */}
      {showEta && (
        <div className="mt-3 flex items-start gap-2.5 text-[13px] text-[#184A31]">
          <LineIcon name="truck" className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#24693E]" />
          <span>
            {fulfillmentMode === 'local' ? (
              <>
                <span className="font-semibold">Local delivery</span> to {city} in 1 day
              </>
            ) : (
              <>
                Ships to {city} by <span className="font-semibold">courier</span> in ~{shownEta} {dayWord}
              </>
            )}
          </span>
        </div>
      )}

      {/* "we'll confirm within 6h" note — self-gates on the location-price API */}
      <VendorAvailabilityNote productId={product?.id} variationOptionId={variationOptionId} />

      {/* Pincode → every delivery option with its own ETA (local + live courier) */}
      <DeliveryCheck productId={product?.id} />

      {/* Operations Control Center — vertical paused/unavailable in city */}
      {verticalBlocked && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <LineIcon name="alert" className="mt-0.5 h-[18px] w-[18px] shrink-0" />
          <span>{verticalMessage || 'Currently unavailable in your city'}</span>
        </div>
      )}

      {/* Display-only city (no nursery supply): browse-only */}
      {displayOnly && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
          <LineIcon name="alert" className="mt-0.5 h-[18px] w-[18px] shrink-0" />
          <span>
            Browse-only in {city ?? 'your city'} — ordering opens soon
          </span>
        </div>
      )}
    </div>
  );
}

export default DeliveryCard;
