'use client';

import { useEffect, useState } from 'react';
import Breadcrumb from '@/components/ui/breadcrumb';
import Search from '@/components/ui/search/search';
import { useCityPicker } from '@/components/location/city-switcher';
import { useCustomerCity } from '@/lib/use-customer-city';
import { getStoredPincode } from '@/lib/customer-location';
import { usePincodeServiceability } from '@/lib/use-pincode-serviceability';
import { Routes } from '@/config/routes';
import { MapPin, Truck } from '@/components/ui/icon';

/**
 * The compact category header: breadcrumb → H1 → one line of copy → the search
 * field → the delivery line → the count. No hero image: this is a shop page,
 * and the first product row is the thing worth the viewport.
 *
 * The city line is the SAME state the header chip shows (useCustomerCity) and
 * opens the SAME picker (useCityPicker, whose ChangeCityDialog re-validates the
 * cart on a switch). It is deliberately not `data-city-chip` — the e2e invariant
 * is exactly one of those, the sticky header's.
 */
export default function PlpHeader({
  title,
  subtitle,
  searchTerm,
  total,
}: {
  title: string;
  subtitle: string;
  /** Set on /plants/search — replaces the subtitle with the results line. */
  searchTerm?: string;
  /** City-scoped result total from the products query; null while unknown. */
  total: number | null;
}) {
  const { city, label } = useCustomerCity();
  const { open, dialogs } = useCityPicker();

  // localStorage is read AFTER mount: the server and the first client render
  // must agree (no pincode), or React throws the tree away (#418).
  const [pincode, setPincode] = useState<string | null>(null);
  useEffect(() => {
    setPincode(getStoredPincode());
    const sync = () => setPincode(getStoredPincode());
    window.addEventListener('pah-location-changed', sync);
    return () => window.removeEventListener('pah-location-changed', sync);
  }, []);
  const { result: serviceability } = usePincodeServiceability(pincode);

  const eta = serviceability?.serviceable ? serviceability.eta_days : null;

  return (
    <header className="pt-4 sm:pt-6">
      <Breadcrumb items={[{ label: 'Home', href: Routes.home }, { label: title }]} />

      <div className="mt-5 max-w-3xl sm:mt-7">
        <h1 className="font-heading text-[34px] font-medium leading-[1.05] tracking-[-0.02em] text-forest-900 sm:text-[48px] lg:text-[60px]">
          {title}
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-stone-600 sm:text-[17px] lg:text-[19px]">
          {searchTerm ? (
            <>
              Results for <span className="font-semibold text-forest-900">“{searchTerm}”</span>
            </>
          ) : (
            subtitle
          )}
        </p>
      </div>

      {/* Existing search: same context, same routing (/plants/search?text=) as
          the header's. `label` is also the input id — distinct from the header's.
          `minimal` = magnifier + field + mic, no 143px button crowding a phone;
          the wrapper owns the height, so 56px is set on it, not the input. */}
      <div className="mt-6 max-w-2xl sm:mt-8">
        <Search
          label="plp-search"
          variant="minimal"
          placeholder="Search plants by name…"
          className="[&>div]:!h-14 [&>div]:shadow-box"
          inputClassName="!border-kraft-200 !bg-white !text-base placeholder:!text-stone-400"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-stone-600 sm:mt-5">
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={16} className="shrink-0 text-forest-700" aria-hidden />
          {city ? (
            <>
              Delivering to <span className="font-semibold text-forest-900">{label}</span>
              {pincode ? <span className="text-stone-500"> {pincode}</span> : null}
            </>
          ) : (
            <span className="font-semibold text-forest-900">Select your delivery city</span>
          )}
          <button
            type="button"
            onClick={open}
            className="ms-1 rounded-full px-2 py-0.5 text-[13px] font-semibold text-forest-700 underline decoration-forest-700/30 underline-offset-4 transition hover:bg-sage-100 hover:decoration-forest-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
            aria-label={city ? 'Change delivery city' : 'Select delivery city'}
          >
            {city ? 'Change' : 'Choose'}
          </button>
        </span>

        {typeof eta === 'number' && eta > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <Truck size={16} className="shrink-0 text-forest-700" aria-hidden />
            Delivery in {eta === 1 ? '1 day' : `${eta} days`}
            {serviceability?.cod_enabled ? <span className="text-stone-500"> · COD available</span> : null}
          </span>
        )}

        {typeof total === 'number' && (
          <span className="text-stone-500">
            <span className="font-semibold tabular-nums text-forest-900">{total.toLocaleString('en-IN')}</span>{' '}
            {total === 1 ? 'plant' : 'plants'}
            {city ? ` available${searchTerm ? '' : ` in ${city}`}` : ' available'}
          </span>
        )}
      </div>

      {dialogs}
    </header>
  );
}
