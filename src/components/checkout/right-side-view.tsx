import { verifiedResponseAtom } from '@/store/checkout';
import { useAtom } from 'jotai';
import isEmpty from 'lodash/isEmpty';
import { useCart } from '@/store/quick-cart/cart.context';
import { cartFingerprint } from '@/lib/checkout-totals';
import { formatOrderedProduct } from '@/lib/format-ordered-product';
// STATIC imports, deliberately. These three used to be next/dynamic, so the
// VerifiedItemList chunk was fetched at the exact moment "Check Availability"
// landed — and a tab opened before a deploy asks for a hashed filename the server
// no longer has, which dead-ended the customer's click. They are small, always
// rendered on this page, and on the money path: there is nothing to defer.
import UnverifiedItemList from '@/components/checkout/item/unverified-item-list';
import VerifiedItemList from '@/components/checkout/item/verified-item-list';
import DeliveryEstimate from '@/components/checkout/delivery-estimate';

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
