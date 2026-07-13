'use client';
import { useState } from 'react';
import { useCustomerCity } from '@/lib/use-customer-city';
import CityPickerDialog from './city-picker-dialog';

/**
 * Header "Deliver to: <city> ▼" chip. Opens the searchable city picker; the
 * chosen city is persisted (fires pah-location-changed so the nav/products
 * re-evaluate). `tone` adapts the colour to the (transparent vs solid) header.
 */
export default function CitySwitcher({
  className = '',
  tone = 'dark',
}: {
  className?: string;
  tone?: 'dark' | 'light';
}) {
  const { city, setCity } = useCustomerCity();
  const [open, setOpen] = useState(false);
  const color = tone === 'light' ? 'text-white/90' : 'text-forest-900';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${color} ${className}`}
        aria-label="Change delivery city"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
        <span>
          Deliver to:{' '}
          <span className="font-semibold">{city ?? 'Select city'}</span>
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="6 9 12 15 18 9" /></svg>
      </button>

      <CityPickerDialog
        open={open}
        onClose={() => setOpen(false)}
        onPick={(name) => setCity(name)}
      />
    </>
  );
}
