import Scrollbar from '@/components/ui/scrollbar';
import Select from '@/components/ui/select/select';
import { RadioGroup } from '@headlessui/react';
import { useRouter } from '@/compat/next-router';
import { useTranslation } from 'next-i18next';
import { useIsRTL } from '@/lib/locals';
interface Plan {
  id: number | string;
  key: string;
  label: string;
  value: string;
  orderBy: string;
  sortedBy: 'ASC' | 'DESC';
}
const plans: Plan[] = [
  {
    id: '1',
    key: 'sorting',
    label: 'New Released',
    value: 'created_at',
    orderBy: 'created_at',
    sortedBy: 'DESC',
  },
  {
    // sold_quantity is a real column, kept current by the inventory listeners
    // on every order — the one "popular" signal the catalogue actually has.
    id: '4',
    key: 'sorting',
    label: 'Popular',
    value: 'sold_quantity',
    orderBy: 'sold_quantity',
    sortedBy: 'DESC',
  },
  {
    id: '2',
    key: 'sorting',
    label: 'Sort by Price: Low to High',
    value: 'min_price',
    orderBy: 'min_price',
    sortedBy: 'ASC',
  },
  {
    id: '3',
    key: 'sorting',
    label: 'Sort by Price: High to Low',
    value: 'max_price',
    orderBy: 'max_price',
    sortedBy: 'DESC',
  },
];

type Props = {
  variant?: 'radio' | 'dropdown';
  /** The page's own default sort (what the list shows with no `orderBy` in the
   *  URL) — the PLP lists Popular by default, /c and search New Released. */
  defaultOrderBy?: string;
  /** Compact 36px dropdown control (the PLP toolbar). */
  compact?: boolean;
};

const Sorting: React.FC<Props> = ({ variant = 'radio', defaultOrderBy, compact }) => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { isRTL } = useIsRTL();
  // Derived from the URL on every render — the URL is the one source of sort
  // state. The old local copy was seeded once (`defaultValue`), so a sort set by
  // a chip, a back-navigation or "Clear all" left the dropdown showing stale text.
  const selected =
    plans.find((plan) => plan.orderBy === router.query.orderBy) ??
    plans.find((plan) => plan.orderBy === defaultOrderBy) ??
    plans[0];

  function handleChange(values: Plan) {
    const { orderBy, sortedBy } = values;
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        orderBy,
        sortedBy,
      },
    });
  }

  return (
    <>
      {variant === 'dropdown' && (
        <Select
          value={selected}
          isRtl={isRTL}
          options={plans}
          isSearchable={false}
          // @ts-ignore
          compact={compact}
          // @ts-ignore
          onChange={handleChange}
        />
      )}
      {variant === 'radio' && (
        <Scrollbar style={{ maxHeight: '400px' }}>
          <RadioGroup value={selected} onChange={handleChange}>
            <RadioGroup.Label className="sr-only">
              {t('text-sort')}
            </RadioGroup.Label>
            <div className="space-y-4">
              {plans.map((plan) => (
                <RadioGroup.Option key={plan.id} value={plan}>
                  {({ checked }) => (
                    <>
                      <div className="flex w-full cursor-pointer items-center">
                        <span
                          className={`h-[18px] w-[18px] rounded-full bg-white ltr:mr-3 rtl:ml-3 ${
                            checked
                              ? 'border-[5px] border-[#175840]'
                              : 'border border-[#175840]'
                          }`}
                        />
                        <RadioGroup.Label
                          as="p"
                          className={`text-[13px] ${
                            checked ? 'font-medium text-forest-900' : 'text-body'
                          }`}
                        >
                          {plan.label}
                        </RadioGroup.Label>
                      </div>
                    </>
                  )}
                </RadioGroup.Option>
              ))}
            </div>
          </RadioGroup>
        </Scrollbar>
      )}
    </>
  );
};

export default Sorting;
