import { useCheckoutTotals } from '@/lib/use-checkout-totals';
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
  // A stale verify (yesterday's session, edited cart) falls back to "Check availability".
  const { fresh: verifiedFresh } = useCheckoutTotals();
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
