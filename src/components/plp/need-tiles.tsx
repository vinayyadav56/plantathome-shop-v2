'use client';

import { useRouter } from '@/compat/next-router';
import { useFilterFacets } from '@/framework/product';
import { usePlantCollections } from '@/framework/plant-collections';
import { Bed, DeviceDesktop, Flower, Leaf, PawPrint, Sparkles, Sprout, SunLow, User } from '@/components/ui/icon';
import type { LucideIcon } from '@/components/ui/icon';
import type { FilterFacets, PlantCollection } from '@/types';

/**
 * "Shop by Need" — the admin's `plant_collections` (each a saved map of listing
 * filters) as pastel icon tiles. A tile writes exactly the URL params the
 * sidebar's checkboxes write, so a tile here and a checkbox there are one
 * filter. A tile renders only when the facets for this vertical + city prove
 * its rules match ≥ 1 listed plant; the rest appear as the catalogue is enriched.
 *
 * Props: `type` — vertical slug ('plants'); scopes the facets query.
 * Renders null when no tile is computable. The section is a named region
 * ("Shop by Need", via aria-labelledby="plp-needs") for the e2e.
 */

/** Label / icon / tint per collection slug; an unknown slug shows its admin name on sage. */
export const NEED_PRESENTATION: Record<string, { label: string; Icon: LucideIcon; tint: string }> = {
  'low-light-plants': { label: 'Low Light Rooms', Icon: SunLow, tint: 'bg-amber-50' },
  'low-maintenance-plants': { label: 'Busy People', Icon: User, tint: 'bg-sky-50' },
  'pet-friendly-plants': { label: 'Pet Friendly', Icon: PawPrint, tint: 'bg-emerald-50' },
  'bedroom-plants': { label: 'Bedrooms', Icon: Bed, tint: 'bg-rose-50' },
  'office-plants': { label: 'Workspaces', Icon: DeviceDesktop, tint: 'bg-blue-50' },
  'air-purifying-plants': { label: 'Air Purifying', Icon: Leaf, tint: 'bg-lime-50' },
  'beginner-plants': { label: 'Beginners', Icon: Sprout, tint: 'bg-teal-50' },
  'flowering-plants': { label: 'Flowering', Icon: Flower, tint: 'bg-rose-50' },
  'rare-plants': { label: 'Rare & Exotic', Icon: Sparkles, tint: 'bg-violet-50' },
};

/** URL param each rule key writes; `space` and `special` share the sidebar's `terms` list. */
const RULE_PARAM: Record<string, string> = {
  sunlight: 'sunlight',
  water: 'water',
  difficulty: 'difficulty',
  pet_friendly: 'pet_friendly',
  air_purifying: 'air_purifying',
  space: 'terms',
  special: 'terms',
  category: 'category',
};

/** Comma list → trimmed values. Also takes a repeated URL param (string[] stringifies to "a,b"). */
const list = (v: unknown): string[] =>
  String(v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const union = (a: string[], b: string[]) => [...new Set([...a, ...b])];

/** Collection rules → listing URL params (comma lists) in rule order; unknown keys are ignored. */
export function rulesToQuery(rules: PlantCollection['rules'] | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(rules ?? {})) {
    const param = RULE_PARAM[key];
    if (!param) continue;
    const merged = union(list(out[param]), list(value));
    if (merged.length) out[param] = merged.join(',');
  }
  return out;
}

/** Facet rows whose key matches any wanted value (case-insensitive), summed; 0 when nothing matches or the facet is absent. */
const matched = <R extends { count: number }>(rows: R[] | undefined, key: (r: R) => string, wanted: string[]) =>
  (rows ?? [])
    .filter((r) => wanted.some((w) => w.toLowerCase() === key(r).toLowerCase()))
    .reduce((n, r) => n + r.count, 0);

/** How many listed plants one URL param's value matches, read from the facets. */
function paramCount(facets: FilterFacets['facets'], param: string, value: string): number {
  const wanted = list(value);
  switch (param) {
    case 'sunlight':
      return matched(facets.sunlight, (r) => r.value, wanted);
    case 'water':
      return matched(facets.water_requirement, (r) => r.value, wanted);
    case 'difficulty':
      return matched(facets.difficulty_level, (r) => r.value, wanted);
    case 'pet_friendly':
      return facets.pet_friendly?.true ?? 0;
    case 'air_purifying':
      return facets.air_purifying?.true ?? 0;
    case 'terms':
      return matched((facets.dynamic ?? []).flatMap((d) => d.terms ?? []), (r) => r.slug, wanted);
    case 'category':
      return matched(facets.categories, (r) => r.slug, wanted);
    default:
      return 0;
  }
}

/** A collection's count: the smallest of its params' counts (rules AND together); 0 when it has no usable rule. */
export function tileCount(facets: FilterFacets['facets'], params: Record<string, string>): number {
  const entries = Object.entries(params);
  return entries.length ? Math.min(...entries.map(([p, v]) => paramCount(facets, p, v))) : 0;
}

const TILE =
  'flex h-[64px] min-w-[136px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg px-3 transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-forest-700 aria-pressed:ring-2 aria-pressed:ring-inset aria-pressed:ring-forest-700';

export default function NeedTiles({ type }: { type: string }) {
  const { collections } = usePlantCollections();
  const { data } = useFilterFacets({ type });
  const router = useRouter();
  const facets = data?.facets;
  if (!facets) return null;

  const tiles = collections
    .map((c) => ({ c, params: rulesToQuery(c.rules) }))
    .filter(({ params }) => tileCount(facets, params) > 0);
  if (!tiles.length) return null;

  const inUrl = (param: string) => list(router.query[param]);
  const isOn = (params: Record<string, string>) =>
    Object.entries(params).every(([p, v]) => list(v).every((x) => inUrl(p).includes(x)));

  // One push for all of a collection's params (the sidebar's usePushParam spreads
  // the per-render router.query, so two sequential calls would drop the first
  // param). Same {pathname, query} shape, so the compat router strips route
  // params the same way; on a clean /plants the first rule param leads the query.
  const toggle = (params: Record<string, string>) => {
    const on = isOn(params);
    const query: Record<string, string | string[]> = { ...router.query };
    for (const [param, value] of Object.entries(params)) {
      const wanted = list(value);
      const next = on ? inUrl(param).filter((v) => !wanted.includes(v)) : union(inUrl(param), wanted);
      if (next.length) query[param] = next.join(',');
      else delete query[param];
    }
    router.push({ pathname: router.pathname, query });
    document.getElementById('grid')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section aria-labelledby="plp-needs">
      <h2 id="plp-needs" className="mb-3 text-[18px] font-bold leading-tight text-forest-900">
        Shop by Need
      </h2>
      <div className="pah-chip-row flex gap-3 overflow-x-auto lg:flex-wrap lg:overflow-visible">
        {tiles.map(({ c, params }) => {
          const { label, Icon, tint } = NEED_PRESENTATION[c.slug] ?? { label: c.name, Icon: Leaf, tint: 'bg-sage-50' };
          return (
            <button
              key={c.slug}
              type="button"
              aria-pressed={isOn(params)}
              onClick={() => toggle(params)}
              className={`${TILE} ${tint}`}
            >
              <Icon size={24} className="text-forest-700" aria-hidden />
              <span className="whitespace-nowrap text-[13px] font-semibold leading-none text-forest-900">{label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
