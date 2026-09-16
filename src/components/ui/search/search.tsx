import SearchBox from '@/components/ui/search/search-box';
import { useRouter } from '@/compat/next-router';
import { useTranslation } from 'next-i18next';
import { useSearch } from './search.context';
import { useTypes } from '@/framework/type';
import { TYPES_PER_PAGE } from '@/framework/client/variables';
interface Props {
  label: string;
  className?: string;
  inputClassName?: string;
  variant?: 'minimal' | 'normal' | 'with-shadow' | 'flat';
  /** Called after a search is submitted — the header uses it to close its overlay. */
  onSubmitted?: () => void;
  [key: string]: unknown;
}

const Search: React.FC<Props> = ({
  label,
  variant,
  className,
  inputClassName,
  onSubmitted,
  ...props
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { searchTerm, updateSearchTerm } = useSearch();
  const handleOnChange = (e: any) => {
    const { value } = e.target;
    updateSearchTerm(value);
  };

  // Search results live on the vertical listing (/plants/search). This used to
  // push ?text onto whatever route it was on — from the homepage that meant
  // /?text=monstera, a hero with no results (annotation-era V1 behaviour where
  // the home page WAS the grid). Stay put only when already on a listing.
  const { types } = useTypes({ limit: TYPES_PER_PAGE } as any);
  const listingPathFor = (pathname: string) => {
    if (/^\/[^/]+\/search$/.test(pathname)) return pathname;
    const seg = pathname.split('/')[1] || '';
    const slugs = (types ?? []).map((t: any) => t.slug);
    return `/${slugs.includes(seg) ? seg : 'plants'}/search`;
  };

  const onSearch = (e: any) => {
    e.preventDefault();
    if (!searchTerm) return;
    const { pathname, query } = router;
    const target = listingPathFor(pathname);
    const { text: _stale, ...rest } = (query ?? {}) as Record<string, unknown>;
    router.push(
      {
        pathname: target,
        // keep the listing's other filters only when we are staying on it
        query: target === pathname ? { ...rest, text: searchTerm } : { text: searchTerm },
      },
      undefined,
      {
        scroll: false,
      }
    );
    onSubmitted?.();
  };

  function clearSearch() {
    updateSearchTerm('');
    const { pathname, query } = router;
    const { text, ...rest } = query;
    if (text) {
      router.push(
        {
          pathname,
          query: { ...rest },
        },
        undefined,
        {
          scroll: false,
        }
      );
    }
  }

  return (
    <SearchBox
      label={label}
      onSubmit={onSearch}
      onClearSearch={clearSearch}
      onChange={handleOnChange}
      value={searchTerm}
      name="search"
      placeholder={t('common:text-search-placeholder')}
      variant={variant}
      className={className}
      inputClassName={inputClassName}
      {...props}
    />
  );
};

export default Search;
