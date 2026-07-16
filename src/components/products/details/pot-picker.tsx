import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { useQuery } from 'react-query';
import { HttpClient } from '@/framework/client/http-client';

/**
 * "Choose your pot" — pots are REAL products (pots-planters vertical), not a
 * price-delta attribute: picking one adds it to the cart as its own line item
 * (the API stays untouched; checkout re-prices every line server-side).
 *
 *  - the pot list is SIZE-MATCHED: only pots with a variation option for the
 *    plant's selected size are shown, at that size's price
 *  - material chips (Ceramic / Wooden / Plastic …) come from the pot products'
 *    categories — data-driven, never hardcoded
 *
 * The With/Without cards reuse the P8 card visual so the PDP stays V1-styled.
 */

export type SelectedPot = {
  product: any;
  option: any; // the size-matched variation_option row
};

type Props = {
  /** The plant's currently selected Size value (e.g. "Small"), or null. */
  plantSize: string | null;
  /** The plant's first size option — pots default to this until a size is picked. */
  fallbackSize?: string | null;
  selected: SelectedPot | null;
  onSelect: (pot: SelectedPot | null) => void;
};

/** The list endpoint strips relations, so hydrate each pot via its detail GET
 *  (has variation_options + categories). One cached query, fetched lazily. */
const fetchPots = async () => {
  const list = await HttpClient.get<any>('products', {
    search: 'type.slug:pots-planters',
    limit: 30,
  });
  const rows: any[] = list?.data ?? (Array.isArray(list) ? list : []);
  const details = await Promise.all(
    rows.map((r) => HttpClient.get<any>(`products/${r.slug}`).catch(() => null)),
  );
  return details.filter((p) => p && (p.variation_options ?? []).length);
};

const materialLabel = (pot: any): string => {
  const cat = (pot.categories ?? [])[0];
  if (!cat?.name) return 'Pot';
  return String(cat.name).replace(/\s*pots?\s*$/i, '');
};

/** The pot's variation option matching the plant's size (enabled ones only). */
const sizeOption = (pot: any, size: string | null) =>
  size
    ? (pot.variation_options ?? []).find(
        (o: any) =>
          !o.is_disable &&
          (o.options ?? []).some((v: any) => v.name === 'Size' && v.value === size),
      )
    : null;

const rupees = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;
const optPrice = (o: any) => Number(o?.sale_price ? o.sale_price : o?.price ?? 0);

