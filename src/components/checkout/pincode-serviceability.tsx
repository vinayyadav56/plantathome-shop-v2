import { useAtom } from 'jotai';
import { shippingAddressAtom } from '@/store/checkout';
import { usePincodeServiceability } from '@/lib/use-pincode-serviceability';

/**
 * Shows whether the selected shipping pincode is serviceable. Surfaced in the
 * Address step so the customer gets immediate feedback; the actual hard block
 * lives in PlaceOrderAction.
 */
export default function PincodeServiceability() {
  const [shipping] = useAtom(shippingAddressAtom);
  const zip = (shipping as any)?.address?.zip as string | undefined;
  const { result, loading, checked } = usePincodeServiceability(zip);

  if (!zip) return null;
  if (loading) {
    return (
      <div className="pa-pin pa-pin--checking">
        Checking delivery availability for {zip}…
      </div>
    );
  }
  if (!checked || !result) return null;

  if (result.serviceable) {
    return (
      <div className="pa-pin pa-pin--ok">
        ✓ We deliver to {result.pincode}
        {result.area ? ` · ${result.area}` : result.city ? ` · ${result.city}` : ''}
        {result.eta_days ? ` · ~${result.eta_days} day delivery` : ''}
      </div>
    );
  }
  return (
    <div className="pa-pin pa-pin--no">
      ✗ Sorry, we don’t deliver to {result.pincode} yet. Please use a serviceable
      delivery address to continue.
    </div>
  );
}
