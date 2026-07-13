import { useState } from 'react';
import { useAtom } from 'jotai';
import { useTranslation } from 'next-i18next';
import {
  shippingAddressAtom,
  deliveryVerificationAtom,
} from '@/store/checkout';
import { haversineKm, toLatLng, formatDistance } from '@/lib/geo-distance';

// How close (km) the customer must be to the delivery address to count as
// "at the delivery location".
const PROXIMITY_THRESHOLD_KM = 0.5;

function DeliveryLocationVerification({
  count,
  label,
}: {
  count: number;
  label: string;
}) {
  const { t } = useTranslation('common');
  const [shippingAddress] = useAtom(shippingAddressAtom);
  const [verification, setVerification] = useAtom(deliveryVerificationAtom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deliveryCoords = toLatLng(shippingAddress?.location as any);

  const handleShareLocation = () => {
    setError(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        let distance_km: number | null = null;
        let at_delivery_location: boolean | null = null;
        if (deliveryCoords) {
          distance_km = haversineKm({ lat, lng }, deliveryCoords);
          at_delivery_location = distance_km <= PROXIMITY_THRESHOLD_KM;
        }

        setVerification({
          lat,
          lng,
          distance_km,
          at_delivery_location,
          checked_at: new Date().toISOString(),
        });
        setLoading(false);
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. You can still place your order.'
            : 'Could not get your location. Please try again.',
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const hasResult = Boolean(verification);
  const matched = verification?.at_delivery_location;

  return (
    <div className="pa-checkout-step">
      <div className="pa-checkout-step-header">
        <span className="pa-checkout-step-num">{count}</span>
        <span className="pa-checkout-step-label">{label}</span>
      </div>

      <div className="block">
        <p className="mb-3 text-sm text-body">
          Optionally share your current location so we can confirm you&apos;re
          ordering from your delivery address.
        </p>

        <button
          type="button"
          onClick={handleShareLocation}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-accent px-4 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent hover:text-white disabled:opacity-60"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {loading
            ? 'Getting your location…'
            : hasResult
              ? 'Re-check my location'
              : 'Share my current location'}
        </button>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        {hasResult && (
          <div className="mt-4">
            {matched === true && (
              <div className="flex items-start gap-2 rounded-lg bg-accent/10 p-3 text-sm text-accent">
                <span aria-hidden>✓</span>
                <span>
                  You&apos;re at your delivery address
                  {verification?.distance_km != null && (
                    <> (within {formatDistance(verification.distance_km)}).</>
                  )}
                </span>
              </div>
            )}

            {matched === false && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                <span aria-hidden>⚠️</span>
                <span>
                  You appear to be{' '}
                  <strong>{formatDistance(verification!.distance_km!)}</strong>{' '}
                  from your delivery address. You can still place the order — we
                  just wanted to flag it.
                </span>
              </div>
            )}

            {matched === null && (
              <div className="flex items-start gap-2 rounded-lg bg-gray-100 p-3 text-sm text-body">
                <span aria-hidden>📍</span>
                <span>
                  Location captured. Add a map location to your delivery address
                  (via the address form) to enable the distance check.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DeliveryLocationVerification;
