'use client';
import React from 'react';
import VendorAvailabilityNote from '../vendor-availability-note';
import DeliveryCheck from './delivery-check';
import { LineIcon } from '@/components/icons/line-icons';
import { isCityBased } from '@/lib/is-city-based';

/**
 * Delivery on the product page — a compact labelled pincode field, not a card (owner annotation
 * 2026-10-11: "make it compact like a form input box with label and fit it beside the select
 * size"). The ETA line (local vs courier) is the field's helper text; the vendor-availability
 * note (self-gating), the vertical-blocked and the browse-only notices follow underneath.
 * ~90px tall instead of the old ~190px card, so it sits level with the size picker from xl.
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
  // the FIRST thing a customer reaches for — so it always mounts.

  // Business rule (owner): local same-city delivery always promises 1 day —
  // vendor-fed eta_days only applies to courier shipments.
  const shownEta = fulfillmentMode === 'local' ? 1 : etaDays;
  // Nationwide products (Tools) ship from one seller by courier, whatever the city.
  const cityBased = isCityBased(product);
  const showEta = cityBased && shownEta != null && Boolean(city);
  const dayWord = `day${shownEta === 1 ? '' : 's'}`;

  // ETA — local same-city vs courier (never names the vendor).
  const hint =
    showEta || !cityBased ? (
      <p className="mt-1.5 flex items-start gap-1.5 text-[12.943px] font-semibold leading-snug text-[#333333]">
        <LineIcon name="truck" className="mt-px h-4 w-4 shrink-0 text-[#24693E]" />
        <span>
          {!cityBased ? (
            <>
              Ships across India by <span className="font-semibold">courier</span>
            </>
          ) : fulfillmentMode === 'local' ? (
            <>
              <span className="font-semibold">Local delivery</span> to {city} in 1 day
            </>
          ) : (
            <>
              Ships to {city} by <span className="font-semibold">courier</span> in ~{shownEta} {dayWord}
            </>
          )}
        </span>
      </p>
    ) : null;

  return (
    <div>
      {/* Pincode → every delivery option with its own ETA (local + live courier) */}
      <DeliveryCheck productId={product?.id} hint={hint} />

      {/* "we'll confirm within 6h" note (plants' city vendors) — self-gates on the location-price API */}
      {cityBased && (
        <VendorAvailabilityNote productId={product?.id} variationOptionId={variationOptionId} />
      )}

      {/* Operations Control Center — vertical paused/unavailable in city */}
      {verticalBlocked && (
        <div className="mt-2 flex items-start gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
          <LineIcon name="alert" className="mt-px h-4 w-4 shrink-0" />
          <span>{verticalMessage || 'Currently unavailable in your city'}</span>
        </div>
      )}

      {/* Display-only city (no nursery supply): browse-only */}
      {displayOnly && (
        <div className="mt-2 flex items-start gap-2 rounded border border-stone-200 bg-stone-50 px-3 py-2 text-[12px] text-stone-600">
          <LineIcon name="alert" className="mt-px h-4 w-4 shrink-0" />
          <span>Browse-only in {city ?? 'your city'} — ordering opens soon</span>
        </div>
      )}
    </div>
  );
}

export default DeliveryCard;
