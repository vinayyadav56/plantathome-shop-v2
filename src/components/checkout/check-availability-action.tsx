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

  function handleVerifyCheckout() {
    // Stepped checkout: a verify fired before contact + address exist lands on
    // a disabled Place Order ("fill all the fields") — guide the shopper to the
    // incomplete step instead of dead-ending.
    if (wizard) {
      const hasAddress = Boolean(
        billing_address?.address ?? shipping_address?.address,
      );
      if (!contact || !hasAddress) {
        toast.info(
          !contact
            ? 'Add your contact number first — then we can check availability.'
            : 'Choose your delivery address first — then we can check availability.',
        );
        wizard.setStep(!contact ? 0 : 1);
        return;
      }
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
      {
        // Success on the stepped page → jump to Review so the main column and
        // the payment sidebar agree (business errors are toasted by the hook).
        onSuccess: (data: unknown) => {
          const failed = Boolean((data as { errors?: unknown } | null)?.errors);
          if (wizard && data && !failed) {
            wizard.setStep(wizard.last);
          }
        },
      },
    );
  }

  return (
    <button
      className="pa-place-order-btn"
      onClick={handleVerifyCheckout}
      disabled={isEmpty || loading}
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
