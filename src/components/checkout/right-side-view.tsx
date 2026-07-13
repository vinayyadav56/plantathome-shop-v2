import { verifiedResponseAtom } from '@/store/checkout';
import { useAtom } from 'jotai';
import isEmpty from 'lodash/isEmpty';
import dynamic from 'next/dynamic';
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
  return (
    <>
      {isEmpty(verifiedResponse) ? (
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
