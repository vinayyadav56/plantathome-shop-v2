'use client';

import Seo from '@/components/seo/seo';
import MyCards from '@/components/card/my-cards';
import Card from '@/components/ui/cards/card';
import { useSettings } from '@/framework/settings';
import { PaymentGateway } from '@/types';
import { isStripeAvailable } from '@/lib/is-stripe-available';
import { FeatureNotAvailable } from '@/components/common/feature-not-available';


const MyCardsPage = () => {
  const { settings } = useSettings();

  // validation check from front-end
  const isStripeGatewayAvailable = isStripeAvailable(settings);
  if (!isStripeGatewayAvailable) {
    return (
      <Card className="w-full shadow-none sm:shadow flex flex-col">
        <div className="m-auto">
          <FeatureNotAvailable />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Seo noindex={true} nofollow={true} />
      <Card className="shadow-n relative w-full self-stretch overflow-hidden md:p-16 md:pt-12">
        <MyCards />
      </Card>
    </>
  );
};



export default MyCardsPage;


/* ── App Router body wrapper — chrome + auth live in app/(account)/layout.tsx ── */

export function PageBody(props: any) {
  return <MyCardsPage {...props} />;
}
