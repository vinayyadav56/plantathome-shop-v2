import { useTranslation } from 'next-i18next';

/** Inline mini-search shown above long filter checkbox lists (>8 entries) —
 *  pure client-side narrowing, no API call. */
const FilterListSearch: React.FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => {
  const { t } = useTranslation('common');
  return (
    <div className="relative mb-3">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('filter-search-placeholder') as string}
        aria-label={t('filter-search-placeholder') as string}
        className="h-9 w-full rounded-[10px] border border-forest-900/10 bg-white pe-3 ps-9 text-[13px] text-forest-900 outline-none placeholder:text-stone-400 focus:border-accent"
      />
    </div>
  );
};

export default FilterListSearch;
