import { useEffect } from 'react';
import { useUser } from '@/framework/user';
import { getStoredCity, setStoredCity } from '@/lib/customer-location';

/**
 * Silently auto-selects the customer's city from their saved address on login (no
 * prompt, no Maps key) so the storefront can show "Available in your city" first.
 * Never overrides a city the customer has already chosen manually.
 */
export default function CitySync() {
  const { me } = useUser();

  useEffect(() => {
    if (!me || getStoredCity()) return;
    const addr: any = (me as any)?.address?.[0] ?? {};
    const city =
      addr?.address?.city ??
      addr?.city ??
      (me as any)?.profile?.city ??
      '';
    if (city && String(city).trim()) {
      setStoredCity(String(city));
    }
  }, [me]);

  return null;
}
