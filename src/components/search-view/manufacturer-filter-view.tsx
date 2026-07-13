import CheckboxGroup from './checkbox-group';
import { useState, useEffect, useMemo } from 'react';
import Checkbox from '@/components/ui/forms/checkbox/checkbox';
import { useRouter } from '@/compat/next-router';
import Scrollbar from '@/components/ui/scrollbar';
import { useTranslation } from 'next-i18next';
import { useManufacturers } from '@/framework/manufacturer';
import ErrorMessage from '@/components/ui/error-message';
import Spinner from '@/components/ui/loaders/spinner/spinner';
import { isEmpty } from 'lodash';
import Alert from '@/components/ui/alert';
import FilterListSearch from '@/components/search-view/filter-list-search';

interface Props {
  manufacturers: any[];
}

const ManufacturerFilterView = ({ manufacturers }: Props) => {
  const { t } = useTranslation('common');

  const router = useRouter();
  const selectedValues = useMemo(
    () =>
      router.query.manufacturer
        ? (router.query.manufacturer as string).split(',')
        : [],
    [router.query.manufacturer]
  );
  const [state, setState] = useState<string[]>(selectedValues);
  const [needle, setNeedle] = useState('');
  useEffect(() => {
    setState(selectedValues);
  }, [selectedValues]);
  const visible = useMemo(
    () =>
      needle.trim()
        ? manufacturers.filter((c) =>
            c?.name?.toLowerCase().includes(needle.trim().toLowerCase()),
          )
        : manufacturers,
    [manufacturers, needle],
  );

  function handleChange(values: string[]) {
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        manufacturer: values.join(','),
      },
    });
  }

  return (
    <div className="relative -mb-5 after:absolute after:bottom-0 after:flex after:h-6 after:w-full after:bg-gradient-to-t after:from-white ltr:after:left-0 rtl:after:right-0">
      {manufacturers.length > 8 && (
        <FilterListSearch value={needle} onChange={setNeedle} />
      )}
      <Scrollbar style={{ maxHeight: '400px' }} className="pb-6">
        <span className="sr-only">{t('text-manufacturers')}</span>
        <div className="grid grid-cols-1 gap-4">
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

const ManufacturerFilter: React.FC<{ type?: any }> = ({ type }) => {
  const { locale, query } = useRouter();
  const { manufacturers, isLoading, error } = useManufacturers({
    language: locale,
    limit: 100,
    ...(type ? { type } : { type: query?.searchType }),
  });
  if (error) return <ErrorMessage message={error.message} />;
  if (isLoading)
    return (
      <div className="flex w-full items-center justify-center py-5">
        <Spinner className="h-6 w-6" simple={true} />
      </div>
    );
  return !isEmpty(manufacturers) ? (
    <ManufacturerFilterView manufacturers={manufacturers} />
  ) : (
    <Alert message="No manufactures found." />
  );
};

export default ManufacturerFilter;
