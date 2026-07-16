import { HttpClient } from './client/http-client';
import { API_ENDPOINTS } from './client/api-endpoints';
import { generateCartItem } from '@/store/quick-cart/generate-cart-item';
import type { Item } from '@/store/quick-cart/cart.utils';

/** A server cart line, product-hydrated by the API. */
interface ServerCartLine {
  product: any;
  variation_option_id: number | null;
  quantity: number;
}

/** Canonical minimal line the server stores. */
export interface CartLine {
  product_id: number;
  variation_option_id: number | null;
  quantity: number;
}

/**
 * Map the web cart's generated items to the canonical server shape. Variation
 * items carry `productId` + `variationId`; simple items keep the product id as `id`.
 */
export function itemsToCartLines(items: Array<Item & any>): CartLine[] {
  return (items ?? []).map((it) => ({
    product_id: Number(it.productId ?? it.id),
    variation_option_id: it.variationId != null ? Number(it.variationId) : null,
    quantity: Number(it.quantity ?? 1),
  }));
}

export async function getServerCart(): Promise<Array<{ item: any; quantity: number }>> {
  const res = await HttpClient.get<{ data: { items: ServerCartLine[] } }>(
    API_ENDPOINTS.CART,
  );
  const lines = res?.data?.items ?? [];
  // Rebuild each web cart item from the hydrated product (+ matching variation).
  return lines
    .map(({ product, variation_option_id: voId, quantity }) => {
      if (!product) return null;
      const variation =
        voId != null
          ? (product.variation_options ?? []).find(
              (o: any) => Number(o.id) === Number(voId),
            )
          : undefined;
      const item = generateCartItem(product as any, (variation ?? {}) as any);
      return { item, quantity: Math.max(1, Number(quantity) || 1) };
    })
    .filter(Boolean) as Array<{ item: any; quantity: number }>;
}

export async function saveServerCart(items: Array<Item & any>): Promise<void> {
  await HttpClient.put(API_ENDPOINTS.CART, { items: itemsToCartLines(items) });
}
