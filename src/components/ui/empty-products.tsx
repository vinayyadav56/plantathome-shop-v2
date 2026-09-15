'use client';
import React from 'react';
import Link from 'next/link';
import { getStoredCity } from '@/lib/customer-location';
import { ArrowRight } from '@/components/ui/icon';
import PottedPlantIllustration from '@/components/ui/illustration/potted-plant';

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
        <PottedPlantIllustration />
      </div>

      <h3 className="font-heading mt-6 text-[1.6rem] font-medium not-italic leading-tight text-forest-900 sm:text-[2rem]">
        {heading}
      </h3>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-stone-500 sm:text-[15px]">{sub}</p>

      {/* Three CTAs side-by-side exceed a 768px viewport once "Change delivery city" shows —
          wrap instead of spilling (this row was the only horizontal overflow on the site). */}
      <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <Link href="/plants/search" className="pa-btn pa-btn-primary">
          Browse all plants
          <ArrowRight size={16} aria-hidden />
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
