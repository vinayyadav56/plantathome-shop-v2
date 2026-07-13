import type { Category, CategoryPaginator, CategoryQueryOptions } from '@/types';
import { useInfiniteQuery, useQuery } from 'react-query';
import client from './client';
import { API_ENDPOINTS } from './client/api-endpoints';
import { mapPaginatorData } from '@/framework/utils/data-mappers';
import { useRouter } from '@/compat/next-router';

export function useCategory({ slug }: { slug: string }) {
  const { locale } = useRouter();

  const { data, isLoading, error } = useQuery<Category, Error>(
    [`${API_ENDPOINTS.CATEGORIES}/${slug}`, { language: locale }],
    () => client.categories.get({ slug, language: locale as string }),
    { enabled: Boolean(slug) },
  );

  return {
    category: data,
    isLoading,
    error,
  };
}

export function useCategories(options?: Partial<CategoryQueryOptions>) {
  const { locale } = useRouter();

  const formattedOptions = {
    ...options,
    language: locale,
  };

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery<CategoryPaginator, Error>(
    [API_ENDPOINTS.CATEGORIES, formattedOptions],
    ({ queryKey, pageParam }) =>
      client.categories.all(Object.assign({}, queryKey[1], pageParam)),
    {
      getNextPageParam: ({ current_page, last_page }) =>
        last_page > current_page && { page: current_page + 1 },
    },
  );

  function handleLoadMore() {
    fetchNextPage();
  }

  return {
    categories: data?.pages?.flatMap((page) => page?.data ?? []).filter(Boolean) ?? [],
    paginatorInfo: Array.isArray(data?.pages)
      ? mapPaginatorData(data?.pages[data.pages.length - 1])
      : null,
    isLoading,
    error,
    isFetching,
    isLoadingMore: isFetchingNextPage,
    loadMore: handleLoadMore,
    hasMore: Boolean(hasNextPage),
  };
}
