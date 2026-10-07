import { CustomDisclosure } from '@/components/ui/disclosure';
import { useTranslation } from 'next-i18next';
import Search from '@/components/ui/search/search';
import { useRouter } from '@/compat/next-router';
import Sorting from './sorting';
import PriceFilter from '@/components/search-view/price-filter';
import CategoryFilter from '@/components/search-view/category-filter-view';
import TagFilter from '@/components/search-view/tag-filter-view';
import ManufacturerFilter from '@/components/search-view/manufacturer-filter-view';
import {
  FacetFilterView, PlacementFilterView, PetFriendlyFilterView, SizeFilterView,
  usePlantFilterCounts,
  DynamicFacetView,
  useDynamicFacetCount,
} from '@/components/search-view/plant-filter-views';
import { useFilterFacets } from '@/framework/product';
import type { DynamicFacet } from '@/types';
import classNames from 'classnames';
import { useAtom } from 'jotai';
import { drawerAtom } from '@/store/drawer-atom';
import ArrowNarrowLeft from '@/components/icons/arrow-narrow-left';
import { useIsRTL } from '@/lib/locals';
import Button from '@/components/ui/button';
import AppliedFilters from '@/components/search-view/applied-filters';

/** One admin-defined attribute as a collapsible section (own hook call ⇒ own component). */
const DynamicFacetSection = ({ facet }: { facet: DynamicFacet }) => {
  // DynamicFacetView reads its options from the facet object it is handed, so
  // the scoping happens once, where the facets are fetched (below).
  const count = useDynamicFacetCount(facet);
  return (
    <FieldWrapper title={facet.name} count={count} defaultOpen={false}>
      <DynamicFacetView facet={facet} />
    </FieldWrapper>
  );
};

const FieldWrapper = ({ children, title, count, defaultOpen }: any) => (
  <div className="border-b border-kraft-200 pb-2 last:border-0">
    <CustomDisclosure title={title} count={count} defaultOpen={defaultOpen}>
      {children}
    </CustomDisclosure>
  </div>
);

/** Selected-value count for a comma-separated URL filter param. */
const useParamCount = (param: string) => {
  const { query } = useRouter();
  const raw = query[param];
  return typeof raw === 'string' && raw.length
    ? raw.split(',').filter(Boolean).length
    : 0;
};

