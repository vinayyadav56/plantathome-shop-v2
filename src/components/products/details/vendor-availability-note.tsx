'use client';
import { useQuery } from 'react-query';
import { HttpClient } from '@/framework/client/http-client';
import { getStoredLatLng } from '@/lib/customer-location';

/**
 * Shows the "we'll confirm availability within 6 hours" note when the nearest
 * vendor has no current stock/cost for this plant (cost = 0). The product is
 * still orderable. Reads the public /location-price endpoint (margin-over-cost
 * pricing) — passes the customer's stored coords when available (coarse in P2,
 * location-precise in P3). Fails silent: no note unless the API says unavailable.
 */
export default function VendorAvailabilityNote({
  productId,
  variationOptionId,
}: {
  productId?: number | string;
  variationOptionId?: number | null;
}) {
  const loc = getStoredLatLng();
  const { data } = useQuery(
    ['location-price', productId, variationOptionId, loc?.lat, loc?.lng],
    () =>
      HttpClient.get<any>('location-price', {
        product_id: productId,
        ...(variationOptionId ? { variation_option_id: variationOptionId } : {}),
        ...(loc ? { lat: loc.lat, lng: loc.lng } : {}),
      }),
    { enabled: !!productId, staleTime: 60_000, retry: 0 },
  );

  if (!data || data.available !== false) return null;

  return (
    <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
      </svg>
      <span>
        {data.message || 'We will update the availability of this plant within 6 hours.'}{' '}
        You can still place your order — we’ll confirm shortly.
      </span>
    </div>
  );
}
