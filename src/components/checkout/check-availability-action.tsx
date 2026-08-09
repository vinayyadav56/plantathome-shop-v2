import { BrandSpinner } from '@/components/ui/plant-loader';
import { formatOrderedProduct } from '@/lib/format-ordered-product';
import { useAtom } from 'jotai';
import { billingAddressAtom, shippingAddressAtom } from '@/store/checkout';
import { useCart } from '@/store/quick-cart/cart.context';
import { useVerifyOrder } from '@/framework/order';
import { getStoredCity } from '@/lib/customer-location';
import omit from 'lodash/omit';
import { CircleCheck } from '@/components/ui/icon';

export const CheckAvailabilityAction: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = (props) => {
  const [billing_address] = useAtom(billingAddressAtom);
  const [shipping_address] = useAtom(shippingAddressAtom);
  const { items, total, isEmpty } = useCart();

  const { mutate: verifyCheckout, isLoading: loading }: any = useVerifyOrder();

  function handleVerifyCheckout() {
    verifyCheckout({
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
    });
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
