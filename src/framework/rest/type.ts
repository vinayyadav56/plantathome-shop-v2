import type { Type, TypeQueryOptions } from '@/types';
import { useQuery } from 'react-query';
import client from './client';
import { API_ENDPOINTS } from './client/api-endpoints';
import { useRouter } from '@/compat/next-router';
import { useEffect, useState } from 'react';
import { getStoredCity } from '@/lib/customer-location';

export function useTypes(options?: Partial<TypeQueryOptions>) {
  const { locale } = useRouter();

  // Pass the shopper's selected city so the Operations Control Center can hide a
  // vertical disabled *in that city* from the nav immediately (a global disable
  // is hidden even without a city). Refetch when the stored city changes.
  const [city, setCity] = useState<string | null>(null);
  useEffect(() => {
    setCity(getStoredCity());
    const onChange = () => setCity(getStoredCity());
    window.addEventListener('pah-location-changed', onChange);
    return () => window.removeEventListener('pah-location-changed', onChange);
  }, []);

  let formattedOptions = {
    ...options,
    ...(city ? { city } : {}),
    language: locale,
  }

  const { data, isLoading, error } = useQuery<Type[], Error>(
    [API_ENDPOINTS.TYPES, formattedOptions],
    ({ queryKey }) => client.types.all(Object.assign({}, queryKey[1]))
  );
  return {
    types: data,
    isLoading,
    error,
  };
}

export function useType(slug: string) {
  const { locale } = useRouter();

  const { data, isLoading, error } = useQuery<Type, Error>(
    [API_ENDPOINTS.TYPES, { slug, language: locale }],
    () => client.types.get({ slug, language: locale! }),
    {
      enabled: Boolean(slug),
    }
  );
  return {
    type: data,
    isLoading,
    error,
  };
}
