import { useQuery } from 'react-query';
import client from './client';
import type { PlantCollection } from '@/types';

/** The endpoint returns the active rows already in admin `sort` order — no
 *  client filtering. Tolerates both a bare array and a `{data}` envelope. */
export const toCollectionList = (raw: unknown): PlantCollection[] =>
  Array.isArray(raw) ? raw : Array.isArray((raw as any)?.data) ? (raw as any).data : [];

/** "Shop by Need" source. Prefetched by loadPlpData under the same key. */
export function usePlantCollections() {
  const { data, ...rest } = useQuery(['plant-collections'], () => client.plantCollections.all(), {
    staleTime: 10 * 60 * 1000,
  });
  return { collections: toCollectionList(data), ...rest };
}
