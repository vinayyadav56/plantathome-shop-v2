import CheckboxGroup from './checkbox-group';
import type { FilterFacets } from '@/types';
import { useState, useEffect, useMemo } from 'react';
import Checkbox from '@/components/ui/forms/checkbox/checkbox';
import { useRouter } from '@/compat/next-router';
import Scrollbar from '@/components/ui/scrollbar';
import { useTranslation } from 'next-i18next';
import { useCategories } from '@/framework/category';
import { CATEGORIES_PER_PAGE } from '@/framework/client/variables';
import ErrorMessage from '@/components/ui/error-message';
import Spinner from '@/components/ui/loaders/spinner/spinner';
import { isEmpty } from 'lodash';
import Alert from '@/components/ui/alert';
import FilterListSearch from '@/components/search-view/filter-list-search';
import { useFilterFacets } from '@/framework/product';
import { usePushParam } from '@/components/search-view/plant-filter-views';

interface Props {
  categories: any[];
}

const CategoryFilterView = ({ categories }: Props) => {
  const { t } = useTranslation('common');

  const router = useRouter();
  const selectedValues = useMemo(
    () =>
      router.query.category ? (router.query.category as string).split(',') : [],
    [router.query.category]
  );
  const [state, setState] = useState<string[]>(() => selectedValues);
  const [needle, setNeedle] = useState('');
  useEffect(() => {
    setState(selectedValues);
  }, [selectedValues]);
  const visible = useMemo(
    () =>
      needle.trim()
        ? categories.filter((c) =>
            c?.name?.toLowerCase().includes(needle.trim().toLowerCase()),
          )
        : categories,
    [categories, needle],
  );

  function handleChange(values: string[]) {
    setState(values); // flip the checkbox instantly, before the URL/refetch settles
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        category: values.join(','),
      },
    });
  }

  return (
    <div className="relative -mb-5 after:absolute after:bottom-0 after:flex after:h-6 after:w-full after:bg-gradient-to-t after:from-white ltr:after:left-0 rtl:after:right-0">
      {categories.length > 8 && (
        <FilterListSearch value={needle} onChange={setNeedle} />
      )}
      <Scrollbar style={{ maxHeight: '400px' }} className="pb-6">
        <span className="sr-only">{t('text-categories')}</span>
        <div className="grid grid-cols-1 gap-2">
          <CheckboxGroup values={state} onChange={handleChange}>
            {visible.filter(Boolean).map((plan) => (
              <Checkbox
                key={plan.id}
                label={plan.name}
                name={plan.slug}
                value={plan.slug}
                theme="secondary"
              />
            ))}
          </CheckboxGroup>
        </div>
      </Scrollbar>
    </div>
  );
};

const VISIBLE_ROWS = 5;

/** Facet-driven list: the categories that actually have listed products, with
 *  live counts (the index's `products_count` is null), busiest first. Writes
 *  the same `category` param as the legacy list, so chips and Clear all agree. */
const FacetCategoryList = ({ rows }: { rows: NonNullable<FilterFacets['facets']['categories']> }) => {
  const { query } = useRouter();
  const push = usePushParam();
  const [expanded, setExpanded] = useState(false);
  const selected = typeof query.category === 'string' ? query.category.split(',').filter(Boolean) : [];
  const sorted = useMemo(
    () => rows.filter((c) => c.count > 0).sort((a, b) => b.count - a.count),
    [rows],
  );
  // A selected category stays visible even when it sorts below the fold.
  const visible = sorted.filter((c, i) => expanded || i < VISIBLE_ROWS || selected.includes(c.slug));

  if (!sorted.length) return <Alert message="No categories found." />;

  const toggle = (slug: string) =>
    push('category', selected.includes(slug) ? selected.filter((v) => v !== slug) : [...selected, slug]);

  return (
    <div className="flex flex-col space-y-3.5">
      {visible.map((c) => (
        <div key={c.slug} className="flex items-center justify-between gap-2">
          <Checkbox
            name={`category-${c.slug}`}
            value={c.slug}
            label={c.name}
            checked={selected.includes(c.slug)}
            onChange={() => toggle(c.slug)}
          />
          <span className="text-xs tabular-nums text-stone-400">{c.count}</span>
        </div>
      ))}
      {sorted.length > VISIBLE_ROWS && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="self-start text-[13px] font-semibold text-forest-700 hover:underline focus:outline-0 focus-visible:underline"
        >
          {expanded ? '− Show less' : '+ Show more'}
        </button>
      )}
    </div>
  );
};

/** The pre-facets list (categories index, no counts) for APIs without `facets.categories`. */
const IndexCategoryFilter = ({ type }: { type?: any }) => {
  const { query } = useRouter();

  // @ts-ignore
  const { categories, isLoading, error } = useCategories({
    ...(type ? { type } : { type: query.searchType }),
    limit: CATEGORIES_PER_PAGE,
  });

  if (error) return <ErrorMessage message={error.message} />;
  if (isLoading)
    return (
      <div className="flex w-full items-center justify-center py-5">
        <Spinner className="h-6 w-6" simple={true} />
      </div>
    );
  return !isEmpty(categories) ? (
    <CategoryFilterView categories={categories} />
  ) : (
    <Alert message="No categories found." />
  );
};

const CategoryFilter: React.FC<{ type?: any }> = ({ type }) => {
  const { data, isLoading } = useFilterFacets({ type });
  const rows = data?.facets?.categories;
  // Settle the facets first so the legacy list isn't fetched only to be replaced.
  if (isLoading)
    return (
      <div className="flex w-full items-center justify-center py-5">
        <Spinner className="h-6 w-6" simple={true} />
      </div>
    );
  return Array.isArray(rows) ? <FacetCategoryList rows={rows} /> : <IndexCategoryFilter type={type} />;
};

export default CategoryFilter;