function ClearFiltersButton() {
  const { t } = useTranslation('common');
  const router = useRouter();

  function clearFilters() {
    // Everything a shopper can set from the rail or the toolbar. `rest` keeps
    // only what is NOT a filter (and the compat router drops the route params,
    // so `searchType`/`slug` never leak into the URL). The old version kept
    // `manufacturer` behind a `router.route` check that could never match on
    // the App Router — it spread `{ manufacturer: undefined }` into the URL and
    // the API searched for `manufacturer.slug:undefined`: an empty grid.
    const {
      price,
      category,
      sortedBy,
      orderBy,
      tags,
      manufacturer,
      text,
      limit,
      // botanical filters
      sunlight,
      water,
      placement,
      growth,
      pet_friendly,
      air_purifying,
      sizes,
      difficulty,
      terms,
      ...rest
    } = router.query;
    router.push({ pathname: router.pathname, query: { ...rest } });
  }
  return (
    <button
      type="button"
      className="rounded-full border border-kraft-200 px-3 py-1 text-[12px] font-semibold text-forest-900 transition-colors hover:border-forest-900/30 hover:bg-sage-50 focus:outline-0 focus-visible:ring-1 focus-visible:ring-forest-700"
      onClick={clearFilters}
    >
      {t('text-clear-all')}
    </button>
  );
}
const SidebarFilter: React.FC<{
  type?: string;
  showManufacturers?: boolean;
  /** Category pages pin the category via the route — hide the redundant
   *  (and conflicting) Categories section there. */
  showCategories?: boolean;
  /** Pages with a listing toolbar own sorting there — hide the duplicate. */
  showSort?: boolean;
  /** The PLP has the page-level search field — hide the rail's small one. */
  showSearch?: boolean;
  className?: string;
  // When rendered as an always-visible rail (e.g. the PLP from md+), switch to
  // rail mode at `md` instead of `lg` so tablets don't show the drawer-only
  // close arrow / "Show Products" button. Drawer usages keep the lg switch.
  inRail?: boolean;
  /** The PLP's Price section is slider + readout only (no histogram, no From/To). */
  simplePrice?: boolean;
}> = ({ type, showManufacturers = true, showCategories = true, showSort = true, showSearch = true, className, inRail = false, simplePrice = false }) => {
  const router = useRouter();
  const { isRTL } = useIsRTL();
  const { t } = useTranslation('common');
  const [_, closeSidebar] = useAtom(drawerAtom);
  const categoryCount = useParamCount('category');
  const tagCount = useParamCount('tags');
  const manufacturerCount = useParamCount('manufacturer');
  const priceCount = useParamCount('price') ? 1 : 0;
  const plantCounts = usePlantFilterCounts();
  const { data: facetData } = useFilterFacets({ type });
  const facets = facetData?.facets;
  const dynamicFacets = facets?.dynamic ?? [];
  // A facet section with no catalogue values for this vertical + city is a bare
  // title over nothing — skip it. Before the facets land there is nothing to
  // offer either (the PLP hydrates them server-side, so no flash there).
  const has = (rows: { count: number }[] | undefined) => Boolean(rows?.length);

  return (
    <div
      className={classNames(
        'flex h-full w-full flex-col rounded-xl border-kraft-200 bg-white',
        // 13px facet scale, forced from the panel root. Checkbox and SearchBox
        // are app-wide primitives that hardcode `text-sm` on their own label /
        // input, and Tailwind emits arbitrary sizes BEFORE the named scale, so
        // a `text-[13px]` handed down as a prop loses the cascade. A descendant
        // selector (0,1,1) beats the primitive's own class without resizing
        // every checkbox and search field in the app.
        '[&_input]:text-[13px] [&_label]:text-[13px]',
        inRail ? 'md:h-auto md:border' : 'lg:h-auto lg:border',
        className
      )}
    >
      <div className={classNames('sticky top-0 z-10 flex items-center justify-between rounded-tl-xl rounded-tr-xl border-b border-kraft-200 bg-white px-5 py-4', inRail ? 'md:static' : 'lg:static')}>
        <div className="flex items-center space-x-3 rtl:space-x-reverse lg:space-x-0">
          <button
            className={classNames('text-body focus:outline-0', inRail ? 'md:hidden' : 'lg:hidden')}
            onClick={() => closeSidebar({ display: false, view: '' })}
          >
            <ArrowNarrowLeft
              className={classNames('h-7', {
                'rotate-180': isRTL,
              })}
            />
            <span className="sr-only">{t('text-close')}</span>
          </button>

          <h3 className="text-[18px] font-semibold text-forest-900">Filters</h3>
        </div>

        <ClearFiltersButton />
      </div>

      {/* active filters at a glance — one removable chip per value */}
      <AppliedFilters />

      <div className="flex-1 space-y-2 px-5 pt-3">
        {showSearch && (
          <FieldWrapper title="text-search">
            <Search variant="minimal" label="search" />
          </FieldWrapper>
        )}

        {showSort && router.route !== '/[searchType]/search' && (
          <FieldWrapper title="text-sort">
            <Sorting />
          </FieldWrapper>
        )}

        {/* Section titles are plain strings: CustomDisclosure passes them through
            t() untouched, and the locale keys they'd replace (`text-categories`,
            `text-sort-by-price`) label other surfaces, so common.json stays as is. */}
        {showCategories && (
          <FieldWrapper title="Category" count={categoryCount}>
            <CategoryFilter type={type} />
          </FieldWrapper>
        )}

        <FieldWrapper title="Price Range" count={priceCount}>
          <PriceFilter type={type} simple={simplePrice} />
        </FieldWrapper>

        {/* Botanical facets — options + counts from products/filter-facets.
            Sections with no catalogue values render nothing (see the views). */}
        <FieldWrapper title="Plant Size" count={plantCounts.sizes}>
          <SizeFilterView type={type} />
        </FieldWrapper>
        {has(facets?.sunlight) && (
          <FieldWrapper title="Light Requirement" count={plantCounts.sunlight}>
            <FacetFilterView param="sunlight" facetKey="sunlight" type={type} />
          </FieldWrapper>
        )}
        {has(facets?.indoor_outdoor) && (
          <FieldWrapper title="text-placement" count={plantCounts.placement}>
            <PlacementFilterView />
          </FieldWrapper>
        )}
        {has(facets?.water_requirement) && (
          <FieldWrapper title="text-watering" count={plantCounts.water}>
            <FacetFilterView param="water" facetKey="water_requirement" type={type} />
          </FieldWrapper>
        )}
        {(facets?.pet_friendly?.true ?? 0) > 0 && (
          <FieldWrapper title="text-pet-friendly" count={plantCounts.pet}>
            <PetFriendlyFilterView type={type} />
          </FieldWrapper>
        )}
        {has(facets?.growth_rate) && (
          <FieldWrapper title="text-growth-rate" count={plantCounts.growth} defaultOpen={false}>
            <FacetFilterView param="growth" facetKey="growth_rate" type={type} />
          </FieldWrapper>
        )}
        {has(facets?.difficulty_level) && (
          <FieldWrapper title="Difficulty" count={plantCounts.difficulty} defaultOpen={false}>
            <FacetFilterView param="difficulty" facetKey="difficulty_level" type={type} />
          </FieldWrapper>
        )}

        {/* Admin-defined attributes. The server tells us which sections exist and what is
            in them, so a new characteristic appears here without a release. */}
        {dynamicFacets.map((facet) => (
          <DynamicFacetSection key={facet.slug} facet={facet} />
        ))}

        {/* Secondary filters start collapsed — declutters the panel and defers
            their metadata fetch until the shopper opens the section. Any active
            selection is still surfaced by the count badge on the header and the
            removable "Applied filters" chips above, so nothing is hidden.
            (We deliberately don't key defaultOpen off the count: the desktop
            rail mounts during hydration when the URL query isn't yet readable —
            getServerSearchSnapshot === '' — so count is always 0 at mount and
            Headless UI never re-reads defaultOpen afterwards.) */}
        <FieldWrapper title="text-tags" count={tagCount} defaultOpen={false}>
          <TagFilter type={type} />
        </FieldWrapper>

        {showManufacturers && (
          <FieldWrapper
            title="text-manufacturers"
            count={manufacturerCount}
            defaultOpen={false}
          >
            <ManufacturerFilter type={type} />
          </FieldWrapper>
        )}
      </div>
      <div className={classNames('sticky bottom-0 z-10 mt-auto flex gap-3 border-t border-kraft-200 bg-white p-5', inRail ? 'md:hidden' : 'lg:hidden')}>
        {/* The button is its own bordered pill now — no second frame around it. */}
        <div className="flex h-full items-center justify-center">
          <ClearFiltersButton />
        </div>
        {/* flex-1, NOT w-full: Button carries shrink-0, so a 100%-wide child
            next to "Clear all" overflowed the drawer and clipped the label at
            390px. flex-1 gives it the leftover track instead. */}
        <Button
          className="min-w-0 flex-1"
          onClick={() => closeSidebar({ display: false, view: '' })}
        >
          {t('filter-show-products')}
        </Button>
      </div>
    </div>
  );
};

export default SidebarFilter;
