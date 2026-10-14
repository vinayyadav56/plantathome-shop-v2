import { useRouter } from '@/compat/next-router';
import { useTranslation } from 'next-i18next';
import { X } from '@/components/ui/icon';
import type { DynamicFacet } from '@/types';
import { formatAttr, parseAttr } from '@/components/search-view/plant-filter-views';

/** One removable chip per active filter value, derived straight from the URL
 *  query (the single source of filter state). Removing a chip strips just that
 *  value from its param; the empty param is dropped entirely. */

/** `next`: attr chips carry what the `attr` param becomes without them. */
type Chip = { param: string; value: string; label: string; next?: string };

const prettify = (slug: string) =>
  slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');

/** "2-5" → "2–5 L", "2-" → "≥ 2 L", "-5" → "≤ 5 L". */
const windowLabel = (raw: string, unit?: string | null) => {
  const [lo, hi] = raw.split('-');
  const u = unit ? ` ${unit}` : '';
  return lo && hi ? `${lo}–${hi}${u}` : lo ? `≥ ${lo}${u}` : `≤ ${hi}${u}`;
};

/** `facets`: the rail's attribute facets, which name the `attr` chips ("Material: Steel"). */
const AppliedFilters: React.FC<{ facets?: DynamicFacet[] }> = ({ facets = [] }) => {
  const { t } = useTranslation('common');
  const router = useRouter();

  const chips: Chip[] = [];
  (['category', 'tags', 'manufacturer'] as const).forEach((param) => {
    const raw = router.query[param];
    if (typeof raw === 'string' && raw.length) {
      raw
        .split(',')
        .filter(Boolean)
        .forEach((value) =>
          chips.push({ param, value, label: prettify(value) }),
        );
    }
  });
  // Botanical filters: facet values are already display-cased ("Bright
  // Indirect"), so no prettify; sizes/placement likewise.
  (['sunlight', 'water', 'growth', 'sizes', 'difficulty'] as const).forEach((param) => {
    const raw = router.query[param];
    if (typeof raw === 'string' && raw.length) {
      raw
        .split(',')
        .filter(Boolean)
        .forEach((value) => chips.push({ param, value, label: value }));
    }
  });
  // Admin-defined characteristics travel as term SLUGS in one param.
  if (typeof router.query.terms === 'string' && router.query.terms.length) {
    router.query.terms
      .split(',')
      .filter(Boolean)
      .forEach((value) => chips.push({ param: 'terms', value, label: prettify(value) }));
  }
  // Every other attribute rides in `attr`: a chip per picked option ("Material: Steel"),
  // one per number window ("Capacity: 2–5 L") or switch ("Foldable"). An attribute the
  // facets do not list (not loaded yet, or an old link) still gets a removable chip.
  const attr = parseAttr(router.query.attr);
  Object.entries(attr).forEach(([code, raw]) => {
    const facet = facets.find((f) => f.code === code);
    const name = facet?.name ?? prettify(code);
    const without = (value: string) => formatAttr({ ...attr, [code]: value });
    if (facet?.terms.length) {
      const picked = raw.split(',').filter(Boolean);
      picked.forEach((slug) =>
        chips.push({
          param: 'attr',
          value: `${code}:${slug}`,
          label: `${name}: ${facet.terms.find((term) => term.slug === slug)?.value ?? prettify(slug)}`,
          next: without(picked.filter((s) => s !== slug).join(',')),
        }),
      );
      return;
    }
    let label = `${name}: ${raw}`;
    if (facet?.range) label = `${name}: ${windowLabel(raw, facet.unit)}`;
    else if (facet?.options) label = raw === 'true' ? name : `${name}: No`;
    chips.push({ param: 'attr', value: code, label, next: without('') });
  });
  if (typeof router.query.placement === 'string' && router.query.placement) {
    chips.push({ param: 'placement', value: router.query.placement, label: router.query.placement });
  }
  if (router.query.pet_friendly === 'true') {
    chips.push({ param: 'pet_friendly', value: 'true', label: 'Pet friendly' });
  }
  if (router.query.air_purifying === 'true') {
    chips.push({ param: 'air_purifying', value: 'true', label: 'Air purifying' });
  }
  if (typeof router.query.price === 'string' && router.query.price.length) {
    const [min, max] = router.query.price.split(',');
    chips.push({
      param: 'price',
      value: router.query.price,
      label: `₹${Number(min || 0).toLocaleString('en-IN')} – ₹${Number(
        max || 0,
      ).toLocaleString('en-IN')}`,
    });
  }
  // NO chip for `text`: the search input right below already shows the term
  // with its own clear ×, so a chip would put two × marks for one filter
  // (user-reported "double cross marks").

  if (!chips.length) return null;

  function removeChip(chip: Chip) {
    const query: Record<string, any> = { ...router.query };
    if (chip.param === 'attr') {
      if (chip.next) query.attr = chip.next;
      else delete query.attr;
    } else if (['price', 'text', 'placement', 'pet_friendly', 'air_purifying'].includes(chip.param)) {
      delete query[chip.param];
    } else {
      const rest = String(query[chip.param])
        .split(',')
        .filter((v) => v && v !== chip.value);
      if (rest.length) query[chip.param] = rest.join(',');
      else delete query[chip.param];
    }
    router.push({ pathname: router.pathname, query });
  }

  return (
    <div className="border-b border-kraft-200 px-5 py-4">
      <span className="sr-only">{t('filter-applied')}</span>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span
            key={`${chip.param}:${chip.value}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-sage-100 py-1.5 pe-2 ps-3 text-[12.5px] font-semibold text-forest-900"
          >
            {chip.label}
            <button
              type="button"
              onClick={() => removeChip(chip)}
              aria-label={`${t('filter-remove')} ${chip.label}`}
              className="grid h-[18px] w-[18px] place-items-center rounded-full text-forest-900/60 transition hover:bg-forest-900/10 hover:text-forest-900"
            >
              <X size={12} aria-hidden />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default AppliedFilters;
