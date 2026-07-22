import { useQuery } from 'react-query';
import { HttpClient } from '@/framework/client/http-client';
import { useCustomerCity } from '@/lib/use-customer-city';

interface CityAvailability {
  city: string;
  available_count: number;
  local_count: number;
  has_availability: boolean;
}

/**
 * Display-only policy (Shopping-City redesign): a serviceable city with NO
 * nursery supply shows the catalog for browsing, labelled Out of Stock, and
 * cannot order. `displayOnly` is true ONLY on a positive server answer of
 * "no supply" — while loading, on error, or with no city chosen it stays
 * false (fail-open: never block the UI on a fault). The server enforces the
 * same rule at cart-migration/verify/order time, so this is purely display.
 */
export function useCitySupply(): { city: string | null; displayOnly: boolean } {
  const { city } = useCustomerCity();
  const { data } = useQuery<CityAvailability, Error>(
    ['city-supply', city],
    () => HttpClient.get<CityAvailability>('city-availability', { city }),
    { enabled: !!city, staleTime: 5 * 60 * 1000, retry: 0 },
  );
  return {
    city,
    displayOnly: !!city && !!data && !data.has_availability,
  };
}
