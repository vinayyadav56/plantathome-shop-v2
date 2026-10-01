import { BrandSpinner } from '@/components/ui/plant-loader';
import { formatOrderedProduct } from '@/lib/format-ordered-product';
import { useAtom } from 'jotai';
import {
  billingAddressAtom,
  shippingAddressAtom,
  checkoutStepAtom,
  customerContactAtom,
} from '@/store/checkout';
import { useCart } from '@/store/quick-cart/cart.context';
import { useVerifyOrder } from '@/framework/order';
import { getStoredCity } from '@/lib/customer-location';
import omit from 'lodash/omit';
import { CircleCheck } from '@/components/ui/icon';
import { toast } from 'react-toastify';
import { isAddressComplete } from '@/lib/address-complete';

export const CheckAvailabilityAction: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = (props) => {
  const [billing_address] = useAtom(billingAddressAtom);
  const [shipping_address] = useAtom(shippingAddressAtom);
  const [contact] = useAtom(customerContactAtom);
  const [wizard] = useAtom(checkoutStepAtom);
  const { items, total, isEmpty } = useCart();

  const { mutate: verifyCheckout, isLoading: loading }: any = useVerifyOrder();

  // Annotation: "this button should be disabled until all the required fields completed".
  // Same completeness rule as the click guard below, computed reactively. Server render
  // and the first client render both see the atom DEFAULTS (jotai reads storage in an
  // effect), i.e. "not ready" — so SSR and hydration agree on `disabled` and the button
  // simply enables once the persisted contact/address load a frame later.
  const readyCandidate = billing_address?.address ? billing_address : shipping_address;
  const ready =
    Boolean(contact) &&
    Boolean(readyCandidate?.address) &&
    isAddressComplete(readyCandidate);

  function handleVerifyCheckout() {
    // Stepped checkout: a verify fired before contact + address exist lands on
    // a disabled Place Order ("fill all the fields") — guide the shopper to the
    // incomplete step instead of dead-ending.
    // Two ways a verify used to go out with `billing_address: []` (seen verbatim in the
    // production request log for the crashing session):
    //  1. `if (wizard)` skipped the whole guard whenever the wizard bridge had not been set yet,
    //     so a click on first paint verified with nothing.
    //  2. `hasAddress` only checked truthiness, and a STALE shipping address survives in
    //     localStorage after the billing selection is cleared — so the guard passed on an
    //     address the shopper could not even see selected.
    // Complete-or-nothing, bridge or no bridge.
    const candidate = billing_address?.address ? billing_address : shipping_address;
    const hasAddress = Boolean(candidate?.address) && isAddressComplete(candidate);
    if (!contact || !hasAddress) {
      toast.info(
        !contact
          ? 'Add your contact number first — then we can check availability.'
          : 'Choose your delivery address first — then we can check availability.',
      );
      wizard?.setStep(!contact ? 0 : 1);
      return;
    }
    verifyCheckout(
      {
        amount: total,
        products: items?.map((item) => formatOrderedProduct(item)),
        billing_address: {
          ...(billing_address?.address &&
            omit(billing_address.address, ['__typename'])),
        },
        shipping_address: {
          ...(shipping_address?.address &&
            omit(shipping_address.address, ['__typename'])),
        },
        // Shopping-City redesign: arms the server-side mismatch check — the
        // verify response then carries `city_mismatch` for the blocking dialog.
        ...(getStoredCity() ? { shopping_city: getStoredCity() } : {}),
      },
      // No mutate-level onSuccess: the hook's own onSuccess stores the verified
      // response, which unmounts THIS component (UnverifiedItemList swaps to
      // VerifiedItemList) — a callback here then runs from a dead closure and
      // was crashing the authenticated /checkout into the route error boundary.
      // The wizard page itself advances to Review when the verify lands (see
      // the verifiedFresh effect in page-bodies/checkout.tsx).
    );
  }

  return (
    <button
      className="pa-place-order-btn"
      onClick={handleVerifyCheckout}
      disabled={isEmpty || loading || !ready}
      title={
        ready
          ? undefined
          : !contact
            ? 'Add your contact number first'
            : 'Choose your delivery address first'
      }
      style={{ marginTop: 20 }}
    >
      {loading ? (
        <BrandSpinner className="h-[18px] w-[18px]" />
      ) : (
        <CircleCheck size={18} aria-hidden />
      )}
      {props.children}
    </button>
  );
};
