'use client';

import PrivateRoute from '@/lib/private-route';
import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { useTranslation } from 'next-i18next';
import { billingAddressAtom, shippingAddressAtom } from '@/store/checkout';
import dynamic from 'next/dynamic';
import { getLayout } from '@/components/layouts/layout';
import { AddressType } from '@/framework/utils/constants';
import Seo from '@/components/seo/seo';
import { useUser } from '@/framework/user';
import OrderNote from '@/components/checkout/order-note';
import type { WizardPanel } from '@/components/checkout/checkout-wizard';

import ScheduleGrid from '@/components/checkout/schedule/schedule-grid';
const AddressGrid = dynamic(
  () => import('@/components/checkout/address-grid'),
  { ssr: false }
);
const ContactGrid = dynamic(
  () => import('@/components/checkout/contact/contact-grid')
  // { ssr: false }
);
const RightSideView = dynamic(
  () => import('@/components/checkout/right-side-view'),
  { ssr: false }
);
const CheckoutRecommendations = dynamic(
  () =>
    import('@/components/checkout/checkout-recommendations').then(
      (m) => m.CheckoutRecommendations
    ),
  { ssr: false }
);
const DeliveryLocationVerification = dynamic(
  () => import('@/components/checkout/delivery-location-verification'),
  { ssr: false }
);
const CheckoutSteps = dynamic(
  () => import('@/components/checkout/checkout-steps'),
  { ssr: false }
);
const MobileCheckoutBar = dynamic(
  () => import('@/components/checkout/mobile-checkout-bar'),
  { ssr: false }
);
const CheckoutWizard = dynamic(
  () => import('@/components/checkout/checkout-wizard'),
  { ssr: false }
);
const PincodeServiceability = dynamic(
  () => import('@/components/checkout/pincode-serviceability'),
  { ssr: false }
);

export default function CheckoutPage() {
  const { t } = useTranslation();
  const { me } = useUser();
  const { id, address, profile } = me ?? {};
  const [step, setStep] = useState(0);

  // "Shipping same as billing" (default on): mirror the chosen billing address
  // into the shipping atom and hide the separate shipping picker.
  const [billingAddress] = useAtom(billingAddressAtom);
  const [, setShippingAddress] = useAtom(shippingAddressAtom);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  useEffect(() => {
    if (sameAsBilling && billingAddress) {
      setShippingAddress(billingAddress as any);
    }
  }, [sameAsBilling, billingAddress, setShippingAddress]);

  // One panel per wizard step (reuses the existing grid components + flow).
  const panels: WizardPanel[] = [
    {
      key: 'contact',
      node: (
        <ContactGrid
          className="pa-checkout-step"
          contact={profile?.contact}
          label={t('text-contact-number')}
          count={1}
        />
      ),
    },
    {
      key: 'address',
      node: (
        <div className="space-y-6">
          <AddressGrid
            userId={id!}
            className="pa-checkout-step"
            label={t('text-billing-address')}
            count={2}
            //@ts-ignore
            addresses={address?.filter(
              (item) => item?.type === AddressType.Billing
            )}
            //@ts-ignore
            atom={billingAddressAtom}
            type={AddressType.Billing}
          />
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border-200 bg-gray-50 px-4 py-3 text-sm font-medium text-heading">
            <input
              type="checkbox"
              checked={sameAsBilling}
              onChange={(e) => setSameAsBilling(e.target.checked)}
              className="h-4 w-4 rounded border-border-base text-accent focus:ring-accent"
            />
            {t('Shipping address same as billing address')}
          </label>

          {!sameAsBilling && (
            <AddressGrid
              userId={me?.id!}
              className="pa-checkout-step"
              label={t('text-shipping-address')}
              count={3}
              //@ts-ignore
              addresses={address?.filter(
                (item) => item?.type === AddressType.Shipping
              )}
              //@ts-ignore
              atom={shippingAddressAtom}
              type={AddressType.Shipping}
            />
          )}
          <PincodeServiceability />
        </div>
      ),
    },
    {
      key: 'delivery',
      node: (
        <div className="space-y-6">
          <ScheduleGrid
            className="pa-checkout-step"
            label={t('text-delivery-schedule')}
            count={4}
          />
          <DeliveryLocationVerification
            count={5}
            label={t('Verify delivery location')}
          />
        </div>
      ),
    },
    {
      key: 'review',
      node: <OrderNote count={6} label={t('Order Note')} />,
    },
  ];

  return (
    <>
      <Seo noindex={true} nofollow={true} />
      <div className="pa-checkout-page">
        <div className="m-auto w-full max-w-5xl mb-6">
          <p className="pa-checkout-eyebrow">Secure checkout</p>
          <h1 className="pa-checkout-page-title">{t('text-checkout')}</h1>
          <p className="pa-checkout-page-sub">Encrypted payment · Free returns · Trusted by gardeners</p>
        </div>

        <div className="m-auto w-full max-w-5xl mb-8">
          <CheckoutSteps current={step} onStepClick={setStep} />
        </div>

        <div className="m-auto flex w-full max-w-5xl flex-col items-center rtl:space-x-reverse lg:flex-row lg:items-start lg:space-x-8">
          <div className="w-full lg:max-w-2xl">
            <CheckoutWizard step={step} setStep={setStep} panels={panels} />
          </div>
          <div className="mt-10 mb-10 w-full sm:mb-12 lg:mt-0 lg:mb-0 lg:w-96">
            <RightSideView />
          </div>
        </div>

        {/* premium content: trust strip + product recommendations */}
        <CheckoutRecommendations />
      </div>
      <MobileCheckoutBar />
    </>
  );
}
CheckoutPage.authenticationRequired = true;
CheckoutPage.getLayout = getLayout;


/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <CheckoutPage {...props} />;
  const withLayout = (CheckoutPage as any).getLayout ? (CheckoutPage as any).getLayout(page) : page;
  return <PrivateRoute>{withLayout}</PrivateRoute>;
}
