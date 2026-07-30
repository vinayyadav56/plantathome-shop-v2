import MobileCategoryMenu from '@/components/layouts/mobile-menu/mobile-category-menu';
import { PlantLoader } from '@/components/ui/plant-loader';
import { drawerAtom } from '@/store/drawer-atom';
import { useAtom } from 'jotai';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import Drawer from './drawer';
const CartSidebarView = dynamic(
  () => import('@/components/cart/cart-sidebar-view'),
);
const MobileAuthorizedMenu = dynamic(
  () => import('@/components/layouts/mobile-menu/mobile-authorized-menu'),
);
const MobileMainMenu = dynamic(
  () => import('@/components/layouts/mobile-menu/mobile-main-menu'),
);
const SearchFilterView = dynamic(
  () => import('@/components/search-view/sidebar-filter'),
);
const MaintenanceMoreInfo = dynamic(
  () => import('@/components/maintenance/more-info')
);

export default function ManagedDrawer() {
  const [{ display, view, data }, setDrawerState] = useAtom(drawerAtom);
  return (
    <Drawer
      open={display}
      onClose={() => setDrawerState({ display: false, view: '' })}
      variant={
        [
          'FILTER_VIEW',
          'MAIN_MENU_VIEW',
          'FILTER_LAYOUT_TWO_VIEW',
          'SEARCH_FILTER',
        ].includes(view)
          ? 'left'
          : 'right'
      }
      className={
        ['MAINTENANCE_MORE_INFO']?.includes(view) ? 'max-w-sm md:max-w-xl' : ''
      }
    >
      {/* One boundary for the lazily-loaded panels. The cart is the one that
          matters: it opens on every "add to cart", and without a fallback the
          drawer slid open empty while its chunk downloaded. */}
      <Suspense
        fallback={
          <div className="grid h-full place-items-center">
            <PlantLoader size="md" />
          </div>
        }
      >
        {view === 'cart' && <CartSidebarView />}
        {view === 'FILTER_VIEW' && <MobileCategoryMenu variables={data} />}
        {view === 'MAIN_MENU_VIEW' && <MobileMainMenu />}
        {view === 'AUTH_MENU_VIEW' && <MobileAuthorizedMenu />}
        {view === 'SEARCH_FILTER' && (
          <SearchFilterView
            type={data?.type}
            showManufacturers={data?.showManufacturers}
          />
        )}
        {view === 'MAINTENANCE_MORE_INFO' && (
          <MaintenanceMoreInfo variables={data} />
        )}
      </Suspense>
    </Drawer>
  );
}
