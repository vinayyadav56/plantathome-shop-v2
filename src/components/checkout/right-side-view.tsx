import { verifiedResponseAtom } from '@/store/checkout';
import { useAtom } from 'jotai';
import isEmpty from 'lodash/isEmpty';
import dynamic from 'next/dynamic';
import { useCart } from '@/store/quick-cart/cart.context';
import { cartFingerprint } from '@/lib/checkout-totals';
import { formatOrderedProduct } from '@/lib/format-ordered-product';
const UnverifiedItemList = dynamic(
  () => import('@/components/checkout/item/unverified-item-list')
);
const VerifiedItemList = dynamic(
  () => import('@/components/checkout/item/verified-item-list')
);
const DeliveryEstimate = dynamic(
  () => import('@/components/checkout/delivery-estimate')
);

export const RightSideView = ({
  hideTitle = false,
}: {
  hideTitle?: boolean;
}) => {
  const [verifiedResponse] = useAtom(verifiedResponseAtom);
  const { items } = useCart();
  // verified_response persists in localStorage; it is only trustworthy while the cart
  // still matches what /checkout/verify saw. A stale one (yesterday's session, edited
  // cart) used to skip re-verification and submit outdated totals — now it falls back
  // to "Check availability". Responses without a fingerprint (pre-fix blobs) are stale.
  const currentFingerprint = cartFingerprint(
    (items ?? []).map((item: any) => formatOrderedProduct(item)),
  );
  const verifiedFresh =
    !isEmpty(verifiedResponse) &&
    (verifiedResponse as any)?.__fingerprint === currentFingerprint;
  return (
    <>
      {!verifiedFresh ? (
        <UnverifiedItemList hideTitle={hideTitle} />
      ) : (
        <VerifiedItemList />
      )}
      {/* Per-item expected delivery (appears once vendors serve the customer's city) */}
      <DeliveryEstimate />
    </>
  );
};

export default RightSideView;
