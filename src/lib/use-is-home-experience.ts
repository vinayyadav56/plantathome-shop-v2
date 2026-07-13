import { useRouter } from '@/compat/next-router';
import { useTypes } from '@/framework/type';
import { TYPES_PER_PAGE } from '@/framework/client/variables';

/**
 * True when the current route is the brand "home experience" — the root `/` or
 * the home-type vertical (the same routes where the desktop renders
 * PlantCompanyHome). Used to swap to the mobile Claude Design home (<lg) without
 * affecting non-home verticals (e.g. /tools, /farmbox). Shared by the home shell
 * (_home.tsx) and the home body (plantathome.tsx) so they stay in sync.
 */
export function useIsHomeExperience(): boolean {
  const { asPath, query } = useRouter();
  const { types } = useTypes({ limit: TYPES_PER_PAGE });
  // Filtering (search/category) falls back to the standard grid + prod chrome.
  if (query?.text || query?.category) return false;
  const homeSlug =
    (types ?? []).find((t) => t?.settings?.isHome)?.slug ?? (types ?? [])[0]?.slug;
  const seg = (asPath || '/').split(/[?#]/)[0].replace(/^\/+/, '').split('/')[0];
  return seg === '' || (Boolean(homeSlug) && seg === homeSlug);
}

export default useIsHomeExperience;
