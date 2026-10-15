'use client';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useAllCities, type LookupCity } from '@/framework/location';
import { getBrowserCoords } from '@/lib/geocode';
import { CITY_ALIASES, pickerCityKey, reverseGeocodePin } from '@/lib/shopping-city';
import { track } from '@/lib/analytics/track';
import { getRecentCities, pushRecentCity } from '@/lib/recent-cities';
import { useComingSoon } from '@/lib/use-coming-soon';
import { ChevronDown, MapPin, X } from '@/components/ui/icon';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (cityName: string, area?: string | null) => void;
  /**
   * Mandatory mode (first visit): the dialog cannot be dismissed — no overlay
   * close, no Esc — until a city is picked. The IP guess only suggests; the
   * shopper confirms by tapping it or a city (or by tapping "Detect my location").
   */
  blocking?: boolean;
  title?: string;
  subtitle?: string;
  /** Pre-highlighted suggestion (e.g. IP-detected city) shown as a one-tap banner. */
  suggestedCity?: string | null;
}

const DETECT_MSG = {
  unsupported: 'This browser can’t share your location. Search for your city instead.',
  denied: 'Location is blocked for this site. Allow it in your browser or phone settings, or search for your city.',
  unavailable: 'We couldn’t find your location. Check that location is turned on, or search for your city.',
  timeout: 'Finding your location took too long. Try again, or search for your city.',
  lookup: 'We couldn’t look up your city just now. Try again, or search for your city.',
  nocity: 'We couldn’t match your location to a city. Search for your city instead.',
} as const;

/** Rows in the dropdown at once; typing narrows the rest. */
const LIMIT = 60;

/**
 * Our row for a place the geocoder or the IP lookup named: the API's city_id, else the same
 * name, else the same city by pickerCityKey (Gurgaon → Gurugram, South Delhi → Delhi, Mysuru →
 * "Mysuru (Mysore)"), else a row that has the name as whole words among its twins and old names
 * (Belgaum → Belagavi). The list is nursery-first, so a name several rows share lands on the
 * nursery city.
 */
function findCity(cities: LookupCity[] | undefined, name?: string | null, id?: number | null) {
  const all = cities ?? [];
  const lower = name?.trim().toLowerCase();
  const key = pickerCityKey(name);
  const asWords = `${words(name ?? '')} `;
  return (
    all.find((c) => id != null && c.id === id) ??
    all.find((c) => c.name.toLowerCase() === lower) ??
    (key ? all.find((c) => pickerCityKey(c.name) === key) : undefined) ??
    (asWords.trim() ? all.find((c) => `${haystack(c)} `.includes(asWords)) : undefined)
  );
}

/**
 * The geocoder's area, when it names a neighbourhood. The server falls back to a road or a
 * premise, so "Sector 57" and "Kasba Peth" stay but "488", "B-12" and "Unnamed Road" don't.
 */
function neighbourhood(area?: string | null) {
  return area && /\p{L}{3}/u.test(area) && !/^unnamed\b/i.test(area) ? area : null;
}

/** " word word": lower-case words with a leading space, so ` ${needle}` matches a word start. */
const words = (s: string) => ` ${s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()}`;

/** A row's search text: its name, its unlisted twins' names (aka) and any old name, so
 *  "bangalore" finds Bengaluru and "belgaum" finds Belagavi. */
function haystack(c: LookupCity) {
  const key = pickerCityKey(c.name);
  const old = Object.keys(CITY_ALIASES).filter((k) => CITY_ALIASES[k] === key);
  return words([c.name, ...(c.aka ?? []), ...old].join(' '));
}

/**
 * Searchable shopping-city picker over every city we list (useAllCities: nursery cities first,
 * the rest tagged "No plants yet", or "Ships by courier" while Plants are a nationwide
 * catalogue). Used by the header city switcher, the city-blocked screen, checkout's
 * city-mismatch prompt and the first-visit Shopping-City selection. Fail-safe.
 *
 * Compact, Blinkit-style (owner annotation 2026-10-12): detect | or | search on one row,
 * the city list as a dropdown that opens from the search box, no "Popular cities" block.
 */
