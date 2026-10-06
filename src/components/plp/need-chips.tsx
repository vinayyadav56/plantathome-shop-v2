'use client';

import { useRouter } from '@/compat/next-router';
import { useFilterFacets } from '@/framework/product';
import { usePushParam } from '@/components/search-view/plant-filter-views';
import { Droplet, Home, Leaf, PawPrint, Sprout, SunHigh } from '@/components/ui/icon';
import type { FilterFacets } from '@/types';

/**
 * "Shop by need" — nothing invented: every chip is a facet VALUE the API
 * returned for this vertical and city, with its live count. Groups map 1:1 to
 * the rail's filter sections and write the same URL params, so a chip here and
 * a checkbox there are the same filter. Groups with no values render nothing.
 *
 * Chips scroll the shopper to the grid, because on a phone the grid starts a
 * screen below and a filter that changes nothing in view reads as broken.
 */

type Chip = { value: string; label: string; count: number };
type Group = {
  key: string;
  title: string;
  param: 'sunlight' | 'placement' | 'pet_friendly' | 'water' | 'difficulty' | 'terms';
  /** placement and pet_friendly are single-valued params; the rest are comma lists. */
  multi: boolean;
  Icon: typeof SunHigh;
  chips: Chip[];
};

const top = (rows: { value: string; count: number }[] | undefined, n = 4): Chip[] =>
  (rows ?? [])
    .filter((r) => r && r.count > 0 && r.value)
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
    .map((r) => ({ value: r.value, label: r.value, count: r.count }));

function groupsFrom(facets: FilterFacets['facets'] | undefined): Group[] {
  if (!facets) return [];
  const groups: Group[] = [
    { key: 'light', title: 'Light', param: 'sunlight', multi: true, Icon: SunHigh, chips: top(facets.sunlight) },
    { key: 'place', title: 'Place', param: 'placement', multi: false, Icon: Home, chips: top(facets.indoor_outdoor, 3) },
    {
      key: 'pet',
      title: 'Pets',
      param: 'pet_friendly',
      multi: false,
      Icon: PawPrint,
      chips: facets.pet_friendly?.true > 0 ? [{ value: 'true', label: 'Pet-safe', count: facets.pet_friendly.true }] : [],
    },
    { key: 'water', title: 'Water', param: 'water', multi: true, Icon: Droplet, chips: top(facets.water_requirement) },
    { key: 'care', title: 'Care', param: 'difficulty', multi: true, Icon: Sprout, chips: top(facets.difficulty_level) },
    // Admin-defined characteristics (Suitable Spaces, Special Characteristics…):
    // one group per definition, all sharing the `terms` param.
    ...(facets.dynamic ?? []).map((d) => ({
      key: `dyn-${d.slug}`,
      title: d.name,
      param: 'terms' as const,
      multi: true,
      Icon: Leaf,
      chips: (d.terms ?? [])
        .filter((t) => t.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((t) => ({ value: t.slug, label: t.value, count: t.count })),
    })),
  ];
  return groups.filter((g) => g.chips.length > 0);
}

export default function NeedChips({ type }: { type: string }) {
  const { data } = useFilterFacets({ type });
  const { query } = useRouter();
  const push = usePushParam();
  const groups = groupsFrom(data?.facets);
  if (!groups.length) return null;

  const selectedIn = (param: string): string[] => {
    const raw = query[param];
    return typeof raw === 'string' && raw.length ? raw.split(',').filter(Boolean) : [];
  };

  const toggle = (g: Group, chip: Chip) => {
    const current = selectedIn(g.param);
    const on = current.includes(chip.value);
    if (g.multi) {
      push(g.param, on ? current.filter((v) => v !== chip.value) : [...current, chip.value]);
    } else {
      push(g.param, on ? undefined : chip.value);
    }
    // Let the URL settle, then bring the results into view.
    requestAnimationFrame(() => {
      document.getElementById('grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <section aria-labelledby="plp-needs" className="mt-10 sm:mt-12">
      <h2 id="plp-needs" className="mb-4 font-heading text-[26px] font-medium leading-none tracking-[-0.01em] text-forest-900 sm:mb-5 sm:text-[32px]">
        Shop by need
      </h2>
      <div className="space-y-3">
        {groups.map((g) => {
          const selected = selectedIn(g.param);
          const I = g.Icon;
          return (
            <div key={g.key} className="flex items-start gap-3">
              <span className="mt-1.5 inline-flex w-[72px] shrink-0 items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-stone-500 sm:w-[96px]">
                <I size={14} className="text-forest-700" aria-hidden />
                <span className="truncate">{g.title}</span>
              </span>
              <ul className="pah-chip-row -mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 pb-1">
                {g.chips.map((chip) => {
                  const on = selected.includes(chip.value);
                  return (
                    <li key={chip.value} className="shrink-0">
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(g, chip)}
                        className={
                          on
                            ? 'inline-flex items-center gap-1.5 rounded-full bg-forest-700 px-3.5 py-2 text-[13px] font-semibold text-white shadow-box transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2'
                            : 'inline-flex items-center gap-1.5 rounded-full border border-kraft-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-forest-900 transition hover:border-forest-400 hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2'
                        }
                      >
                        {chip.label}
                        <span className={on ? 'tabular-nums text-white/70' : 'tabular-nums text-stone-400'}>{chip.count}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
