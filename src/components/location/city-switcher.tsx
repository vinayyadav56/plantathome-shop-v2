'use client';
import { useState } from 'react';
import { useCustomerCity } from '@/lib/use-customer-city';
import CityPickerDialog from './city-picker-dialog';
import ChangeCityDialog from './change-city-dialog';
import { MapPin } from '@/components/ui/icon';

/**
 * Header "📍 <city> · Change" chip (Shopping-City redesign). Opens the
 * searchable city picker; a pick with an existing city routes through the
 * ChangeCityDialog (confirm → cart re-validation → dropped-items report)
 * so the cart can never silently carry another city's items. `tone` adapts
 * the colour to the (transparent vs solid) header.
 */
export default function CitySwitcher({
  className = '',
  tone = 'dark',
}: {
  className?: string;
  tone?: 'dark' | 'light';
}) {
  const { city, label, setCity } = useCustomerCity();
  const [open, setOpen] = useState(false);
  const [pendingCity, setPendingCity] = useState<string | null>(null);
  const color = tone === 'light' ? 'text-white/90' : 'text-forest-900';

  function onPick(name: string, area?: string | null) {
    if (!city) {
      setCity(name, area); // nothing to migrate — first selection
      return;
    }
    if (name.toLowerCase() === city.toLowerCase()) return; // same city — no-op
    setPendingCity(name); // confirm + cart migration
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex min-w-0 max-w-full items-center gap-1.5 whitespace-nowrap ${tone === 'light' ? 'text-[13px] font-normal' : 'text-sm font-medium'} ${color} ${className}`}
        aria-label="Change shopping city"
      >
        <MapPin size={14} aria-hidden />
        {/* A long city name ellipsises here rather than pushing the top bar's cell. */}
        <span className={`min-w-0 max-w-[14rem] truncate ${tone === 'light' ? 'font-medium' : 'font-semibold'}`}>{label ?? 'Select city'}</span>
        <span className={`shrink-0 ${tone === 'light' ? 'text-white/60' : 'text-stone-400'}`}>
          · Change
        </span>
      </button>

      <CityPickerDialog
        open={open}
        onClose={() => setOpen(false)}
        onPick={onPick}
      />
      <ChangeCityDialog
        open={pendingCity !== null}
        targetCity={pendingCity}
        onClose={() => setPendingCity(null)}
        onSwitched={() => setPendingCity(null)}
      />
    </>
  );
}
