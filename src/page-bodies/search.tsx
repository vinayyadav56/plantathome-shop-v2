'use client';

import { FilterIcon } from '@/components/icons/filter-icon';
// import MobileNavigation from '@/components/layouts/mobile-navigation';
import GeneralLayout from '@/components/layouts/_general';
import { Grid } from '@/components/products/grid';
import SearchCount from '@/components/search-view/search-count';
import SidebarFilter from '@/components/search-view/sidebar-filter';
import Sorting from '@/components/search-view/sorting';
import ErrorMessage from '@/components/ui/error-message';
import { PRODUCTS_PER_PAGE } from '@/framework/client/variables';
import { useProducts } from '@/framework/product';
import { drawerAtom } from '@/store/drawer-atom';
import { motion } from 'framer-motion';
import { useAtom } from 'jotai';
import { useTranslation } from 'next-i18next';
import { useRouter } from '@/compat/next-router';
import StickyBox from 'react-sticky-box';

import dynamic from 'next/dynamic';
import { Product } from '@/types';
import useLayout from '@/lib/hooks/use-layout';

const MobileNavigation = dynamic(
  () => import('@/components/layouts/mobile-navigation'),
  {
    ssr: false,
  },
);
const FeaturedPlants = dynamic(
  () => import('@/components/products/featured-plants'),
  { ssr: false },
);


export default function SearchPage() {
  const { query } = useRouter();
  const { searchType, ...restQuery }: any = query;
  const {
    products,
    isLoading,
    isFetching,
    paginatorInfo,
    error,
    loadMore,
    isLoadingMore,
    hasMore,
  } = useProducts({
    limit: PRODUCTS_PER_PAGE,
    orderBy: 'created_at',
    sortedBy: 'DESC',
    ...(query?.category && { categories: query?.category }),
    ...(searchType && { type: searchType }),
    ...restQuery,
  });

  const { layout } = useLayout();

  if (error) return <ErrorMessage message={error.message} />;
  return (
    <div className="w-full">
      <FeaturedPlants />
      <div className="flex flex-col items-center justify-between mb-7 md:flex-row">
        {/* //FIXME: */}
        <SearchCount
          from={paginatorInfo?.firstItem ?? 0}
          to={paginatorInfo?.lastItem ?? 0}
          total={
            //@ts-ignore
            paginatorInfo?.total ?? 0
          }
        />
        <div className="max-w-xs mt-4 md:mt-0">
          <Sorting variant="dropdown" />
        </div>
      </div>
      {/* keepPreviousData keeps the old cards mounted during a filter/sort/city
          refetch; dim + disable them so the change reads as "loading" instead
          of a frozen page (the top progress bar also animates). */}
      <div
        className={
          // dim ONLY on a filter/sort/city refetch — NOT during infinite-scroll
          // "load more" (isLoadingMore), which is also part of isFetching and
          // would otherwise dim + disable the whole grid on every auto-page.
          isFetching && !isLoading && !isLoadingMore
            ? 'pointer-events-none opacity-60 transition-opacity duration-200'
            : 'transition-opacity duration-200'
        }
      >
        <Grid
          products={products as Product[] | undefined}
          loadMore={loadMore}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          error={error}
          column={layout === 'compact' ? 'five' : 'six'}
        />
      </div>
    </div>
  );
}

const GetLayout = (page: React.ReactElement) => {
  const { t } = useTranslation('common');
  const [_, setDrawerView] = useAtom(drawerAtom);
  return (
    <GeneralLayout>
      <>
        {/* very-light white-green wash (was a cream #FBF8F2 mid-stop) */}
        <div className="w-full bg-[linear-gradient(180deg,#FFFFFF_0%,#F6FAF7_48%,#EFF4EC_100%)]">
          <div className="flex w-full min-h-screen px-5 py-10 mx-auto max-w-1920 rtl:space-x-reverse md:space-x-6 lg:space-x-10 xl:py-14 xl:px-16">
            <div className="hidden w-72 shrink-0 md:block lg:w-80">
              <StickyBox offsetTop={140} offsetBottom={30}>
                <SidebarFilter inRail />
              </StickyBox>
            </div>
            {page}
          </div>
        </div>
        <MobileNavigation>
          {/* Floating filter button — the ONLY opener of the SEARCH_FILTER
              drawer, and the desktop rail is hidden below md, so without this
              sub-md users cannot filter at all. Fixed above the bottom nav;
              hidden ≥md where the sidebar rail takes over. */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() =>
              setDrawerView({
                display: true,
                view: 'SEARCH_FILTER',
              })
            }
            className="fixed bottom-24 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-ds-btn text-white shadow-lg ltr:right-4 rtl:left-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-white md:hidden"
          >
            <span className="sr-only">{t('text-filter')}</span>
            <FilterIcon width="17.05" height="18" />
          </motion.button>
        </MobileNavigation>
      </>
    </GeneralLayout>
  );
};

SearchPage.getLayout = GetLayout;


/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <SearchPage {...props} />;
  const withLayout = (SearchPage as any).getLayout ? (SearchPage as any).getLayout(page) : page;
  return withLayout;
}
