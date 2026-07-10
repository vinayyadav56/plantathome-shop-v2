'use client';

import { useQuery } from '@tanstack/react-query';
import { listCities } from '@/lib/api/endpoints';
import { qk } from '@/lib/query-keys';
import { useSession } from '@/lib/store/session';

export function CitySelector() {
  const { data: cities } = useQuery({ queryKey: qk.cities, queryFn: listCities });
  const city = useSession((s) => s.city);
  const setCity = useSession((s) => s.setCity);

  return (
    <label className="flex items-center gap-1.5 text-sm">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden className="text-forest-accent">
        <path
          d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      <select
        aria-label="Select your city"
        className="border-0 bg-transparent py-1 pr-7 text-sm font-medium text-forest focus:ring-0"
        value={city ?? ''}
        onChange={(e) => {
          const opt = cities?.find((c) => c.uuid === e.target.value);
          setCity(e.target.value || null, opt?.name ?? null);
        }}
      >
        <option value="">Choose city</option>
        {cities?.map((c) => (
          <option key={c.uuid} value={c.uuid}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
