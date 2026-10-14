'use client';

/**
 * The vertical Product Listing Page (/plants, and /plants/search in `search`
 * mode), laid out to the 2026-10-07 mock: hero band → the white "Shop by
 * Category" card overlapping it → the filter rail beside "Shop by Need",
 * the results row (count · sort · view) and the 6-up grid.
 *
 * Everything on it is the existing listing stack: useProducts keyed exactly
 * like loadPlpData's SSR prefetch (so the first paint IS the server HTML),
 * the URL as the one source of filter state (sidebar, tiles and sort all
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
import { FilterIcon } from '@/components/icons/filter-icon';
import PlpHero from '@/components/plp/plp-hero';
import CategoryTiles from '@/components/plp/category-tiles';
import NeedTiles from '@/components/plp/need-tiles';
import VerticalSearch from '@/components/ui/search/vertical-search';
import { getVerticalMeta } from '@/components/storefront/verticals';
import { useFilterFacets, useProducts } from '@/framework/product';
import { PRODUCTS_PER_PAGE } from '@/framework/client/variables';
import { useCustomerCity } from '@/lib/use-customer-city';
import { track } from '@/lib/analytics/track';
import { drawerAtom } from '@/store/drawer-atom';
import type { Product } from '@/types';

type Props = {
  /** The vertical slug (`plants`). */
  type: string;
  /** `search` on /plants/search: the `text` param drives the list and the hero line. */
  mode?: 'browse' | 'search';
  /** City-less catalogue total from loadPlpData (the hero's "N+ plants"); null when unknown. */
  catalogueTotal?: number | null;
};

function Plp({ type, mode = 'browse', catalogueTotal = null }: Props) {
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
    // Popular — identical to loadPlpData's default (formatProductsArgs adds the id tie-break).
    orderBy: 'sold_quantity',
    sortedBy: 'DESC',
    type,
    // The sidebar's Categories section writes `category=`; the API wants `categories`.
    ...(restQuery.category && { categories: restQuery.category }),
    ...restQuery,
  });

  // /plants/search has no loadPlpData: the hero's "N+ plants" falls back to the
  // facets' catalogue total (the same key the rail and tiles already read).
  const { data: facetData } = useFilterFacets({ type });
  const heroTotal = catalogueTotal ?? (typeof facetData?.total === 'number' ? facetData.total : null);

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

  const countLabel =
    mode === 'search' && text ? (
      <>
        Results for <strong className="font-bold">“{text}”</strong>
      </>
    ) : (
      <>
        <strong className="font-bold tabular-nums">
          {typeof total === 'number' ? total.toLocaleString('en-IN') : (products ?? []).length}
        </strong>{' '}
        <span className="font-bold">Plants</span>{' '}
        <span className="text-[18px]">available{city ? ` in ${city}` : ''}</span>
      </>
    );

  return (
    <main id="main-content" className="bg-page pb-12 sm:pb-16">
      {/* 20px gutters on phones, not 16: the category rail (.pah-rail) bleeds 20px
          into its parent's padding by design and overflowed the viewport by 4px. */}
      <div className="mx-auto max-w-[1920px] px-5 lg:px-6 xl:px-8">
        <PlpHero
          type={type}
          title={meta.label}
          subtitle={meta.shopBlurb ?? meta.blurb}
          total={heroTotal}
          searchTerm={mode === 'search' ? text : undefined}
          tiles={mode === 'browse'}
        />

        {mode === 'browse' && <CategoryTiles type={type} />}

        {/* ── Listing ── */}
        <section id="grid" aria-label="Products" className="mt-8 scroll-mt-[72px] lg:scroll-mt-[84px]">
          <div className="flex w-full md:gap-6">
            <div className="hidden w-[226px] shrink-0 md:block">
              <StickyBox offsetTop={102} offsetBottom={30}>
                {/* Sorting lives in the toolbar; manufacturers are not a plant concept. */}
                <SidebarFilter inRail simplePrice showCategories showManufacturers={false} showSort={false} showSearch={false} type={type} />
              </StickyBox>
            </div>

            <div className="min-w-0 flex-1">
              {/* Shop by Need with the vertical's search box in the row's right corner (owner
                  annotation 2026-10-12); below lg it sits under the tiles. The box is outside
                  the tiles' section, so it stays when they have nothing to show, and on
                  /plants/search (holding the term). lg:mb-2 centres it on the 64px tiles. */}
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-6">
                {mode === 'browse' && (
                  <div className="min-w-0 empty:hidden lg:flex-1">
                    <NeedTiles type={type} />
                  </div>
                )}
                <VerticalSearch type={type} className="lg:mb-2 lg:ml-auto lg:w-[260px] lg:shrink-0 xl:w-[360px]" />
              </div>

              {/* The results strip (owner 2026-10-07: soft sage), sticky under the header
                  (58px / 68px) so sort + view are always in reach. The plain toolbar has no
                  backdrop of its own, so this paints it: full-bleed on phones (-mx-5 = the
                  page gutter), an 8px-radius bar beside the filter rail from md. */}
              <div className="sticky top-[58px] z-20 -mx-5 mb-4 bg-sage-100 px-5 md:mx-0 md:rounded-lg md:px-4 lg:top-[68px]">
                <ListingToolbar
                  variant="plain"
                  view={view}
                  onViewChange={setView}
                  countLabel={countLabel}
                  sortDefaultOrderBy="sold_quantity"
                  sortCompact
                />
              </div>

              {awaitingCity && (
                <p className="mb-2 text-[13px] text-stone-500" aria-live="polite">
                  Updating for {city}…
                </p>
              )}

              {/* The rail's chips, surfaced above the grid too: on a phone the rail is a drawer. */}
              <div className="-mx-5 mb-2 md:hidden">
                <AppliedFilters facets={facetData?.facets?.dynamic} />
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
                  // The one card and the shared column ladder, exactly as /c renders them
                  // (owner, 2026-10-09: same card on every vertical).
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Floating filter button (sub-md) — the same drawer as /c and search;
          bottom-[88px] clears the bottom nav and the home indicator. */}
      <button
        type="button"
        onClick={() => setDrawerView({ display: true, view: 'SEARCH_FILTER', data: { type, showManufacturers: false } })}
        className="fixed bottom-[88px] z-40 flex h-12 items-center gap-2 rounded-full bg-ds-btn px-4 text-[13px] font-semibold text-white shadow-lg ltr:right-4 rtl:left-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-white md:hidden"
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
