import { useProducts } from '@/framework/product';
import { PRODUCTS_PER_PAGE } from '@/framework/client/variables';
import { Grid } from '@/components/products/grid';
import { useRouter } from '@/compat/next-router';
import { useEffect, useState } from 'react';
import { getStoredCity } from '@/lib/customer-location';
import { HttpClient } from '@/framework/client/http-client';

interface Props {
  className?: string;
  variables: any;
  column?: any;
  gridClassName?: string;
}
export default function ProductGridHome({
  className,
  variables,
  column,
  gridClassName,
}: Props) {
  const { query } = useRouter();

  // City-first availability: silently use the customer's selected city; show what we
  // can deliver there first, with a CTA to fall back to the full global catalog.
  const [city, setCity] = useState<string | null>(null);
  const [global, setGlobal] = useState(false);
  const [cityHasStock, setCityHasStock] = useState(false);

  useEffect(() => {
    const sync = () => setCity(getStoredCity());
    sync();
    window.addEventListener('pah-location-changed', sync);
    return () => window.removeEventListener('pah-location-changed', sync);
  }, []);

  useEffect(() => {
    let active = true;
    if (city) {
      HttpClient.get<any>('city-availability', { city })
        .then((r) => active && setCityHasStock(!!r?.has_availability))
        .catch(() => active && setCityHasStock(false));
    } else {
      setCityHasStock(false);
    }
    return () => {
      active = false;
    };
  }, [city]);

  const cityActive = !!city && !global && cityHasStock;

  const { products, loadMore, isLoadingMore, isLoading, hasMore, error } =
    useProducts({
      ...variables,
      ...(query.category && { categories: query.category }),
      ...(query.text && { name: query.text }),
      ...(cityActive ? { city } : {}),
    });
  const productsItem: any = products;
  return (
    <>
      {city && cityHasStock && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
          <span className="text-sm font-medium text-heading">
            {cityActive ? (
              <>
                <span className="font-semibold text-accent">✓ Available in {city}</span>{' '}
                — showing what we can deliver to you first.
              </>
            ) : (
              <>Showing our full global catalog.</>
            )}
          </span>
          <button
            type="button"
            onClick={() => setGlobal((g) => !g)}
            className="text-sm font-semibold text-accent transition hover:underline"
          >
            {cityActive
              ? 'Didn’t find what you’re looking for? Search our global catalog →'
              : `← Back to what’s available in ${city}`}
          </button>
        </div>
      )}
      <Grid
        products={productsItem}
        loadMore={loadMore}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        error={error}
        limit={PRODUCTS_PER_PAGE}
        className={className}
        gridClassName={gridClassName}
        column={column}
      />
    </>
  );
}
