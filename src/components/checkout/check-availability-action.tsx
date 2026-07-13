import { formatOrderedProduct } from '@/lib/format-ordered-product';
import { useAtom } from 'jotai';
import { billingAddressAtom, shippingAddressAtom } from '@/store/checkout';
import { useCart } from '@/store/quick-cart/cart.context';
import { useVerifyOrder } from '@/framework/order';
import omit from 'lodash/omit';

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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
      )}
      {props.children}
    </button>
  );
};
