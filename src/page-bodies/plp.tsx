'use client';

/**
 * The vertical Product Listing Page (/plants, and /plants/search in `search`
 * mode). A shop page, not a landing page: compact header → search → delivery
 * line → promises → categories → needs → toolbar → filter rail + grid.
 *
 * Everything on it is the existing listing stack: useProducts keyed exactly
 * like loadPlpData's SSR prefetch (so the first paint IS the server HTML),
 * the URL as the one source of filter state (sidebar, chips and sort all
 * write it; the compat router keeps route params out of it), the shared
 * SidebarFilter / ListingToolbar / Grid, and the cart context's own
 * add_to_cart tracking. City scoping is the API's: useProducts adds the
 * stored city to its key and the API re-bases prices and stock to it.
 */

import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import StickyBox from 'react-sticky-box';
import { useRouter } from '@/compat/next-router';
import { getLayout as getSiteLayout } from '@/components/layouts/layout';
import { Grid } from '@/components/products/grid';
import SidebarFilter from '@/components/search-view/sidebar-filter';
import ListingToolbar, { useListingView } from '@/components/search-view/listing-toolbar';
import AppliedFilters from '@/components/search-view/applied-filters';
import SearchCount from '@/components/search-view/search-count';
import { FilterIcon } from '@/components/icons/filter-icon';
import PlpHeader from '@/components/plp/plp-header';
import ValueStrip from '@/components/plp/value-strip';
import CategoryTiles from '@/components/plp/category-tiles';
import NeedChips from '@/components/plp/need-chips';
import { getVerticalMeta } from '@/components/storefront/verticals';
import { useProducts } from '@/framework/product';
import { PRODUCTS_PER_PAGE } from '@/framework/client/variables';
import { useCustomerCity } from '@/lib/use-customer-city';
import { track } from '@/lib/analytics/track';
import { drawerAtom } from '@/store/drawer-atom';
import type { Product } from '@/types';

type Props = {
  /** The vertical slug (`plants`). */
  type: string;
  /** `search` on /plants/search: the `text` param drives the list and the header. */
  mode?: 'browse' | 'search';
};

