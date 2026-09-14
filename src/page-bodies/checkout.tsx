"use client";

import PrivateRoute from "@/lib/private-route";
import { useState, useEffect, useCallback } from "react";
import { useAtom } from "jotai";
import { useTranslation } from "next-i18next";
import {
  billingAddressAtom,
  shippingAddressAtom,
  checkoutStepAtom,
  verifiedResponseAtom,
} from "@/store/checkout";
import { useCart } from "@/store/quick-cart/cart.context";
import { cartFingerprint } from "@/lib/checkout-totals";
import { formatOrderedProduct } from "@/lib/format-ordered-product";
import isEmpty from "lodash/isEmpty";
import dynamic from "next/dynamic";
import { retryImport } from "@/lib/lazy-with-retry";
import { getLayout } from "@/components/layouts/layout";
import { AddressType } from "@/framework/utils/constants";
import Seo from "@/components/seo/seo";
import { useUser } from "@/framework/user";
import OrderNote from "@/components/checkout/order-note";
import type { WizardPanel } from "@/components/checkout/checkout-wizard";

import ScheduleGrid from "@/components/checkout/schedule/schedule-grid";
const AddressGrid = dynamic(
  () => retryImport(() => import("@/components/checkout/address-grid")),
  { ssr: false },
);
const ContactGrid = dynamic(() =>
  retryImport(() => import("@/components/checkout/contact/contact-grid")),
);
const RightSideView = dynamic(
  () => retryImport(() => import("@/components/checkout/right-side-view")),
  { ssr: false },
);
const CheckoutRecommendations = dynamic(
  () =>
    retryImport(() =>
      import("@/components/checkout/checkout-recommendations").then(
        (m) => m.CheckoutRecommendations,
      ),
    ),
  { ssr: false },
);
const DeliveryLocationVerification = dynamic(
  () =>
    retryImport(
      () => import("@/components/checkout/delivery-location-verification"),
    ),
  { ssr: false },
);
const CheckoutSteps = dynamic(
  () => retryImport(() => import("@/components/checkout/checkout-steps")),
  { ssr: false },
);
const MobileCheckoutBar = dynamic(
  () => retryImport(() => import("@/components/checkout/mobile-checkout-bar")),
  { ssr: false },
);
const CheckoutWizard = dynamic(
  () => retryImport(() => import("@/components/checkout/checkout-wizard")),
  { ssr: false },
);
const PincodeServiceability = dynamic(
  () =>
    retryImport(() => import("@/components/checkout/pincode-serviceability")),
  { ssr: false },
);
const DeliverTo = dynamic(
  () => retryImport(() => import("@/components/checkout/deliver-to")),
  {
    ssr: false,
  },
);

export default function CheckoutPage() {
  const { t } = useTranslation();
  const { me } = useUser();
  const { id, address, profile } = me ?? {};
  // The wizard step lives in sessionStorage as well as state: a reload (a stale-build
  // chunk recovery, a refresh, a return from an external page) must not drop the customer
  // back to Contact with their address and slot already chosen. Session-scoped on purpose —
  // a brand-new visit starts at the beginning.
  const STEP_KEY = "pah-checkout-step";
  const [step, setStepState] = useState<number>(() => {
    // Initializer, not an effect: no cascading render, and no hydration risk — every
    // consumer of `step` (CheckoutSteps, CheckoutWizard) is an ssr:false import, so the
    // server never renders a step at all.
    if (typeof window === "undefined") return 0;
    try {
      const saved = Number(sessionStorage.getItem(STEP_KEY) ?? "0");
      return Number.isFinite(saved) && saved > 0 && saved <= 3 ? saved : 0;
    } catch {
      return 0;
    }
  });
  const setStep = useCallback((next: number | ((s: number) => number)) => {
    setStepState((prev) => {
      const value =
        typeof next === "function"
          ? (next as (s: number) => number)(prev)
          : next;
      try {
        sessionStorage.setItem(STEP_KEY, String(value));
      } catch {
        /* non-fatal */
      }
      return value;
    });
  }, []);

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

  // Publish the wizard position for sidebar actions (Check Availability guides
  // the shopper to the incomplete step / jumps to Review after a verify).
  const [, setWizardBridge] = useAtom(checkoutStepAtom);
  useEffect(() => {
    setWizardBridge({ step, last: 3, setStep });
    return () => setWizardBridge(null);
  }, [step, setWizardBridge]);

  // Advance to Review when a verify lands. This lives HERE (derived from the
  // same freshness check right-side-view.tsx renders by) and not in a mutate
  // callback inside CheckAvailabilityAction: storing the verified response
  // unmounts that button mid-flight, and its dead-closure setStep call was
  // crashing authenticated /checkout into the route error boundary. Effect
  // fires on the false→true edge only, so stepping back to edit afterwards
  // is not fought.
  const [verifiedResponse] = useAtom(verifiedResponseAtom);
  const { items: cartItems } = useCart();
  const verifiedFresh =
    !isEmpty(verifiedResponse) &&
    (verifiedResponse as any)?.__fingerprint ===
      cartFingerprint(
        (cartItems ?? []).map((item: any) => formatOrderedProduct(item)),
      );
  useEffect(() => {
    if (verifiedFresh) setStep(3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifiedFresh]);

  // One panel per wizard step (reuses the existing grid components + flow).
  const panels: WizardPanel[] = [
    {
      key: "contact",
      node: (
        <ContactGrid
          className="pa-checkout-step"
          contact={profile?.contact}
          label={t("text-contact-number")}
          count={1}
        />
      ),
    },
    {
      key: "address",
      node: (
        <div className="space-y-6">
          <DeliverTo count={2} label="Delivery type" />
          <AddressGrid
            userId={id!}
            className="pa-checkout-step"
            label={t("text-billing-address")}
            count={3}
            //@ts-ignore
            addresses={address?.filter(
              (item) => item?.type === AddressType.Billing,
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
            {t("Shipping address same as billing address")}
          </label>

          {!sameAsBilling && (
            <AddressGrid
              userId={me?.id!}
              className="pa-checkout-step"
              label={t("text-shipping-address")}
              count={4}
              //@ts-ignore
              addresses={address?.filter(
                (item) => item?.type === AddressType.Shipping,
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
      key: "delivery",
      node: (
        <div className="space-y-6">
          <ScheduleGrid
            className="pa-checkout-step"
            label={t("text-delivery-schedule")}
            count={5}
          />
          <DeliveryLocationVerification
            count={6}
            label={t("Verify delivery location")}
          />
        </div>
      ),
    },
    {
      key: "review",
      node: <OrderNote count={7} label={t("Order Note")} />,
    },
  ];

  return (
    <>
      <Seo noindex={true} nofollow={true} />
      <div className="pa-checkout-page">
        <div className="m-auto w-full max-w-5xl mb-6">
          <p className="pa-checkout-eyebrow">Secure checkout</p>
          <h1 className="pa-checkout-page-title">{t("text-checkout")}</h1>
          <p className="pa-checkout-page-sub">
            Encrypted payment · Free returns · Trusted by gardeners
          </p>
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
  const withLayout = (CheckoutPage as any).getLayout
    ? (CheckoutPage as any).getLayout(page)
    : page;
  return <PrivateRoute>{withLayout}</PrivateRoute>;
}