export default function CityPickerDialog({
  open,
  onClose,
  onPick,
  blocking = false,
  title,
  subtitle,
  suggestedCity,
}: Props) {
  // ~1,600 cities, and a picker is mounted on every page: load the list only while open.
  const { data: cities, isLoading, isError, refetch } = useAllCities(open);
  const { plantsNationwide } = useComingSoon();
  const [q, setQ] = useState('');
  // The city list is a DROPDOWN under the search box (owner annotation 2026-10-12: "provide
  // the list in dropdown", "make small size of this popup just like blinkit"): closed until
  // the shopper taps or types in the box, so the popup opens as one compact row.
  const [listOpen, setListOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  // Why "Detect my location" found no city (DETECT_MSG), shown under the row.
  const [detectMsg, setDetectMsg] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  // Bumped by every open, close, unmount, pick and detect: a detect() still waiting on the
  // browser or the server when the shopper picks a city or leaves must not pick one after that.
  const detectRun = useRef(0);
  // detect() awaits the browser and the server: it reads the list as it is when they answer.
  const citiesRef = useRef(cities);
  useEffect(() => {
    citiesRef.current = cities;
  }, [cities]);

  // Read recents from localStorage each time the dialog opens (SSR-safe); start closed.
  useEffect(() => {
    setDetecting(false);
    if (open) {
      setRecent(getRecentCities());
      setListOpen(false);
      setDetectMsg(null);
    }
    const runs = detectRun;
    return () => {
      runs.current += 1;
    };
  }, [open]);

  const indexed = useMemo(
    () =>
      (cities ?? []).map((c) => ({ c, name: words(c.name).trim(), hay: haystack(c), key: pickerCityKey(c.name) })),
    [cities],
  );

  // An empty box lists the nursery cities (the list is nursery-first). Typing searches every
  // city, old names included: the exact name, then the same city by another name ("New Delhi",
  // "Mumbai Suburban"), then names starting with the text, then any word starting with it, then
  // the rest; nursery cities first within each.
  const needle = words(q).trim();
  const qKey = pickerCityKey(q);
  const { list, more } = useMemo(() => {
    const at = (r: (typeof indexed)[number]) =>
      r.name === needle ? 0
        : r.key === qKey ? 1
        : r.hay.startsWith(` ${needle}`) ? 2
        : r.hay.includes(` ${needle}`) ? 3
        : 4;
    const hits = needle
      ? indexed
          .filter((r) => r.key === qKey || r.hay.includes(needle))
          .map((r) => ({ c: r.c, rank: at(r) * 2 + (r.c.is_serviceable ? 0 : 1) }))
          .sort((a, b) => a.rank - b.rank)
          .map((r) => r.c)
      : indexed.map((r) => r.c).filter((c) => c.is_serviceable);
    return { list: hits.slice(0, LIMIT), more: hits.length > LIMIT };
  }, [indexed, needle, qKey]);

  // Recent chips: only cities that are still in the list.
  const recentChips = useMemo(() => {
    const names = new Set((cities ?? []).map((c) => c.name?.toLowerCase()));
    return recent.filter((r) => names.has(r.toLowerCase())).slice(0, 5);
  }, [recent, cities]);

  // Single place every selection flows through, so recents stay accurate. The neighbourhood
  // only ever comes from detect(), with the city it was found in, so the header can never
  // read "Rohini, Mumbai".
  function choose(name: string, area: string | null = null) {
    detectRun.current += 1;
    pushRecentCity(name);
    onPick(name, area);
    onClose();
  }

  function detectFailed(reason: keyof typeof DETECT_MSG) {
    track('location_denied', { meta: { source: 'gps', reason } });
    setDetectMsg(DETECT_MSG[reason]);
    setListOpen(true);
  }

  // The shopper's own tap, so the city it finds is picked straight away (Blinkit-style); a
  // failure says why and opens the list. The reverse geocode is server-side (GET geo/reverse):
  // the browser's Google key is referrer-restricted, which Google's Geocoding API refuses, so
  // this never found a city before 2026-10-12.
  async function detect() {
    const run = ++detectRun.current;
    const stale = () => run !== detectRun.current;
    setDetecting(true);
    setDetectMsg(null);
    try {
      const pos = await getBrowserCoords();
      if (stale()) return;
      if (!pos.ok) return detectFailed(pos.reason);
      const g = await reverseGeocodePin(pos.lat, pos.lng);
      if (stale()) return;
      if (!g) return detectFailed('lookup');
      if (!g.city) return detectFailed('nocity');
      track('location_detected', { label: g.city, meta: { source: 'gps', geo: g.source } });
      // The list loads when the picker opens; a cached lookup can answer first, so wait for it.
      const all = citiesRef.current ?? (await refetch()).data;
      if (stale()) return;
      if (!all?.length) return detectFailed('lookup');
      const match = findCity(all, g.city, g.city_id);
      if (match) return choose(match.name, neighbourhood(g.area));
      setDetectMsg(`We couldn’t find ${g.city} in our list. Search for your city below.`);
      setListOpen(true);
    } finally {
      if (!stale()) setDetecting(false);
    }
  }

  // The IP guess (LocationGate) only SUGGESTS: the shopper asked for nothing, and IP locations are
  // rough, so the one-tap banner offers nursery cities only.
  const suggestion = useMemo(() => {
    const c = findCity(cities, suggestedCity);
    return c?.is_serviceable ? c.name : null;
  }, [cities, suggestedCity]);

  return (
    <Transition show={open} as={Fragment}>
      <Dialog
        onClose={blocking ? () => {} : onClose}
        // z-90: this dialog is opened FROM other dialogs (the checkout city-mismatch prompt at
        // z-75, the city switcher), so it has to outrank them. At z-70 it opened *underneath* the
        // prompt that asked for it — the shopper saw the backdrop darken and nothing else.
        className="relative z-[90]"
      >
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

        {/* Sized to the SCREEN, whatever it is (annotation 2026-10-05). The panel
            used to have no height limit over a fixed 18rem city list, so on a
            short viewport (small phone, landscape, keyboard up) its lower half
            sat below the fold of a non-scrolling fixed layer — unreachable.
            Now: the top offset scales with the viewport height, the panel can
            never exceed the space left (max-h-full of this padded box), the
            city list is capped at 45% of the viewport height, and if the whole
            still does not fit, the panel itself scrolls. */}
        <div className="fixed inset-0 flex items-start justify-center p-3 pt-[clamp(0.75rem,8vh,6rem)] sm:p-4 sm:pt-[clamp(1rem,10vh,6rem)]">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-2"
          >
            <Dialog.Panel className="relative flex max-h-full w-full max-w-md flex-col overflow-y-auto overscroll-contain rounded-2xl bg-white p-4 shadow-box sm:p-5 lg:max-w-lg">
              {!blocking && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="absolute end-3 top-3 grid h-9 w-9 place-items-center rounded-full text-stone-500 transition hover:bg-stone-100 hover:text-forest-900"
                >
                  <X size={18} aria-hidden />
                </button>
              )}
              <Dialog.Title className="pe-10 text-lg font-semibold text-forest-900">
                {title ?? 'Choose your delivery city'}
              </Dialog.Title>
              <p className="mt-1 text-sm text-stone-500">
                {subtitle ??
                  'We’ll show delivery times and serviceability for this city.'}
              </p>

              {suggestion ? (
                <button
                  type="button"
                  onClick={() => choose(suggestion)}
                  className="mt-3 flex w-full items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-3.5 py-2.5 text-left text-sm"
                >
                  <span className="text-stone-600">
                    You seem to be near{' '}
                    <span className="font-semibold text-heading">{suggestion}</span>
                  </span>
                  <span className="font-semibold text-accent">Use this</span>
                </button>
              ) : null}

              {/* One compact row, Blinkit-style: detect, or search. Stacks on a phone. */}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <button
                  type="button"
                  onClick={detect}
                  disabled={detecting}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-ds-btn px-4 text-sm font-semibold text-white transition hover:bg-ds-btn-hover disabled:opacity-60"
                >
                  <MapPin size={16} aria-hidden />
                  {detecting ? 'Detecting…' : 'Detect my location'}
                </button>
                <span aria-hidden className="text-center text-xs font-semibold uppercase tracking-wide text-stone-400">
                  or
                </span>
                <div className="relative min-w-0 flex-1">
                  <input
                    value={q}
                    onFocus={() => setListOpen(true)}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setListOpen(true);
                    }}
                    placeholder="Search your city"
                    aria-label="Search your city"
                    aria-expanded={listOpen}
                    aria-controls="city-picker-list"
                    // 16px on phones: iPhone Safari zooms into a smaller field on focus.
                    className="h-11 w-full rounded-lg border border-border-base pe-9 ps-3.5 text-base outline-none focus:border-accent sm:text-sm"
                  />
                  <ChevronDown
                    size={16}
                    aria-hidden
                    className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                </div>
              </div>

              {/* Why detection found no city. Always rendered, so screen readers announce it. */}
              <p role="status" className={detectMsg ? 'mt-2 text-xs text-amber-700' : 'sr-only'}>
                {detectMsg ?? ''}
              </p>

              {!listOpen && recentChips.length ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">Recent</span>
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
              ) : null}

              {listOpen ? (
              <ul
                id="city-picker-list"
                className="mt-2 max-h-[min(16rem,40dvh)] shrink-0 divide-y divide-gray-100 overflow-auto overscroll-contain rounded-lg border border-gray-200 bg-white shadow-box"
              >
                {list.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => choose(c.name)}
                      className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm hover:bg-gray-50"
                    >
                      <span className="min-w-0">
                        <span className="font-medium text-heading">{c.name}</span>
                        {/* No partner nursery here: plants come by courier from the
                            nationwide catalogue, or not at all yet. */}
                        {!c.is_serviceable ? (
                          <>
                            {' '}
                            <span className="ms-1 whitespace-nowrap rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                              {plantsNationwide ? 'Ships by courier' : 'No plants yet'}
                            </span>
                          </>
                        ) : null}
                      </span>
                      {c.state_name ? (
                        <span className="shrink-0 text-xs text-stone-400">{c.state_name}</span>
                      ) : null}
                    </button>
                  </li>
                ))}
                {!isLoading && list.length > 0 && (!needle || more) ? (
                  <li className="px-3.5 py-2.5 text-xs text-stone-600">
                    {needle
                      ? 'Keep typing to see more cities.'
                      : `Type to search all ${(cities?.length ?? 0).toLocaleString('en-IN')} cities across India.`}
                  </li>
                ) : null}
                {/* While the city list is in flight this dialog is
                    the ONLY thing a first-time visitor can see (blocking mode),
                    so it must never flash the empty-state — "No matching
                    cities." reads as "we deliver nowhere". */}
                {isLoading
                  ? Array.from({ length: 5 }, (_, i) => (
                      <li key={`sk-${i}`} className="flex items-center justify-between px-3.5 py-2.5" aria-hidden="true">
                        <span className="h-3.5 w-28 animate-pulse rounded bg-gray-100" />
                        <span className="h-3 w-14 animate-pulse rounded bg-gray-100" />
                      </li>
                    ))
                  : null}
                {!isLoading && isError && !list.length ? (
                  <li className="px-3.5 py-4 text-center text-sm text-stone-500">
                    Couldn&rsquo;t load cities. Check your connection and{' '}
                    <button type="button" onClick={() => refetch()} className="font-semibold text-accent underline">
                      try again
                    </button>
                    .
                  </li>
                ) : null}
                {!isLoading && !isError && !list.length ? (
                  <li className="px-3.5 py-4 text-center text-sm text-stone-500">
                    No matching cities.
                  </li>
                ) : null}
              </ul>
              ) : null}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
