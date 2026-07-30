import { useTranslation } from 'next-i18next';
import { useEffect, useRef } from 'react';
import cn from 'classnames';
import Button from '@/components/ui/button';
import ProductLoader from '@/components/ui/loaders/product-loader';
import { EmptyProducts } from '@/components/ui/empty-products';
import rangeMap from '@/lib/range-map';
import ProductCard from '@/components/products/cards/card';
import ErrorMessage from '@/components/ui/error-message';
import { useProducts } from '@/framework/product';
import { PRODUCTS_PER_PAGE } from '@/framework/client/variables';
import type { Product } from '@/types';

interface Props {
  limit?: number;
  sortedBy?: string;
  orderBy?: string;
  column?: 'five' | 'six' | 'auto' | 'list';
  shopId?: string;
  gridClassName?: string;
  products: Product[] | undefined;
  isLoading?: boolean;
  error?: any;
  loadMore?: any;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  className?: string;
  categoryName?: string;
}

export function Grid({
  className,
  gridClassName,
  products,
  isLoading,
  error,
  loadMore,
  isLoadingMore,
  hasMore,
  limit = PRODUCTS_PER_PAGE,
  column = 'auto',
  categoryName,
}: Props) {
  const { t } = useTranslation('common');
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Flipkart/Amazon-style infinite scroll: auto-fetch the next page when the
  // sentinel nears the viewport (~one screen early, ≈80% scroll). The visible
  // "Load more" button stays as a keyboard/no-IntersectionObserver fallback.
  useEffect(() => {
    if (!hasMore || isLoadingMore || typeof loadMore !== 'function') return;
    const el = loadMoreRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  if (error) return <ErrorMessage message={error.message} />;

  if (!isLoading && !products?.length) {
    return (
      <div className="w-full min-h-full px-4 pt-6 pb-8 lg:p-8">
        <EmptyProducts categoryName={categoryName} />
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          {
            // Two-up on phones too. The note that used to live here said a 2-up
            // grid "truncates everything" because the card's type was specced
            // for a full-width mobile card — that predates the card gaining
            // [container-type:inline-size], which makes every size inside it a
            // cqw clamp against the CARD's width. Halve the card and the name,
            // price, chips and badges scale themselves.
            'grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] sm:gap-4':
              column === 'auto',
            'grid grid-cols-2 gap-3 gap-y-5 sm:gap-4 md:gap-5 md:gap-y-8 min-[900px]:grid-cols-3 lg:gap-6 xl:grid-cols-4':
              column === 'five' || column === 'six',
            // List view: one full-width row per product. The card lays itself
            // out horizontally off its own `layout` prop.
            'flex flex-col gap-4': column === 'list',
          },
          gridClassName,
        )}
      >
        {isLoading && !products?.length
          ? rangeMap(limit, (i) => (
              <ProductLoader key={i} uniqueKey={`product-${i}`} />
            ))
          : products?.map((product, index) => (
              <ProductCard
                product={product}
                key={product.id}
                // mark the first row's images as LCP candidates so next/image
                // preloads them (clears the dev "detected as LCP" hint + helps
                // Core Web Vitals); the desktop grid is up to 4-up, so cover the
                // whole first row. Deeper images stay lazy.
                priority={index < 4}
                layout={column === 'list' ? 'list' : 'grid'}
              />
            ))}
      </div>
      {hasMore && (
        <div
          ref={loadMoreRef}
          className="flex justify-center mt-8 mb-4 sm:mb-6 lg:mb-2 lg:mt-12"
        >
          <Button
            loading={isLoadingMore}
            onClick={loadMore}
            className="text-sm font-semibold h-11 md:text-base"
          >
            {t('text-load-more')}
          </Button>
        </div>
      )}
    </div>
  );
}
interface ProductsGridProps {
  className?: string;
  gridClassName?: string;
  variables?: any;
  column?: 'five' | 'auto';
}
export default function ProductsGrid({
  className,
  gridClassName,
  variables,
  column = 'auto',
}: ProductsGridProps) {
  const { products, loadMore, isLoadingMore, isLoading, hasMore, error } =
    useProducts(variables);

  const productsItem: any = products;
  return (
    <Grid
      products={productsItem}
      loadMore={loadMore}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      hasMore={hasMore}
      error={error}
      className={className}
      gridClassName={gridClassName}
      column={column}
    />
  );
}
