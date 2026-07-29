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
} from '@/components/search-view/plant-filter-views';
import classNames from 'classnames';
import { useAtom } from 'jotai';
import { drawerAtom } from '@/store/drawer-atom';
import ArrowNarrowLeft from '@/components/icons/arrow-narrow-left';
import { useIsRTL } from '@/lib/locals';
import Button from '@/components/ui/button';
import AppliedFilters from '@/components/search-view/applied-filters';

const FieldWrapper = ({ children, title, count, defaultOpen }: any) => (
  <div className="border-b border-forest-900/10 pb-2 last:border-0">
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
    const {
      price,
      category,
      sortedBy,
      orderBy,
      tags,
      manufacturer,
      text,
      // botanical filters
      sunlight,
      water,
      placement,
      growth,
      pet_friendly,
      sizes,
      ...rest
    } = router.query;
    router.push({
      pathname: router.pathname,
      query: {
        ...rest,
        ...(router.route !== '/[searchType]/search' && { manufacturer }),
      },
    });
  }
  return (
    <button
      className="text-[13px] font-medium text-body transition-colors hover:text-[#175840] focus:text-[#175840] focus:outline-0 lg:m-0"
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
  className?: string;
  // When rendered as an always-visible rail (e.g. the PLP from md+), switch to
  // rail mode at `md` instead of `lg` so tablets don't show the drawer-only
  // close arrow / "Show Products" button. Drawer usages keep the lg switch.
  inRail?: boolean;
}> = ({ type, showManufacturers = true, showCategories = true, showSort = true, className, inRail = false }) => {
  const router = useRouter();
  const { isRTL } = useIsRTL();
  const { t } = useTranslation('common');
  const [_, closeSidebar] = useAtom(drawerAtom);
  const categoryCount = useParamCount('category');
  const tagCount = useParamCount('tags');
  const manufacturerCount = useParamCount('manufacturer');
  const priceCount = useParamCount('price') ? 1 : 0;
  const plantCounts = usePlantFilterCounts();

  return (
    <div
      className={classNames(
        'flex h-full w-full flex-col rounded-xl border-forest-900/10 bg-white',
        inRail ? 'md:h-auto md:border' : 'lg:h-auto lg:border',
        className
      )}
    >
      <div className={classNames('sticky top-0 z-10 flex items-center justify-between rounded-tl-xl rounded-tr-xl border-b border-forest-900/10 bg-white px-5 py-4', inRail ? 'md:static' : 'lg:static')}>
        <div className="flex items-center space-x-3 rtl:space-x-reverse lg:space-x-0">
          <button
            className={classNames('text-body focus:outline-0', inRail ? 'md:hidden' : 'lg:hidden')}
            onClick={() => closeSidebar({ display: false, view: '' })}
          >
            <ArrowNarrowLeft
              className={classNames('h-7', {
                'rotate-180': isRTL,
              })}
              strokeWidth={1.7}
            />
            <span className="sr-only">{t('text-close')}</span>
          </button>

          <h3 className="text-base font-medium text-forest-900 lg:text-lg">
            {t('text-filter')}
          </h3>
        </div>

        <ClearFiltersButton />
      </div>

      {/* active filters at a glance — one removable chip per value */}
      <AppliedFilters />

      <div className="flex-1 space-y-2 px-5">
        <FieldWrapper title="text-search">
          <Search variant="minimal" label="search" />
        </FieldWrapper>

        {showSort && router.route !== '/[searchType]/search' && (
          <FieldWrapper title="text-sort">
            <Sorting />
          </FieldWrapper>
        )}

        {showCategories && (
          <FieldWrapper title="text-categories" count={categoryCount}>
            <CategoryFilter type={type} />
          </FieldWrapper>
        )}

        <FieldWrapper title="text-sort-by-price" count={priceCount}>
          <PriceFilter />
        </FieldWrapper>

        {/* Botanical facets — options + counts from products/filter-facets.
            Sections with no catalogue values render nothing (see the views). */}
        <FieldWrapper title="text-size" count={plantCounts.sizes}>
          <SizeFilterView />
        </FieldWrapper>
        <FieldWrapper title="text-placement" count={plantCounts.placement}>
          <PlacementFilterView />
        </FieldWrapper>
        <FieldWrapper title="text-sunlight" count={plantCounts.sunlight}>
          <FacetFilterView param="sunlight" facetKey="sunlight" />
        </FieldWrapper>
        <FieldWrapper title="text-watering" count={plantCounts.water}>
          <FacetFilterView param="water" facetKey="water_requirement" />
        </FieldWrapper>
        <FieldWrapper title="text-growth-rate" count={plantCounts.growth} defaultOpen={false}>
          <FacetFilterView param="growth" facetKey="growth_rate" />
        </FieldWrapper>
        <FieldWrapper title="text-pet-friendly" count={plantCounts.pet}>
          <PetFriendlyFilterView />
        </FieldWrapper>

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
      <div className={classNames('sticky bottom-0 z-10 mt-auto flex gap-3 border-t border-forest-900/10 bg-white p-5', inRail ? 'md:hidden' : 'lg:hidden')}>
        <div className="flex h-full items-center justify-center rounded border border-forest-900/15 px-4">
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
