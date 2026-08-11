import { useQuery } from 'react-query';
import { HttpClient } from '@/framework/client/http-client';

export interface PincodeServiceability {
  serviceable: boolean;
  pincode: string;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  cod_enabled?: boolean;
  eta_days?: number | null;
  reason?: string;
}

/**
 * Checks whether a delivery pincode is serviceable (allow-list managed in admin).
 * Disabled until a plausible pincode (>= 4 digits) is present.
 */
export function usePincodeServiceability(pincode?: string | null) {
  const clean = (pincode ?? '').replace(/\D/g, '');
  const enabled = clean.length >= 4;

  const { data, isLoading, isFetching, isError, refetch } = useQuery<PincodeServiceability>(
    ['pincode-check', clean],
    () =>
      HttpClient.get<PincodeServiceability>('delivery-pincodes/check', {
        pincode: clean,
      }),
    { enabled, staleTime: 5 * 60 * 1000, retry: 1 },
  );

  return {
    result: enabled ? data : undefined,
    loading: enabled && (isLoading || isFetching),
    checked: enabled && !!data,
    // Surfaced so the UI can SAY the check failed instead of silently rendering nothing
    // (ordering still fails open — coverage is advisory, but invisibility isn't).
    error: enabled && isError,
    retry: refetch,
  };
}
