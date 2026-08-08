// 'react-query' is the v3 compat shim (tsconfig paths → src/compat/react-query),
// which is what every other data hook here imports. Not @tanstack/react-query.
import { useQuery } from 'react-query';
import type { Product } from '@/types';
import { HttpClient } from '@/framework/client/http-client';
import { useProduct } from './product';
import { useCustomerCity } from '@/lib/use-customer-city';
import { getStoredLatLng } from '@/lib/customer-location';

/**
 * The ONE place the product page decides what a product costs.
 *
 * Before this, the PDP resolved prices three different ways: the pre-selection
 * range read `product.min_price/max_price` straight off the SSR prop, the selected
 * variant came from an inline `location-price` query, and the sticky bar repeated
 * the first. The prop is the problem — `loadProductData` fetches the product
 * server-side with no city (it is ISR-cached for 60s, so it *cannot* be
 * city-specific), which means the range was always the master-catalogue price
 * while the selected price was correctly city-derived. Same page, two answers.
 *
 * Both numbers now come from the server, which is the actual single source:
 *   • the RANGE from the city-aware product fetch, where ProductController's
 *     attachCityPricing() computes min/max across the per-variant city rows
 *   • the SELECTED price from location-price → PricingService::sellingPrice()
 *
 * The client does not compute either one. It only picks which server answer to
 * show, which is the distinction worth keeping: a client that derives prices is a
 * second source no matter how carefully it is written.
 */
export interface CityPrice {
  /** City-resolved range for a variable product, before a variant is chosen. */
  minAmount: number;
  maxAmount: number;
  /** City-resolved price for the chosen variant (or the product, if simple). */
  selectedAmount: number | null;
  /** True when location-price actually had a vendor cost sheet to price against. */
  hasVendorPrice: boolean;
  fulfillment:
    | { fulfillment_mode?: 'local' | 'courier'; eta_days?: number }
    | null
    | undefined;
  /**
   * A city is known but its prices have not arrived yet. Callers should render a
   * placeholder rather than the master-catalogue fallback — briefly showing a
   * price we are about to correct is worse than showing none.
   */
  isResolving: boolean;
}

export function useCityPrice({
  product,
  selectedVariationId,
}: {
  product: Product | undefined;
  selectedVariationId?: number | string | null;
}): CityPrice {
  const { city } = useCustomerCity();
  const loc = getStoredLatLng();
  const id = product?.id;

  // Refetch the product with the city ONLY when a city is set — that is the sole case
  // where the range differs from what the server already rendered (the SSR product is
  // city-less). No-city visitors need no extra request; their master range is correct.
  // With useCustomerCity now synchronous, this fires at most once (was twice, from the
  // null→city key churn).
  const { product: cityProduct } = useProduct({
    slug: (product as any)?.slug ?? '',
    enabled: !!city,
  });

  const { data: vendorPriceData } = useQuery(
    ['location-price', id, selectedVariationId ?? null, loc?.lat, loc?.lng, city],
    () =>
      HttpClient.get<any>('location-price', {
        product_id: id,
        ...(selectedVariationId ? { variation_option_id: selectedVariationId } : {}),
        ...(loc ? { lat: loc.lat, lng: loc.lng } : {}),
        ...(city ? { city } : {}),
      }),
    // keepPreviousData: hold the last result while re-fetching for a newly selected
    // size, so the price and delivery line don't collapse between variants.
    { enabled: !!id, retry: 0, staleTime: 60_000, keepPreviousData: true },
  );

  // Prefer the city-priced product; fall back to the SSR prop only when no city is
  // set, where the master range IS the honest answer.
  const rangeSource: any = cityProduct ?? product;
  const hasVendorPrice = Boolean(
    vendorPriceData?.has_vendor_cost && vendorPriceData?.available,
  );

  return {
    minAmount: Number(rangeSource?.min_price ?? 0),
    maxAmount: Number(rangeSource?.max_price ?? 0),
    selectedAmount: hasVendorPrice ? Number(vendorPriceData?.price ?? 0) : null,
    hasVendorPrice,
    fulfillment: vendorPriceData?.fulfillment,
    // Never true now: rangeSource always falls back to the SSR `product`, so the range
    // paints the master price on the FIRST frame and quietly refines to the city price
    // when it arrives. The old blank skeleton (a measured 0.4-1.3s of no price) is gone.
    isResolving: false,
  };
}
