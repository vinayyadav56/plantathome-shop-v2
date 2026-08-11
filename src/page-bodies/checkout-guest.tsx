'use client';

import { useTranslation } from 'next-i18next';
import {
  billingAddressAtom,
  clearCheckoutAtom,
  shippingAddressAtom,
} from '@/store/checkout';
import dynamic from 'next/dynamic';
import { getLayout } from '@/components/layouts/layout';
import { AddressType } from '@/framework/utils/constants';
import Seo from '@/components/seo/seo';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import GuestName from '@/components/checkout/guest-name';
import { useSettings } from '@/framework/settings';
import Spinner from '@/components/ui/loaders/spinner/spinner';
import { useRouter } from '@/compat/next-router';
import { Routes } from '@/config/routes';
import OrderNote from '@/components/checkout/order-note';


import ScheduleGrid from '@/components/checkout/schedule/schedule-grid';
import GuestAddressGrid from '@/components/checkout/address-grid-guest';
import ContactGrid from '@/components/checkout/contact/contact-grid';
const RightSideView = dynamic(
  () => import('@/components/checkout/right-side-view'),
  { ssr: false }
);
const PincodeServiceability = dynamic(
  () => import('@/components/checkout/pincode-serviceability'),
  { ssr: false }
);

export default function GuestCheckoutPage() {
  // const { me } = useUser();
  const { t } = useTranslation();
  const [, resetCheckout] = useAtom(clearCheckoutAtom);
  const [billingAddress, setBillingAddress] = useAtom(billingAddressAtom);
  const [shippingAddress] = useAtom(shippingAddressAtom);
  // "Billing same as shipping" (default on): mirror the shipping address into
  // the billing atom and hide the second form (guests used to fill BOTH).
  const [sameAsShipping, setSameAsShipping] = useState(true);
  useEffect(() => {
    if (sameAsShipping && shippingAddress) {
      setBillingAddress(shippingAddress as any);
    }
  }, [sameAsShipping, shippingAddress, setBillingAddress]);
  const router = useRouter();
  const { settings, isLoading } = useSettings();
  const guestCheckout = settings?.guestCheckout;
  // Reset ONCE on entry. This effect used to depend on `settings` with an unconditional
  // reset — useSettings refetches on mount/focus and returns a fresh object, so every
  // refetch wiped the guest's contact, addresses, schedule and verified summary mid-checkout.
  useEffect(() => {
    //@ts-ignore
    resetCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!isLoading && !guestCheckout) {
      router.replace(Routes.home);
    }
  }, [isLoading, guestCheckout, router]);

  if (isLoading) {
    return <Spinner showText={false} />;
  }


  return guestCheckout && (
    <>
      <Seo noindex={true} nofollow={true} />
      <div className="pa-checkout-page">
        <div className="m-auto flex w-full max-w-5xl flex-col items-center rtl:space-x-reverse lg:flex-row lg:items-start lg:space-x-8">
          <div className="w-full space-y-6 lg:max-w-2xl">
            <ContactGrid
              className="pa-checkout-step"
              contact={null}
              label={t('text-contact-number')}
              count={1}
            />
            <GuestName label={t('Name')} count={2} />
            <GuestAddressGrid
              className="pa-checkout-step"
              label={t('text-shipping-address')}
              count={3}
              addresses={shippingAddress ? [shippingAddress] : []}
              //@ts-ignore
              atom={shippingAddressAtom}
              type={AddressType.Shipping}
            />
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border-200 bg-gray-50 px-4 py-3 text-sm font-medium text-heading">
              <input
                type="checkbox"
                checked={sameAsShipping}
                onChange={(e) => setSameAsShipping(e.target.checked)}
                className="h-4 w-4 rounded border-border-base text-accent focus:ring-accent"
              />
              {t('Billing address same as shipping address')}
            </label>
            {!sameAsShipping && (
              <GuestAddressGrid
                className="pa-checkout-step"
                label={t('text-billing-address')}
                count={4}
                addresses={billingAddress ? [billingAddress] : []}
                //@ts-ignore
                atom={billingAddressAtom}
                type={AddressType.Billing}
              />
            )}
            <PincodeServiceability />
            <ScheduleGrid
              className="pa-checkout-step"
              label={t('text-delivery-schedule')}
              count={5}
            />
            <OrderNote count={6} label={t('Order Note')} />
          </div>
          <div className="mt-10 mb-10 w-full sm:mb-12 lg:mb-0 lg:w-96">
            <RightSideView />
          </div>
        </div>
      </div>
    </>
  );
}
GuestCheckoutPage.getLayout = getLayout;


/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <GuestCheckoutPage {...props} />;
  const withLayout = (GuestCheckoutPage as any).getLayout ? (GuestCheckoutPage as any).getLayout(page) : page;
  return withLayout;
}
