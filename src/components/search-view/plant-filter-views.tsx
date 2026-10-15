import { useState } from 'react';
import { useRouter } from '@/compat/next-router';
import type { DynamicFacet } from '@/types';
import { useFilterFacets } from '@/framework/product';
import Checkbox from '@/components/ui/forms/checkbox/checkbox';

/**
 * Botanical filter sections for the listing rail — Light, Watering, Growth
 * rate, Placement (Indoor|Outdoor), Pet-friendly and Plant Size — and the
 * admin-defined attribute sections every vertical gets (DynamicFacetView).
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

export const usePushParam = () => {
  const router = useRouter();
  return (param: string, next: string[] | string | undefined) => {
    const query: Record<string, any> = { ...router.query };
    const value = Array.isArray(next) ? next.join(',') : next;
    if (value) query[param] = value;
    else delete query[param];
    router.push({ pathname: router.pathname, query });
  };
};

/**
 * The `attr` param: every attribute filter outside the plants' `terms`, one group per
 * attribute code in the API's grammar — `code:slug1,slug2|code2:min-max|code3:true`
 * (OR within an attribute, AND across them; a window may be open at either end).
 */
export function parseAttr(raw: unknown): Record<string, string> {
  const groups: Record<string, string> = {};
  if (typeof raw !== 'string') return groups;
  for (const part of raw.split('|')) {
    const at = part.indexOf(':');
    if (at > 0 && at < part.length - 1) groups[part.slice(0, at)] = part.slice(at + 1);
  }
  return groups;
}

/** Groups back to the param; a code left empty is dropped ('' when none remain). */
export const formatAttr = (groups: Record<string, string>) =>
  Object.entries(groups)
    .filter(([, value]) => value)
    .map(([code, value]) => `${code}:${value}`)
    .join('|');

/** Numbers and yes/no can only be filtered through `attr`, whatever vertical sent them. */
const usesAttr = (facet: DynamicFacet) =>
  facet.param === 'attr' || Boolean(facet.range || facet.options);

/**
 * Admin-defined attribute section (Suitable Spaces, Material, Capacity, and whatever an
 * admin adds next), so a new attribute in the admin is a new filter section here with no
 * client change. That is the point of the taxonomy work: no hardcoded filter lists.
 * The plants' attributes share ONE url param — `terms` — holding term slugs; every other
 * vertical's go in `attr` (see parseAttr): options as checkboxes, numbers as a from–to
 * window, yes/no as a switch.
 */
