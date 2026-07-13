import { useQuery } from 'react-query';
import { useAtom } from 'jotai';
import { HttpClient } from '@/framework/client/http-client';
import { useCart } from '@/store/quick-cart/cart.context';
import { checkoutAtom } from '@/store/checkout';
import { getStoredCity, getStoredPincode } from '@/lib/customer-location';

interface EstimateItem {
  product_id: number;
  variation_option_id: number | null;
  quantity: number;
  unit_price: number;
  available: boolean;
  fulfillable?: boolean;
  shipping_charge: number;
  fulfillment_mode: 'local' | 'courier' | null;
  expected_delivery_date: string | null;
}
interface EstimateResult {
  items: EstimateItem[];
  totals: { subtotal: number; shipping_total: number; grand_total: number; max_eta_days: number | null; expected_delivery_date: string | null };
}

const fmt = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

/**
 * Per-item delivery estimate in the order summary. Hits POST /checkout/estimate with the
 * customer's city + cart lines and shows the expected delivery date per item (local vs
 * courier). Never names a vendor; gracefully renders nothing until vendors serve the city.
 */
export default function DeliveryEstimate() {
  const { items } = useCart();
  const [checkout] = useAtom(checkoutAtom);
  const city = (getStoredCity() || '').trim();
  // Authoritative pincode = the selected shipping address; fall back to the stored one. The API
  // only fetches a LIVE courier rate/ETA when a pincode is supplied (city alone → vendor rates).
  const addrZip = ((checkout as any)?.shipping_address?.address?.zip ?? '').toString().replace(/\D/g, '');
  const pincode = addrZip.length >= 4 ? addrZip : getStoredPincode() ?? '';

  const lines = (items ?? []).map((i: any) => ({
    product_id: i?.productId ?? i?.id,
    variation_option_id: i?.variationId ?? null,
    quantity: i?.quantity ?? 1,
  }));

  const { data } = useQuery<EstimateResult>(
    [
      'checkout-estimate',
      city,
      pincode,
      lines.map((l) => `${l.product_id}:${l.variation_option_id ?? ''}:${l.quantity}`).join(','),
    ],
    () =>
      HttpClient.post<EstimateResult>('checkout/estimate', {
        city,
        ...(pincode ? { pincode } : {}),
        items: lines,
      }),
    { enabled: !!city && lines.length > 0, retry: 0, staleTime: 60_000 },
  );

  const withEta = (data?.items ?? []).filter((e) => e.expected_delivery_date);
  if (withEta.length === 0) return null;

  return (
    <div className="mt-4 rounded-md border border-emerald-100 bg-emerald-50/60 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-heading">
        <span>🚚</span>
        <span>Estimated delivery</span>
        {data?.totals?.expected_delivery_date && (
          <span className="ml-auto text-xs font-normal text-body">by {fmt(data.totals.expected_delivery_date)}</span>
        )}
      </div>
      <ul className="space-y-1">
        {withEta.map((e) => (
          <li key={`${e.product_id}:${e.variation_option_id ?? ''}`} className="flex items-center justify-between text-xs text-body">
            <span>{e.fulfillment_mode === 'local' ? '🛵 Local' : '📦 Courier'}</span>
            <span className="font-medium text-heading">{fmt(e.expected_delivery_date as string)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