function Plp({ type, mode = 'browse' }: Props) {
  const { query } = useRouter();
  // Route params ride along in `query` (pages-router shape); strip them so they
  // never reach the products API as filters. Everything else IS a filter.
  const { searchType: _route, slug: _slug, ...restQuery } = (query ?? {}) as Record<string, any>;
  const text = typeof restQuery.text === 'string' ? restQuery.text.trim() : '';
  const [, setDrawerView] = useAtom(drawerAtom);
  const [view, setView] = useListingView();
  const { city } = useCustomerCity();
  const meta = getVerticalMeta(type);

  const {
    products,
    paginatorInfo,
    isLoading,
    isFetching,
    isLoadingMore,
    loadMore,
    hasMore,
    error,
  } = useProducts({
    limit: PRODUCTS_PER_PAGE,
    orderBy: 'created_at',
    sortedBy: 'DESC',
    type,
    // The sidebar's Categories section writes `category=`; the API wants `categories`.
    ...(restQuery.category && { categories: restQuery.category }),
    ...restQuery,
  });

  // One `search` event per term once its results are in (same contract as the
  // old search body — every entry point lands here on this vertical).
  // mapPaginatorData spreads camel-cased Laravel paginator fields; `total` is one (typed loosely).
  const total = (paginatorInfo as any)?.total as number | undefined;
  useEffect(() => {
    if (mode !== 'search' || !text || isLoading) return;
    track('search', {
      label: text,
      value: typeof total === 'number' ? total : undefined,
      meta: { term: text, results: total },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, text, isLoading]);

  // Until the city-keyed list has landed, the hydrated all-India list is on
  // screen (keepPreviousData). Say so, dimmed, rather than let it pass as the
  // city's catalogue. Not during "load more" — that is also isFetching.
  const [cityLanded, setCityLanded] = useState(false);
  useEffect(() => {
    if (city && !isFetching) setCityLanded(true);
  }, [city, isFetching]);
  const refetching = isFetching && !isLoading && !isLoadingMore;
  const awaitingCity = Boolean(city) && !cityLanded && refetching;

  return (
    <main id="main-content" className="bg-cream pb-12 sm:pb-16">
      {/* 20px gutters on phones, not 16: the category rail (.pah-rail) bleeds 20px
          into its parent's padding by design and overflowed the viewport by 4px. */}
      <div className="mx-auto max-w-[1920px] px-5 lg:px-6 xl:px-8">
        <PlpHeader
          title={meta.label}
          subtitle={meta.shopBlurb ?? meta.blurb}
          searchTerm={mode === 'search' ? text : undefined}
          total={typeof total === 'number' ? total : null}
        />

        {mode === 'browse' && (
          <>
            <ValueStrip items={meta.promise} />
            <CategoryTiles type={type} />
            <NeedChips type={type} />
          </>
        )}

        {/* ── Listing ── */}
        <section id="grid" aria-label="Products" className="mt-10 scroll-mt-[72px] sm:mt-12 lg:scroll-mt-[84px]">
          <div className="flex w-full md:gap-6 lg:gap-10">
            <div className="hidden w-72 shrink-0 md:block lg:w-80">
              <StickyBox offsetTop={102} offsetBottom={30}>
                {/* Sorting lives in the toolbar; manufacturers are not a plant concept. */}
                <SidebarFilter inRail showCategories showManufacturers={false} showSort={false} showSearch={false} type={type} />
              </StickyBox>
            </div>

            <div className="min-w-0 flex-1">
              {/* Sticky under the header (58px / 68px) so sort + view are always in reach. */}
              <div className="sticky top-[58px] z-20 -mx-1 px-1 pt-1 lg:top-[68px]">
                <ListingToolbar
                  view={view}
                  onViewChange={setView}
                  count={typeof total === 'number' ? total : (products ?? []).length}
                  hasMore={typeof total === 'number' ? false : hasMore}
                />
              </div>

              <div className="-mt-3 mb-4 flex flex-wrap items-center justify-between gap-2 px-1">
                {paginatorInfo && typeof total === 'number' && total > 0 ? (
                  <SearchCount
                    from={paginatorInfo.firstItem ?? 0}
                    to={Math.min(total, (products ?? []).length)}
                    total={total}
                  />
                ) : (
                  <span />
                )}
                {awaitingCity && (
                  <span className="text-[13px] text-stone-500" aria-live="polite">
                    Updating for {city}…
                  </span>
                )}
              </div>

              {/* The rail's chips, surfaced above the grid too: on a phone the rail is a drawer. */}
              <div className="-mx-5 mb-2 md:hidden">
                <AppliedFilters />
              </div>

              <div
                aria-busy={refetching || undefined}
                className={
                  refetching
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
                  column={view === 'list' ? 'list' : 'auto'}
                  categoryName={meta.label}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Floating filter button (sub-md) — the same drawer as /c and search. */}
      <button
        type="button"
        onClick={() => setDrawerView({ display: true, view: 'SEARCH_FILTER', data: { type, showManufacturers: false } })}
        className="fixed bottom-24 z-40 flex h-12 items-center gap-2 rounded-full bg-ds-btn px-4 text-[13px] font-semibold text-white shadow-lg ltr:right-4 rtl:left-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-white md:hidden"
      >
        <FilterIcon width="15" height="16" />
        Filters
      </button>
    </main>
  );
}

Plp.getLayout = getSiteLayout;

/* ── App Router body wrapper (V1 _app.tsx getLayout semantics) ── */
export function PageBody(props: Props) {
  const page = <Plp {...props} />;
  return (Plp as any).getLayout ? (Plp as any).getLayout(page) : page;
}

export default Plp;
