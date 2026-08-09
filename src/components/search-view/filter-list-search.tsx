import { useTranslation } from 'next-i18next';
import { Search } from '@/components/ui/icon';

/** Inline mini-search shown above long filter checkbox lists (>8 entries) —
 *  pure client-side narrowing, no API call. */
const FilterListSearch: React.FC<{
  value: string;
  onChange: (v: string) => void;
}> = ({ value, onChange }) => {
  const { t } = useTranslation('common');
  return (
    <div className="relative mb-3">
      <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden />
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
