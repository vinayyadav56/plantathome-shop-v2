import { useQuery } from 'react-query';
import { HttpClient } from './client/http-client';
import { API_ENDPOINTS } from './client/api-endpoints';
import { pickerCityKey } from '@/lib/shopping-city';

export interface LookupState {
  id: number;
  name: string;
  code?: string | null;
}

export interface LookupCity {
  id: number;
  name: string;
  state_id?: number | null;
  state_name?: string | null;
  /** active | paused | maintenance | disabled */
  status?: string | null;
  /** A partner nursery delivers plants here. Every listed city gets Tools (they ship nationwide). */
  is_serviceable?: boolean;
  /** useAllCities: names of this city's unlisted twins, so searching them still finds it. */
  aka?: string[];
}

/** Master states for the address State dropdown (public, cached). Fail-safe: errors → []. */
export function useLookupStates() {
  return useQuery<LookupState[], Error>(
    ['lookup-states'],
    () => HttpClient.get<LookupState[]>(API_ENDPOINTS.LOCATIONS_STATES),
    { staleTime: 1000 * 60 * 30, retry: 0 },
  );
}

/**
 * Every city a shopper can pick as their shopping city (owner 2026-10-12: "show all the cities
 * that we can list in our platform, not just the cities where we have nurseries"). This used to
 * ask for serviceable=1, the ~9 nursery cities. A city without a nursery still gets Tools, which
 * ship nationwide, and its plant listings say "No plants in {city} yet".
 *
 * Nursery cities first, A–Z inside each group. Left out: cities ops switched off
 * (paused/disabled), and rows that are an old name or a district of a nursery city ("Gurgaon",
 * "Shahdara", "Belagavi (Belgaum)", "Bengaluru (Bangalore) Urban"), which would sit next to the
 * real city as a plant-less twin; their names stay searchable through `aka`. ~1,600 rows (about
 * 30 KB gzipped; Cloudflare doesn't cache this JSON, the browser keeps it 60 s and react-query
 * 10 min), so pickers load it only while open. Fail-safe.
 */
export function useAllCities(enabled = true) {
  return useQuery<LookupCity[], Error>(
    ['all-cities', 'listable'],
    async () => {
      const rows = await HttpClient.get<LookupCity[]>(API_ENDPOINTS.LOCATIONS_CITIES);
      // Twins fold into their nursery city even while ops have it switched off: a paused Delhi
      // must not let "Shahdara" (which the server reads as Delhi) back into the list.
      const nursery = new Map<string, LookupCity>();
      for (const c of rows) {
        const key = pickerCityKey(c.name);
        if (c.is_serviceable && !nursery.has(key)) nursery.set(key, c);
      }
      const listed: LookupCity[] = [];
      for (const c of rows) {
        if (c.status === 'paused' || c.status === 'disabled') continue;
        const twin = c.is_serviceable ? undefined : nursery.get(pickerCityKey(c.name));
        if (twin) twin.aka = [...(twin.aka ?? []), c.name];
        else listed.push(c);
      }
      return listed.sort((a, b) => Number(!!b.is_serviceable) - Number(!!a.is_serviceable));
    },
    { staleTime: 1000 * 60 * 10, retry: 0, enabled },
  );
}

/** Master cities (optionally filtered by state) for the City autocomplete. Fail-safe. */
export function useLookupCities(stateId?: number | string | null) {
  return useQuery<LookupCity[], Error>(
    ['lookup-cities', stateId ?? 'all'],
    () =>
      HttpClient.get<LookupCity[]>(
        API_ENDPOINTS.LOCATIONS_CITIES,
        stateId ? { state_id: stateId } : {},
      ),
    { staleTime: 1000 * 60 * 10, retry: 0, enabled: Boolean(stateId) },
  );
}

/**
 * Active city landing pages (/plants-in/{slug}) for the footer's
 * "Plant Delivery Across India" band. Public, cached, fail-safe — the band
 * renders nothing while this is empty.
 */
export function useLocationPages() {
  return useQuery<{ slug: string; city_name: string }[], Error>(
    ['location-pages'],
    () => HttpClient.get<{ slug: string; city_name: string }[]>(API_ENDPOINTS.LOCATION_PAGES),
    { staleTime: 1000 * 60 * 30, retry: 0 },
  );
}
