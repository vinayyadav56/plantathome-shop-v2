import { useQueryClient } from 'react-query';
import { useTypes } from '@/framework/type';
import { API_ENDPOINTS } from '@/framework/client/api-endpoints';
import { TYPES_PER_PAGE } from '@/framework/client/variables';
import type { Type } from '@/types';

/** Staging spells FarmBox `farmbox`, production `farm-box`: one vertical either way. */
const key = (slug?: string | null) => (slug === 'farm-box' ? 'farmbox' : slug);

type ProductLike =
  | { type?: { slug?: string | null } | null; type_slug?: string | null; type_id?: string | number | null }
  | null
  | undefined;

/**
 * The vertical switches GET /types carries (`availability`): which verticals are COMING SOON
 * (listed and shown, never sold) with the admin's message, and whether Plants are a nationwide
 * catalogue. Same query key and params as the header and both homes, so it reads their cached
 * list and sends no request of its own. Fail-open: before any list has landed, or from an API
 * without `availability`, nothing is coming soon (the server refuses those orders regardless).
 */
export function useComingSoon() {
  const { types } = useTypes({ limit: TYPES_PER_PAGE });
  const queryClient = useQueryClient();
  // A stored or switched city re-keys the list; until that city's lands, any cached list stands
  // in (on a first visit, the server's), so a buy button never flashes onto a Coming Soon product.
  const list =
    types ??
    queryClient.getQueriesData<Type[]>({ queryKey: [API_ENDPOINTS.TYPES] }).find(([, d]) => Array.isArray(d))?.[1] ??
    [];
  const find = (slug?: string | null) => (slug ? list.find((t) => key(t.slug) === key(slug)) : undefined);
  const soon = (t?: Type) => t?.availability?.status === 'coming_soon';

  return {
    /** By the product's type slug (cart lines carry `type_slug`), else its `type_id`. */
    isComingSoon: (p: ProductLike) => {
      const slug = p?.type?.slug ?? p?.type_slug;
      return soon(slug ? find(slug) : list.find((t) => p?.type_id != null && String(t.id) === String(p.type_id)));
    },
    /** The vertical is listed and switched on (not coming soon). */
    isOpen: (slug: string) => {
      const t = find(slug);
      return !!t && !soon(t);
    },
    messageFor: (slug?: string | null) => find(slug)?.availability?.message ?? null,
    plantsNationwide: !!find('plants')?.availability?.nationwide,
  };
}
