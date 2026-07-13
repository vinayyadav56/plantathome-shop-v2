import { useRouter } from '@/compat/next-router';
import { useTranslation } from 'next-i18next';

/** One removable chip per active filter value, derived straight from the URL
 *  query (the single source of filter state). Removing a chip strips just that
 *  value from its param; the empty param is dropped entirely. */

type Chip = { param: string; value: string; label: string };

const prettify = (slug: string) =>
  slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');

const AppliedFilters: React.FC = () => {
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
  if (typeof router.query.text === 'string' && router.query.text.length) {
    chips.push({ param: 'text', value: router.query.text, label: `“${router.query.text}”` });
  }

  if (!chips.length) return null;

  function removeChip(chip: Chip) {
    const query: Record<string, any> = { ...router.query };
    if (chip.param === 'price' || chip.param === 'text') {
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
    <div className="border-b border-forest-900/10 px-5 py-4">
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-3 w-3" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default AppliedFilters;
