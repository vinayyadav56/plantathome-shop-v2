'use client';
import { useState } from 'react';
import { useCustomerCity } from '@/lib/use-customer-city';
import CityPickerDialog from './city-picker-dialog';
import ChangeCityDialog from './change-city-dialog';
import { ChevronDown, MapPin } from '@/components/ui/icon';

/**
 * The pick → confirm → cart-migration flow, as a hook.
 *
 * Extracted so that anything needing "let the shopper change city" routes
 * through the one place that owns ChangeCityDialog. That matters because a
 * change with a non-empty cart must re-validate the cart against the new city
 * and report what got dropped — a caller that opened the picker directly would
 * silently skip it.
 *
 * It also replaces the `pah:open-location` CustomEvent, which had two
 * dispatchers and zero listeners: both "Change delivery city" buttons were dead
 * clicks. A hook cannot lose its listener.
 */
export function useCityPicker() {
  const { city, setCity } = useCustomerCity();
  const [open, setOpen] = useState(false);
  const [pendingCity, setPendingCity] = useState<string | null>(null);

  function onPick(name: string, area?: string | null) {
    if (!city) {
      setCity(name, area); // nothing to migrate — first selection
      return;
    }
    if (name.toLowerCase() === city.toLowerCase()) return; // same city — no-op
    setPendingCity(name); // confirm + cart migration
  }

  return {
    open: () => setOpen(true),
    dialogs: (
      <>
        <CityPickerDialog open={open} onClose={() => setOpen(false)} onPick={onPick} />
        <ChangeCityDialog
          open={pendingCity !== null}
          targetCity={pendingCity}
          onClose={() => setPendingCity(null)}
          onSwitched={() => setPendingCity(null)}
        />
      </>
    ),
  };
}

/**
 * The shopping-city chip. Prices, availability and delivery are all city-scoped,
 * so this has to be reachable from any page at any scroll position — it lives in
 * the sticky header for that reason.
 *
 * It used to render as plain low-contrast text ("Bengaluru · Change", the suffix
 * at 60% opacity) with no border, hover or focus style, and it read as disabled:
 * the owner reported it as "disabled" when it had always been perfectly
 * clickable. It is an outlined chip now — border, pin, chevron, hover and a
 * focus ring — so it looks like the control it is. The word "Change" moved into
 * aria-label, where it informs without competing for the ~92px the chip gets on
 * a phone.
 */
export default function CitySwitcher({ className = '' }: { className?: string }) {
  const { city, label } = useCustomerCity();
  const { open, dialogs } = useCityPicker();

  return (
    <>
      <button
        type="button"
        data-city-chip
        onClick={open}
        title={label ?? undefined}
        aria-label={label ? `Delivery city: ${label}. Change city` : 'Select your delivery city'}
        className={`group inline-flex min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-1 ${
          city
            ? 'border-forest-900/25 bg-white/60 text-forest-900 hover:border-forest-700 hover:bg-white'
            : // No city yet — and useCustomerCity returns null on the server and
              // the first client paint, so this is also the one-frame SSR state.
              // Solid and high-contrast, so it reads as "tap to choose" rather
              // than as a greyed-out control.
              'border-forest-700 bg-sage-100 text-forest-800 hover:bg-white'
        } ${className}`}
      >
        <MapPin size={14} className="shrink-0 text-forest-700" aria-hidden />
        {/* `label` is "<area>, <city>"; the area is what does not fit. Below xl
            show the city alone, from xl the full label. CSS-gated so there is no
            JS measurement and no hydration mismatch. */}
        <span className="truncate xl:hidden">{city ?? 'Select city'}</span>
        <span className="hidden truncate xl:inline">{label ?? 'Select city'}</span>
        <ChevronDown
          size={14}
          className="shrink-0 opacity-70 transition-transform group-hover:translate-y-px"
          aria-hidden
        />
      </button>

      {dialogs}
    </>
  );
}
