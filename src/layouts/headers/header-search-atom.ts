import { atom, useAtom } from 'jotai';

/**
 * V1 imported this from '@/layouts/headers/header-search-atom' — a path that
 * never existed in the shop repo (latent, shipped with ignoreBuildErrors; the
 * importing banner variant isn't rendered by the PlantAtHome layouts). Minimal
 * functional implementation so the module resolves.
 */
const headerSearchAtom = atom(false);

export function useHeaderSearch() {
  const [showHeaderSearch, setShowHeaderSearch] = useAtom(headerSearchAtom);
  return {
    showHeaderSearch: () => setShowHeaderSearch(true),
    hideHeaderSearch: () => setShowHeaderSearch(false),
    displayHeaderSearch: showHeaderSearch,
  };
}
