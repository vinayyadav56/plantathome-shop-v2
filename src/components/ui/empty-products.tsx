'use client';
import React from 'react';
import Link from 'next/link';
import { getStoredCity } from '@/lib/customer-location';

/**
 * Branded, city-aware "no products" empty state — replaces the generic Pickbazar
 * "no result" illustration. The empty grid is almost always a city-inventory gap,
 * so we say so and offer a way forward (browse everything / change city).
 */
export function EmptyProducts({
  categoryName,
  title,
  subtitle,
  className = '',
}: {
  categoryName?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  const [city, setCity] = React.useState<string | null>(null);
  React.useEffect(() => {
    setCity(getStoredCity());
  }, []);

  const what = categoryName ? categoryName.toLowerCase() : 'plants';
  const heading =
    title ??
    (city ? `No ${what} in ${city} yet` : `No ${what} here yet`);
  const sub =
    subtitle ??
    (city
      ? `We're still growing our collection in ${city}. Explore everything available, or switch to another delivery city.`
      : `We couldn't find anything to show here. Explore our full collection of plants and essentials.`);

  const changeCity = () => {
    if (typeof window !== 'undefined') {
      // The header / location gate listens for this to open the city selector.
      window.dispatchEvent(new CustomEvent('pah:open-location'));
    }
  };

  return (
    <div className={`flex w-full flex-col items-center px-5 py-14 text-center sm:py-20 ${className}`}>
      {/* branded plant illustration */}
      <div className="relative grid h-36 w-36 place-items-center rounded-full bg-[radial-gradient(circle_at_50%_35%,#EAF4E6,#F6FAF7)] sm:h-44 sm:w-44">
        <svg viewBox="0 0 120 120" fill="none" className="h-24 w-24 sm:h-28 sm:w-28" aria-hidden>
          {/* pot */}
          <path d="M36 74h48l-5 28a6 6 0 0 1-6 5H47a6 6 0 0 1-6-5L36 74Z" fill="#E9E3D6" stroke="#C9B79A" strokeWidth="2" />
          <rect x="33" y="68" width="54" height="10" rx="3" fill="#D7C9AE" stroke="#C9B79A" strokeWidth="2" />
          {/* leaves */}
          <path d="M60 70c0-16-8-26-22-30 0 15 7 25 22 30Z" fill="#6E8B4A" />
          <path d="M60 70c0-20 9-32 26-36 0 18-9 30-26 36Z" fill="#4E8B31" />
          <path d="M60 70c0-12-2-24 0-36 4 10 5 24 0 36Z" fill="#35C46A" />
          <path d="M60 36v34" stroke="#2E5E2A" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <h3 className="font-heading mt-6 text-[1.6rem] font-bold not-italic leading-tight text-forest-900 sm:text-[2rem]">
        {heading}
      </h3>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-stone-500 sm:text-[15px]">{sub}</p>

      <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
        <Link href="/plants/search" className="pa-btn pa-btn-primary">
          Browse all plants
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
        </Link>
        <Link href="/plants/search" className="pa-btn pa-btn-secondary">Explore categories</Link>
        {city && (
          <button type="button" onClick={changeCity} className="pa-btn pa-btn-outline">
            Change delivery city
          </button>
        )}
      </div>
    </div>
  );
}

export default EmptyProducts;
