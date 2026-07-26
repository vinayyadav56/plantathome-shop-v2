'use client';
import React from 'react';
import BottomNav from '@/components/storefront/pah/bottom-nav';

/**
 * Site-wide mobile bottom bar. Delegates to the PlantAtHome BottomNav so the bar
 * is CONSISTENT across every page — the home route already renders BottomNav
 * directly, while the shared layouts (layout.tsx / layout-with-footer.tsx) and the
 * search page mount this component.
 *
 * {children} MUST render: the search page passes its filter-drawer trigger as a
 * child (page-bodies/search.tsx), and that trigger is the ONLY opener of the
 * SEARCH_FILTER drawer in the whole app, while the desktop filter rail is
 * `hidden md:block`. The previous version dropped children as "legacy", which
 * left sub-md users with NO way to reach search filters at all. Same for the
 * home layout's mobile header-search toggle (_home.tsx). BottomNav itself stays
 * self-contained; children float above it.
 */
export default function MobileNavigation({
  children,
}: React.PropsWithChildren<{}>) {
  return (
    <>
      <BottomNav />
      {children}
    </>
  );
}
