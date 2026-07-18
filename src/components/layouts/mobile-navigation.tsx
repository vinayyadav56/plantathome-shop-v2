'use client';
import React from 'react';
import BottomNav from '@/components/storefront/pah/bottom-nav';

/**
 * Site-wide mobile bottom bar. Delegates to the PlantAtHome BottomNav so the bar
 * is CONSISTENT across every page — the home route already renders BottomNav
 * directly, while the shared layouts (layout.tsx / layout-with-footer.tsx) and the
 * search page mount this component. Any legacy children (an injected search button)
 * are ignored; BottomNav is self-contained (Home · Categories · Plants · Wishlist ·
 * Profile). Cart stays reachable from the header on every page.
 */
export default function MobileNavigation(_props: React.PropsWithChildren<{}>) {
  return <BottomNav />;
}
