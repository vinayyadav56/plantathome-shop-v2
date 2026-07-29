import { useRouter } from '@/compat/next-router';
import { useFilterFacets } from '@/framework/product';
import Checkbox from '@/components/ui/forms/checkbox/checkbox';

/**
 * Botanical filter sections for the listing rail — Sunlight, Watering, Growth
 * rate, Placement (Indoor|Outdoor), Pet-friendly and Size.
 *
 * All state lives in the URL query (the rail's single source of truth), so
 * these compose with the existing shallow same-path routing: a change is one
 * `router.push` on the compat router — no server navigation, no page reload.
 *
 * Options come from GET products/filter-facets (real values + live counts,
 * junk pre-excluded server-side) — a facet section that has no values for this
 * catalogue renders nothing at all rather than an empty shell.
 */

/** Read a comma-joined multi-value URL param as an array. */
const useParamValues = (param: string): string[] => {
  const { query } = useRouter();
  const raw = query[param];
  return typeof raw === 'string' && raw.length ? raw.split(',').filter(Boolean) : [];
};

const usePushParam = () => {
  const router = useRouter();
  return (param: string, next: string[] | string | undefined) => {
    const query: Record<string, any> = { ...router.query };
    const value = Array.isArray(next) ? next.join(',') : next;
    if (value) query[param] = value;
    else delete query[param];
    router.push({ pathname: router.pathname, query });
  };
};

/** Generic facet-driven checkbox section (Sunlight / Watering / Growth). */
export function FacetFilterView({
  param,
  facetKey,
}: {
  param: 'sunlight' | 'water' | 'growth';
  facetKey: 'sunlight' | 'water_requirement' | 'growth_rate' | 'difficulty_level';
}) {
  const { data } = useFilterFacets();
  const selected = useParamValues(param);
  const push = usePushParam();
  const options = data?.facets?.[facetKey] ?? [];

  if (!options.length) return null;

  function toggle(value: string) {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    push(param, next);
  }

  return (
    <div className="flex flex-col space-y-3.5">
      {options.map((o) => (
        <div key={o.value} className="flex items-center justify-between gap-2">
          <Checkbox
            name={`${param}-${o.value}`}
            value={o.value}
            label={o.value}
            checked={selected.includes(o.value)}
            onChange={() => toggle(o.value)}
          />
          <span className="text-xs tabular-nums text-stone-400">{o.count}</span>
        </div>
      ))}
    </div>
  );
}

/** Indoor | Outdoor — the reference design's segmented two-option control. */
export function PlacementFilterView() {
  const { query } = useRouter();
  const push = usePushParam();
  const current = typeof query.placement === 'string' ? query.placement : '';

  return (
    <div
      role="group"
      aria-label="Placement"
      className="grid grid-cols-2 gap-1 rounded-full border border-forest-900/10 bg-white p-1"
    >
      {(['Indoor', 'Outdoor'] as const).map((v) => {
        const on = current === v;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={on}
            onClick={() => push('placement', on ? undefined : v)}
            className={
              on
                ? 'rounded-full bg-[#2E5E2A] px-3 py-2 text-sm font-semibold text-white transition'
                : 'rounded-full px-3 py-2 text-sm font-semibold text-body transition hover:bg-forest-900/5'
            }
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

/** Pet-friendly toggle (server coerces the boolean; unparseable is dropped). */
export function PetFriendlyFilterView() {
  const { query } = useRouter();
  const push = usePushParam();
  const { data } = useFilterFacets();
  const on = query.pet_friendly === 'true';
  const count = data?.facets?.pet_friendly?.true;

  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="flex flex-col">
        <span className="text-sm font-medium text-heading">Pet friendly only</span>
        <span className="text-xs text-body">
          Safe around cats and dogs{typeof count === 'number' ? ` · ${count} plants` : ''}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => push('pet_friendly', on ? undefined : 'true')}
        className={
          on
            ? 'relative h-6 w-11 shrink-0 rounded-full bg-[#2E5E2A] transition-colors'
            : 'relative h-6 w-11 shrink-0 rounded-full bg-stone-300 transition-colors'
        }
      >
        {/* left-0.5 is load-bearing. Without an explicit `left` an absolutely
            positioned box falls back to its STATIC position, and a button is
            text-align:center by default — so the knob started mid-track, which
            put OFF at the right edge (reading as ON) and pushed ON clean out of
            the track, leaving a solid pill with no knob at all.
            Track 44 - knob 20 - 2px inset each side = 20px of travel. */}
        <span
          className={
            on
              ? 'absolute left-0.5 top-0.5 h-5 w-5 translate-x-5 rounded-full bg-white shadow transition-transform'
              : 'absolute left-0.5 top-0.5 h-5 w-5 translate-x-0 rounded-full bg-white shadow transition-transform'
          }
        />
      </button>
    </label>
  );
}

/**
 * Size chips — the catalogue's variation axis. A stable vocabulary rather than
 * a facet (every variable product carries it), so the one hardcoded list here.
 */
const SIZES = ['Small', 'Medium', 'Large'];

export function SizeFilterView() {
  const selected = useParamValues('sizes');
  const push = usePushParam();

  function toggle(value: string) {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    push('sizes', next);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {SIZES.map((v) => {
        const on = selected.includes(v);
        return (
          <button
            key={v}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(v)}
            className={
              on
                ? 'rounded-full bg-[#EAF4EA] px-4 py-2 text-sm font-semibold text-[#2E5E2A] ring-1 ring-[#2E5E2A]/30 transition'
                : 'rounded-full border border-forest-900/10 bg-white px-4 py-2 text-sm font-semibold text-body transition hover:border-forest-900/25'
            }
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

/** Selected-value count helpers for the rail's section headers. */
export function usePlantFilterCounts() {
  const sunlight = useParamValues('sunlight').length;
  const water = useParamValues('water').length;
  const growth = useParamValues('growth').length;
  const sizes = useParamValues('sizes').length;
  const { query } = useRouter();
  const placement = typeof query.placement === 'string' && query.placement ? 1 : 0;
  const pet = query.pet_friendly === 'true' ? 1 : 0;
  return { sunlight, water, growth, sizes, placement, pet };
}
