import { useAtom } from 'jotai';
import { shippingAddressAtom, verifiedResponseAtom } from '@/store/checkout';
import { usePincodeServiceability } from '@/lib/use-pincode-serviceability';
import DeliveryNotifyMe from '@/components/location/delivery-notify-me';
import { Check, X } from '@/components/ui/icon';

/**
 * Shows whether the selected shipping pincode is serviceable. Surfaced in the
 * Address step so the customer gets immediate feedback; the actual hard block
 * lives in PlaceOrderAction. Also surfaces the server's coverage verdict from
 * /checkout/verify (per-vendor pincode coverage) when items got blocked.
 */
export default function PincodeServiceability() {
  const [shipping] = useAtom(shippingAddressAtom);
  const [verifiedResponse] = useAtom(verifiedResponseAtom);
  const zip = (shipping as any)?.address?.zip as string | undefined;
  const { result, loading, checked, error, retry } = usePincodeServiceability(zip);
  const coverage = (verifiedResponse as any)?.coverage;

  if (!zip) return null;
  if (loading) {
    return (
      <div className="pa-pin pa-pin--checking">
        Checking delivery availability for {zip}…
      </div>
    );
  }
  // The check itself failed (network/server) — say so instead of rendering nothing.
  // Ordering stays fail-open (coverage is advisory), but silence read as "all good".
  if (error) {
    return (
      <div className="pa-pin pa-pin--checking" role="status">
        Couldn&apos;t verify delivery to {zip}.{' '}
        <button type="button" className="font-semibold underline" onClick={() => retry()}>
          Retry
        </button>
      </div>
    );
  }
  if (!checked || !result) return null;

  if (result.serviceable) {
    return (
      <>
        <div className="pa-pin pa-pin--ok">
          <Check size={14} className="mr-1 inline-block align-[-2px]" aria-hidden />
          We deliver to {result.pincode}
          {result.area ? ` · ${result.area}` : result.city ? ` · ${result.city}` : ''}
          {result.eta_days ? ` · ~${result.eta_days} day delivery` : ''}
        </div>
        {coverage?.blocked_products?.length ? (
          <div className="pa-pin pa-pin--no">
            {coverage.message ||
              `Some items in your cart can't be delivered to ${coverage.pincode} and were excluded.`}
          </div>
        ) : null}
      </>
    );
  }
  return (
    <div className="pa-pin pa-pin--no">
      <X size={14} className="mr-1 inline-block align-[-2px]" aria-hidden />
      Sorry, we don’t deliver to {result.pincode} yet. Please use a serviceable
      delivery address to continue.
      <DeliveryNotifyMe pincode={zip} />
    </div>
  );
}
