'use client';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useAllCities } from '@/framework/location';
import { getBrowserCoords, reverseGeocode } from '@/lib/geocode';
import { track } from '@/lib/analytics/track';
import { getRecentCities, pushRecentCity } from '@/lib/recent-cities';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (cityName: string) => void;
}

/**
 * Searchable serviceable-city picker. Used by the header city switcher and the
 * "Select City" action of the non-serviceable popup. Includes a one-tap
 * "Detect my location" (GPS → reverse-geocode) that fills the city. Fail-safe.
 */
export default function CityPickerDialog({ open, onClose, onPick }: Props) {
  const { data: cities } = useAllCities();
  const [q, setQ] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  // Read recents from localStorage each time the dialog opens (SSR-safe).
  useEffect(() => {
    if (open) setRecent(getRecentCities());
  }, [open]);

  const list = useMemo(() => {
    const all = cities ?? [];
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? all.filter((c) => c.name?.toLowerCase().includes(needle))
      : all;
    return filtered.slice(0, 60);
  }, [cities, q]);

  // Recent chips: only cities that are still serviceable (present in the list).
  const recentChips = useMemo(() => {
    const names = new Set((cities ?? []).map((c) => c.name?.toLowerCase()));
    return recent.filter((r) => names.has(r.toLowerCase())).slice(0, 5);
  }, [recent, cities]);

  // Popular chips: the highest-priority serviceable cities (API returns them in
  // display_order). Skipped while the user is actively searching.
  const popularChips = useMemo(
    () => (cities ?? []).slice(0, 8).map((c) => c.name).filter(Boolean),
    [cities],
  );

  // Single place every selection flows through, so recents stay accurate.
  function choose(name: string) {
    pushRecentCity(name);
    onPick(name);
    onClose();
  }

  async function detect() {
    setDetecting(true);
    try {
      const coords = await getBrowserCoords();
      if (coords) {
        const addr = await reverseGeocode(coords.lat, coords.lng);
        if (addr?.city) {
          track('location_detected', { label: addr.city, meta: { source: 'gps' } });
          choose(addr.city);
          return;
        }
      }
      track('location_denied', { meta: { source: 'gps' } });
    } finally {
      setDetecting(false);
    }
  }

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-[70]">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-start justify-center p-4 pt-16 sm:pt-24">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-2"
          >
            <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
              <Dialog.Title className="text-lg font-semibold text-forest-900">
                Choose your delivery city
              </Dialog.Title>
              <p className="mt-1 text-sm text-stone-500">
                We’ll show delivery times and serviceability for this city.
              </p>

              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search city…"
                className="mt-4 w-full rounded-lg border border-border-base px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              />

              <button
                type="button"
                onClick={detect}
                disabled={detecting}
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-accent disabled:opacity-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                {detecting ? 'Detecting…' : 'Detect my location'}
              </button>

              {!q.trim() && recentChips.length ? (
                <div className="mt-4">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
                    Recent
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentChips.map((name) => (
                      <button
                        key={`recent-${name}`}
                        type="button"
                        onClick={() => choose(name)}
                        className="rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-sm font-medium text-accent hover:bg-accent/10"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {!q.trim() && popularChips.length ? (
                <div className="mt-3">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
                    Popular cities
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {popularChips.map((name) => (
                      <button
                        key={`popular-${name}`}
                        type="button"
                        onClick={() => choose(name)}
                        className="rounded-full border border-gray-200 px-3 py-1 text-sm font-medium text-heading hover:border-accent hover:text-accent"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <ul className="mt-3 max-h-72 divide-y divide-gray-100 overflow-auto rounded-lg border border-gray-100">
                {list.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => choose(c.name)}
                      className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm hover:bg-gray-50"
                    >
                      <span className="font-medium text-heading">{c.name}</span>
                      {c.state_name ? (
                        <span className="text-xs text-stone-400">{c.state_name}</span>
                      ) : null}
                    </button>
                  </li>
                ))}
                {!list.length ? (
                  <li className="px-3.5 py-4 text-center text-sm text-stone-500">
                    No matching cities.
                  </li>
                ) : null}
              </ul>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
