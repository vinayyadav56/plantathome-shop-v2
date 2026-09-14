import { verifiedResponseAtom } from '@/store/checkout';
import { useAtom } from 'jotai';
import isEmpty from 'lodash/isEmpty';
// STATIC imports (see right-side-view.tsx): the verified list must not be a
// chunk fetch performed at the moment the customer clicks Check Availability.
import UnverifiedItemList from '@/components/checkout/digital/unverified-item-list';
import VerifiedItemList from '@/components/checkout/digital/verified-item-list';

export const CheckoutCart = ({
  hideTitle = false,
}: {
  hideTitle?: boolean;
}) => {
  const [verifiedResponse] = useAtom(verifiedResponseAtom);
  if (isEmpty(verifiedResponse)) {
    return <UnverifiedItemList hideTitle={hideTitle} />;
  }
  return <VerifiedItemList />;
};

export default CheckoutCart;