export function DynamicFacetView({ facet }: { facet: DynamicFacet }) {
  const { query } = useRouter();
  const selectedTerms = useParamValues('terms');
  const push = usePushParam();
  const attr = usesAttr(facet);
  const groups = parseAttr(query.attr);
  const value = groups[facet.code] ?? '';
  const setValue = (next: string) => push('attr', formatAttr({ ...groups, [facet.code]: next }));

  if (attr && facet.range) return <AttrRangeView facet={facet} value={value} onChange={setValue} />;
  if (attr && facet.options) {
    const on = value === 'true';
    const n = facet.options.true;
    return (
      <ToggleRow
        title={`${facet.name} only`}
        hint={`${n} product${n === 1 ? '' : 's'}`}
        on={on}
        onToggle={() => setValue(on ? '' : 'true')}
      />
    );
  }
  if (!facet.terms.length) return null;

  const selected = attr ? value.split(',').filter(Boolean) : selectedTerms;
  const toggle = (slug: string) => {
    const next = selected.includes(slug) ? selected.filter((v) => v !== slug) : [...selected, slug];
    if (attr) setValue(next.join(','));
    else push('terms', next);
  };

  return (
    <div className="flex flex-col space-y-3.5">
      {facet.terms.map((t) => (
        <div key={t.slug} className="flex items-center justify-between gap-2">
          <Checkbox
            name={attr ? `attr-${facet.code}-${t.slug}` : `term-${t.slug}`}
            value={t.slug}
            label={t.value}
            checked={selected.includes(t.slug)}
            onChange={() => toggle(t.slug)}
          />
          <span className="text-[12.943px] leading-4 tabular-nums text-[#333333]">{t.count}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Number / range attribute (Capacity, Blade length …): a from–to window in the attribute's
 * unit, clamped to the listed products' span; an empty end stays open. Applied on Enter or
 * on leaving a field, so typing "120" does not refetch at "1" and "12".
 */
function AttrRangeView({
  facet,
  value,
  onChange,
}: {
  facet: DynamicFacet;
  value: string;
  onChange: (next: string) => void;
}) {
  const { min, max } = facet.range!;
  const [lo = '', hi = ''] = value.split('-');
  const [from, setFrom] = useState(lo);
  const [to, setTo] = useState(hi);
  // The URL wins whenever it changes (a removed chip, Clear all): reset while rendering,
  // React's pattern for state that follows a prop (no effect, no extra paint).
  const [shown, setShown] = useState(value);
  if (shown !== value) {
    setShown(value);
    setFrom(lo);
    setTo(hi);
  }

  const clamp = (v: string) =>
    v.trim() === '' || !Number.isFinite(Number(v)) ? null : Math.min(max, Math.max(min, Number(v)));
  function apply() {
    let a = clamp(from);
    let b = clamp(to);
    if (a !== null && b !== null && a > b) [a, b] = [b, a];
    // Show what is applied (clamped, in order) even when the URL does not change.
    setFrom(a === null ? '' : String(a));
    setTo(b === null ? '' : String(b));
    const next = a === null && b === null ? '' : `${a ?? ''}-${b ?? ''}`;
    if (next !== value) onChange(next);
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {(
        [
          ['From', from, setFrom, min],
          ['To', to, setTo, max],
        ] as const
      ).map(([label, v, set, bound]) => (
        <label
          key={label}
          className="flex flex-col items-start rounded border border-kraft-200 bg-white p-2.5 focus-within:border-forest-900/30"
        >
          <span className="text-[11.943px] font-semibold uppercase tracking-wide text-[#333333]">{label}</span>
          <span className="flex w-full items-center gap-1 text-[13.943px] font-bold text-[#333333]">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min={min}
              max={max}
              placeholder={String(bound)}
              value={v}
              onChange={(e) => set(e.target.value)}
              onBlur={apply}
              onKeyDown={(e) => e.key === 'Enter' && apply()}
              aria-label={`${facet.name} ${label.toLowerCase()}`}
              className="w-full min-w-0 border-0 bg-transparent p-0 text-[13.943px] font-bold text-[#333333] focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            {facet.unit && <span className="shrink-0 font-semibold text-[#333333]">{facet.unit}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}

/** Generic facet-driven checkbox section (Sunlight / Watering / Growth / Difficulty). */
export function FacetFilterView({
  param,
  facetKey,
  type,
  category,
}: {
  param: 'sunlight' | 'water' | 'growth' | 'difficulty';
  facetKey: 'sunlight' | 'water_requirement' | 'growth_rate' | 'difficulty_level';
  /** The vertical the list is scoped to — keeps counts in step with the results. */
  type?: string;
  /** Category pages: the pinned category (the rail's one facet scope). */
  category?: string;
}) {
  const { data } = useFilterFacets({ type, categories: category });
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
          <span className="text-[12.943px] leading-4 tabular-nums text-[#333333]">{o.count}</span>
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
      className="grid grid-cols-2 gap-1 rounded-full border border-kraft-200 bg-white p-1"
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
                ? 'rounded-full bg-[#2E5E2A] px-3 py-2 text-[13.943px] font-semibold text-white transition'
                : 'rounded-full px-3 py-2 text-[13.943px] font-semibold text-[#333333] transition hover:bg-forest-900/5'
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
export function PetFriendlyFilterView({ type, category }: { type?: string; category?: string } = {}) {
  const { query } = useRouter();
  const push = usePushParam();
  const { data } = useFilterFacets({ type, categories: category });
  const on = query.pet_friendly === 'true';
  const count = data?.facets?.pet_friendly?.true;

  return (
    <ToggleRow
      title="Pet friendly only"
      hint={`Safe around cats and dogs${typeof count === 'number' ? ` · ${count} plants` : ''}`}
      on={on}
      onToggle={() => push('pet_friendly', on ? undefined : 'true')}
    />
  );
}

/** A labelled on/off switch row: Pet friendly, and yes/no attributes (Foldable …). */
function ToggleRow({
  title,
  hint,
  on,
  onToggle,
}: {
  title: string;
  hint: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="flex flex-col">
        <span className="text-[13.943px] font-medium text-[#333333]">{title}</span>
        <span className="text-[12.943px] leading-4 text-[#333333]">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onToggle}
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
 * Plant Size — the catalogue's variation axis. The facets endpoint lists the
 * Size attribute's values in admin order with their `meta` descriptor
 * ("0–1 ft", shown as "Small (0–1 ft)" once the admin fills it); no counts, as
 * every listed plant carries every size. Older APIs send no `sizes` facet, so
 * the stable vocabulary stays as the fallback.
 */
const SIZES: { value: string; meta?: string | null }[] = [
  { value: 'Small' },
  { value: 'Medium' },
  { value: 'Large' },
];

export function SizeFilterView({ type, category }: { type?: string; category?: string } = {}) {
  const { data } = useFilterFacets({ type, categories: category });
  const selected = useParamValues('sizes');
  const push = usePushParam();
  const options = data?.facets?.sizes?.length ? data.facets.sizes : SIZES;

  function toggle(value: string) {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    push('sizes', next);
  }

  return (
    <div className="flex flex-col space-y-3.5">
      {options.map((o) => (
        <Checkbox
          key={o.value}
          name={`size-${o.value}`}
          value={o.value}
          label={o.meta ? `${o.value} (${o.meta})` : o.value}
          checked={selected.includes(o.value)}
          onChange={() => toggle(o.value)}
        />
      ))}
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
  const air = query.air_purifying === 'true' ? 1 : 0;
  const difficulty = useParamValues('difficulty').length;
  const terms = useParamValues('terms');
  return { sunlight, water, growth, sizes, placement, pet, air, difficulty, terms };
}

/** How many of THIS dynamic facet's values are currently selected (header badge). */
export function useDynamicFacetCount(facet: DynamicFacet): number {
  const selected = useParamValues('terms');
  const { query } = useRouter();
  if (!usesAttr(facet)) return facet.terms.filter((t) => selected.includes(t.slug)).length;
  const value = parseAttr(query.attr)[facet.code] ?? '';
  // Options count one each; a window or a switch is one filter.
  return facet.terms.length ? value.split(',').filter(Boolean).length : value ? 1 : 0;
}
