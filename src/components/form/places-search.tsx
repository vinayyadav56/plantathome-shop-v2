import { useEffect, useRef, useState } from 'react';
import { getLocation, legacyShapeFromNewPlace } from '@/lib/use-location';
import type { GoogleMapLocation } from '@/types';

/**
 * Address search on the CURRENT Places API.
 *
 * The shop searched addresses with `google.maps.places.Autocomplete`, which Google stopped
 * activating for new Cloud projects in March 2025. On a project without the legacy API enabled it
 * does not error usefully — the input loads, accepts typing and simply never shows a prediction.
 * From the shopper's side that is indistinguishable from "this shop cannot find my address", which
 * is exactly the complaint. `PlaceAutocompleteElement` is the supported replacement.
 *
 * The element is a web component, so it is created imperatively and dropped into a host div. It
 * renders its own input; the caller styles the host.
 *
 * Returns null when the new API is unavailable, so the caller can fall back to the legacy widget
 * rather than leaving the shopper with no search at all.
 */
export default function PlacesSearch({
  onPick,
  onUnavailable,
  onError,
  placeholder,
  defaultValue,
  disabled,
  biasTo,
  className,
}: {
  onPick: (loc: GoogleMapLocation, raw: any) => void;
  onUnavailable?: () => void;
  /** Distinguishes "no results" from "the request failed" — see the note in the handler. */
  onError?: (message: string) => void;
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
  /** Rank results near this point. The pin the shopper already has beats national ranking. */
  biasTo?: { lat: number; lng: number } | null;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const PlacesEl = (window as any).google?.maps?.places?.PlaceAutocompleteElement;
    if (!host) return;
    if (!PlacesEl) {
      onUnavailable?.();
      return;
    }

    let el: any;
    // India only, and biased to the shopper's pin when we have one. Without a bias Google ranks
    // predictions nationally, so "Sector 14" offered Gurugram, Faridabad, Noida and Chandigarh in
    // whatever order it liked rather than the one the shopper is standing in.
    const opts: any = { includedRegionCodes: ['in'] };
    if (biasTo && Number.isFinite(biasTo.lat) && Number.isFinite(biasTo.lng)) {
      opts.locationBias = { center: { lat: biasTo.lat, lng: biasTo.lng }, radius: 30000 };
    }
    try {
      el = new PlacesEl(opts);
    } catch {
      try {
        // Older constructor takes no options — set what we can afterwards rather than silently
        // dropping the restriction and going worldwide.
        el = new PlacesEl();
        try {
          el.includedRegionCodes = ['in'];
        } catch {
          /* not settable on this build; the element still works, just unrestricted */
        }
      } catch {
        onUnavailable?.();
        return;
      }
    }

    el.style.width = '100%';
    if (placeholder) el.setAttribute('placeholder', placeholder);
    if (defaultValue) {
      try {
        el.value = defaultValue;
      } catch {
        /* not settable on every build */
      }
    }

    const handler = async (ev: any) => {
      try {
        const place = ev?.placePrediction?.toPlace?.() ?? ev?.place;
        if (!place) return;
        await place.fetchFields({
          fields: ['location', 'formattedAddress', 'addressComponents', 'displayName', 'id'],
        });
        const legacy = legacyShapeFromNewPlace(place);
        if (!Number.isFinite(legacy.geometry.location.lat())) return;
        onPickRef.current(getLocation(legacy) as GoogleMapLocation, legacy);
      } catch (e: any) {
        // A failed lookup used to be swallowed, so the shopper clicked a suggestion and nothing
        // happened — identical to having chosen nothing. Say which it was.
        onErrorRef.current?.(
          'We could not load that address. Check your connection and try again.',
        );
        // eslint-disable-next-line no-console
        console.error('[places] fetchFields failed:', e);
      }
    };

    // GA event is `gmp-select`; older builds emitted `gmp-placeselect`.
    el.addEventListener('gmp-select', handler);
    el.addEventListener('gmp-placeselect', handler);
    host.appendChild(el);
    setReady(true);

    return () => {
      el.removeEventListener('gmp-select', handler);
      el.removeEventListener('gmp-placeselect', handler);
      try {
        host.removeChild(el);
      } catch {
        /* already detached */
      }
    };
    // biasTo is read once per mount on purpose — recreating the element mid-typing would clear
    // whatever the shopper had entered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeholder, disabled]);

  return <div ref={hostRef} className={className} data-ready={ready || undefined} />;
}
