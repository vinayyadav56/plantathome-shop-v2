import Slider from '@/components/ui/forms/range-slider';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from '@/compat/next-router';
import { useTranslation } from 'next-i18next';

const defaultPriceRange = [0, 1000];
const formatInr = (v: number | string) =>
  `₹${Number(v || 0).toLocaleString('en-IN')}`;

const PriceFilter = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const selectedValues = useMemo(
    () =>
      router.query.price
        ? (router.query.price as string).split(',')
        : defaultPriceRange,
    [router.query.price]
  );
  const [state, setState] = useState<number[] | string[]>(selectedValues);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setState(selectedValues);
  }, [selectedValues]);
  useEffect(() => () => clearTimeout(pushTimer.current), []);

  // Update the labels instantly while dragging; debounce the URL push (each
  // push re-runs the products query) so the grid doesn't refetch per tick.
  function handleChange(value: number[]) {
    setState(value);
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      router.push({
        pathname: router.pathname,
        query: {
          ...router.query,
          price: value.join(','),
        },
      });
    }, 350);
  }

  return (
    <>
      <span className="sr-only">{t('text-sort-by-price')}</span>
      <Slider
        allowCross={false}
        range
        min={0}
        max={2000}
        //@ts-ignore
        defaultValue={state}
        //@ts-ignore
        value={state}
        onChange={(value: any) => handleChange(value)}
      />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex flex-col items-start rounded-[10px] border border-forest-900/10 bg-white p-2.5">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Min</label>
          <span className="text-sm font-bold text-forest-900">{formatInr(state[0])}</span>
        </div>
        <div className="flex flex-col rounded-[10px] border border-forest-900/10 bg-white p-2.5">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Max</label>
          <span className="text-sm font-bold text-forest-900">{formatInr(state[1])}</span>
        </div>
      </div>
    </>
  );
};

export default PriceFilter;
