import Slider from '@/components/ui/forms/range-slider';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from '@/compat/next-router';
import { useTranslation } from 'next-i18next';
import { useFilterFacets } from '@/framework/product';

/** `simple` = slider + "₹min – ₹max+" readout only (the PLP rail); default keeps the histogram and From/To inputs. */
const PriceFilter = ({ type, simple = false }: { type?: string; simple?: boolean } = {}) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  // Real catalogue bounds + distribution — the hardcoded 0–2000 slider ceiling
  // hid every product above ₹2,000 from price filtering. Scoped to the vertical
  // so the histogram is the one the results beside it came from.
  const { data: facets } = useFilterFacets({ type });
  const bounds = facets?.facets?.price;
  const sliderMin = Math.floor(bounds?.min ?? 0);
  const sliderMax = Math.ceil(bounds?.max ?? 2000);
  const histogram = bounds?.histogram ?? [];
  const maxBucket = useMemo(
    () => Math.max(1, ...histogram.map((b) => b.count)),
    [histogram],
  );
  // No price in the URL = nothing filtered, so the handles sit at the real
  // bounds (the old [0, 1000] seed showed a ₹1,000 ceiling that wasn't applied).
  const selectedValues = useMemo(
    () =>
      router.query.price
        ? (router.query.price as string).split(',')
        : [sliderMin, sliderMax],
    [router.query.price, sliderMin, sliderMax]
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
      {!simple && histogram.length > 0 && (
        <div
          className="mb-1 flex h-11 items-end gap-[3px] px-0.5"
          aria-hidden
        >
          {histogram.map((b, i) => {
            const inRange =
              Number(state[0] || sliderMin) <= b.to &&
              Number(state[1] || sliderMax) >= b.from;
            return (
              <div
                key={i}
                className={
                  inRange
                    ? 'flex-1 rounded-t-[3px] bg-[#7FB07A] transition-colors'
                    : 'flex-1 rounded-t-[3px] bg-stone-200 transition-colors'
                }
                style={{ height: `${15 + Math.round((b.count / maxBucket) * 85)}%` }}
              />
            );
          })}
        </div>
      )}
      <Slider
        allowCross={false}
        range
        min={sliderMin}
        max={sliderMax}
        //@ts-ignore
        defaultValue={state}
        //@ts-ignore
        value={state}
        onChange={(value: any) => handleChange(value)}
      />
      {/* Readout: "₹0 – ₹5,000+" — the "+" says the upper handle is at the
          catalogue max, i.e. no ceiling is applied. */}
      <p className="mt-3 text-[13px] font-medium tabular-nums text-forest-900">
        ₹{Number(state[0] || sliderMin).toLocaleString('en-IN')} – ₹
        {Number(state[1] || sliderMax).toLocaleString('en-IN')}
        {Number(state[1] || sliderMax) >= sliderMax ? '+' : ''}
      </p>
      {/* Reference layout: EDITABLE From/To inputs (the boxes used to be
          display-only). Typing uses the same debounced URL push as dragging. */}
      {!simple && (
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="flex flex-col items-start rounded border border-kraft-200 bg-white p-2.5 focus-within:border-forest-900/30">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">From</span>
          <span className="flex w-full items-center text-[13px] font-bold text-forest-900">
            ₹
            <input
              type="number"
              inputMode="numeric"
              min={sliderMin}
              max={sliderMax}
              value={String(state[0])}
              onChange={(e) => handleChange([Number(e.target.value || sliderMin), Number(state[1])])}
              aria-label="Minimum price"
              className="w-full border-0 bg-transparent p-0 pl-0.5 text-[13px] font-bold text-forest-900 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </span>
        </label>
        <label className="flex flex-col rounded border border-kraft-200 bg-white p-2.5 focus-within:border-forest-900/30">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">To</span>
          <span className="flex w-full items-center text-[13px] font-bold text-forest-900">
            ₹
            <input
              type="number"
              inputMode="numeric"
              min={sliderMin}
              max={sliderMax}
              value={String(state[1])}
              onChange={(e) => handleChange([Number(state[0]), Number(e.target.value || sliderMax)])}
              aria-label="Maximum price"
              className="w-full border-0 bg-transparent p-0 pl-0.5 text-[13px] font-bold text-forest-900 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </span>
        </label>
      </div>
      )}
    </>
  );
};

export default PriceFilter;