const PotPicker: React.FC<Props> = ({ plantSize, fallbackSize = null, selected, onSelect }) => {
  const [withPot, setWithPot] = useState(false);
  const [material, setMaterial] = useState<string>('All');

  // Show pots for the plant's first size until the customer picks one — an
  // empty rail behind a one-line hint read as "broken".
  const effectiveSize = plantSize ?? fallbackSize;

  const { data: pots = [], isLoading } = useQuery<any[]>(['pot-picker-pots'], fetchPots, {
    enabled: withPot,
    staleTime: 5 * 60 * 1000,
  });

  const materials = useMemo(() => {
    const set = new Set<string>();
    for (const p of pots) set.add(materialLabel(p));
    return ['All', ...Array.from(set)];
  }, [pots]);

  // Pots that exist in the effective size, with that size's price.
  const matched = useMemo(
    () =>
      pots
        .map((p) => ({ product: p, option: sizeOption(p, effectiveSize) }))
        .filter((m) => m.option)
        .filter((m) => material === 'All' || materialLabel(m.product) === material),
    [pots, effectiveSize, material],
  );

  // Plant size changed → re-match the chosen pot to the new size (or drop it
  // if that pot doesn't come in the new size).
  useEffect(() => {
    if (!selected) return;
    const opt = sizeOption(selected.product, effectiveSize);
    if (!opt) onSelect(null);
    else if (opt.id !== selected.option?.id) onSelect({ product: selected.product, option: opt });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSize]);

  const choose = (mode: 'without' | 'with') => {
    setWithPot(mode === 'with');
    if (mode === 'without') onSelect(null);
  };

  return (
    <div className="mt-6">
      <p className="mb-3 text-base font-semibold capitalize text-forest-900">Choose your pot</p>
      <div className="grid max-w-sm grid-cols-2 gap-3">
        {/* Without Pot */}
        <button
          type="button"
          onClick={() => choose('without')}
          className={classNames(
            'flex items-center gap-2 rounded-2xl border-2 px-3 py-2 text-left transition',
            !withPot
              ? 'border-forest-700 bg-forest-700/[0.06] shadow-[0_4px_14px_rgba(22,48,26,0.10)]'
              : 'border-kraft-300 bg-white hover:border-forest-500',
          )}
        >
          <span className={classNames('grid h-7 w-7 shrink-0 place-items-center rounded-full', !withPot ? 'bg-forest-700 text-white' : 'bg-sage-100 text-forest-700')}>
            {/* bare roots */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 13V7" /><path d="M12 7c0-2 1.5-3.5 4-4-.3 2.5-1.8 4-4 4Z" /><path d="M12 9c0-1.6-1.2-2.8-3.2-3.2.2 2 1.4 3.2 3.2 3.2Z" /><path d="M12 13c0 2-1 4-2.5 5.5M12 13c0 2 1 4 2.5 5.5M12 13v7" /></svg>
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[13px] font-semibold text-forest-900">Without Pot</span>
            <span className="block truncate text-[11px] font-medium text-forest-600">Included</span>
          </span>
          {!withPot && (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-forest-700"><path d="m5 13 4 4L19 7" /></svg>
          )}
        </button>

        {/* With Pot */}
        <button
          type="button"
          onClick={() => choose('with')}
          className={classNames(
            'flex items-center gap-2 rounded-2xl border-2 px-3 py-2 text-left transition',
            withPot
              ? 'border-forest-700 bg-forest-700/[0.06] shadow-[0_4px_14px_rgba(22,48,26,0.10)]'
              : 'border-kraft-300 bg-white hover:border-forest-500',
          )}
        >
          <span className={classNames('grid h-7 w-7 shrink-0 place-items-center rounded-full', withPot ? 'bg-forest-700 text-white' : 'bg-sage-100 text-forest-700')}>
            {/* plant in pot */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 11V6" /><path d="M12 6c0-2 1.5-3.5 4-4-.3 2.5-1.8 4-4 4Z" /><path d="M12 8c0-1.6-1.2-2.8-3.2-3.2.2 2 1.4 3.2 3.2 3.2Z" /><path d="M5 11h14l-1 4a4 4 0 0 1-4 3h-4a4 4 0 0 1-4-3l-1-4Z" /></svg>
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[13px] font-semibold text-forest-900">With Pot</span>
            <span className="block truncate text-[11px] font-medium text-forest-600">
              {selected ? `+${rupees(optPrice(selected.option))}` : 'Pick a pot'}
            </span>
          </span>
          {withPot && (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-forest-700"><path d="m5 13 4 4L19 7" /></svg>
          )}
        </button>
      </div>

      {withPot && (
        <div className="mt-4">
          {!effectiveSize ? (
            <p className="text-[13px] text-forest-600">
              Select a plant size above to see pots that fit it.
            </p>
          ) : (
            <>
              {/* material chips — from the pots' own categories */}
              <div className="mb-3 flex flex-wrap gap-2">
                {materials.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMaterial(m)}
                    className={classNames(
                      'rounded-full border px-4 py-1.5 text-[13px] font-medium transition',
                      material === m
                        ? 'border-forest-700 bg-forest-700 text-white'
                        : 'border-kraft-300 bg-transparent text-forest-900 hover:border-forest-500',
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {!plantSize && (
                <p className="mb-2 text-[12px] text-forest-600">
                  Showing {effectiveSize} pots — pick a plant size above to match yours.
                </p>
              )}

              {/* size-matched pots, horizontal scroll */}
              {isLoading ? (
                <div className="-mx-1 flex gap-3 overflow-x-hidden px-1 pb-2" aria-label="Loading pots">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className="w-36 shrink-0 animate-pulse rounded-2xl border-2 border-kraft-300 bg-white p-2">
                      <span className="block h-24 w-full rounded-xl bg-sage-100" />
                      <span className="mt-2 block h-3 w-24 rounded bg-sage-100" />
                      <span className="mt-1.5 block h-3 w-14 rounded bg-sage-100" />
                    </span>
                  ))}
                </div>
              ) : matched.length === 0 ? (
                <p className="text-[13px] text-forest-600">
                  No {material === 'All' ? '' : material.toLowerCase() + ' '}pots available in {effectiveSize} right now.
                </p>
              ) : (
                <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
                  {matched.map(({ product, option }) => {
                    const active = selected?.product?.id === product.id;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => onSelect(active ? null : { product, option })}
                        className={classNames(
                          'w-36 shrink-0 rounded-2xl border-2 p-2 text-left transition',
                          active
                            ? 'border-forest-700 bg-forest-700/[0.06] shadow-[0_4px_14px_rgba(22,48,26,0.10)]'
                            : 'border-kraft-300 bg-white hover:border-forest-500',
                        )}
                      >
                        <span className="relative block">
                          <img
                            src={product.image?.thumbnail || product.image?.original}
                            alt={product.name}
                            className="h-24 w-full rounded-xl object-cover"
                            loading="lazy"
                          />
                          {active && (
                            <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-forest-700 text-white">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7" /></svg>
                            </span>
                          )}
                        </span>
                        <span className="mt-2 block text-[12.5px] font-semibold leading-snug text-forest-900 line-clamp-2">
                          {product.name}
                        </span>
                        <span className="mt-0.5 flex items-center justify-between">
                          <span className="text-[13px] font-bold text-forest-900">{rupees(optPrice(option))}</span>
                          <span className="text-[10.5px] font-medium uppercase tracking-wide text-forest-600">
                            {materialLabel(product)} · {effectiveSize}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PotPicker;
