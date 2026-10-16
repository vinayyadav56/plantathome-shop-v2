import { BrandSpinner } from '@/components/ui/plant-loader';
import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import isEmpty from 'lodash/isEmpty';
import { useConsumeCheckout, useCreateOrder, type UnpaidReason } from '@/framework/order';
import client from '@/framework/client';
import { useSettings } from '@/framework/settings';
import { useModalState } from '@/components/ui/modal/modal.context';
import { Routes } from '@/config/routes';
import { toast } from 'react-toastify';
import { clearPendingAttempt, getOrderToken, getPendingAttempt } from '@/lib/order-token';
import ValidationError from '@/components/ui/validation-error';
import { formatOrderedProduct } from '@/lib/format-ordered-product';
import { getStoredLatLng, getStoredCity } from '@/lib/customer-location';
import {
  deliverToAtom,
  recipientNameAtom,
  recipientPhoneAtom,
} from '@/store/deliver-to';
import CityMismatchDialog from './city-mismatch-dialog';
import { useCart } from '@/store/quick-cart/cart.context';
import { checkoutAtom, checkoutStepAtom, discountAtom, walletAtom } from '@/store/checkout';
import { asIdList, cartFingerprint } from '@/lib/checkout-totals';
import { useCheckoutTotals } from '@/lib/use-checkout-totals';
import { useTranslation } from 'next-i18next';
import { useRouter } from '@/compat/next-router';
import { useLogout, useUser } from '@/framework/user';
import { PaymentGateway } from '@/types';
import { usePincodeServiceability } from '@/lib/use-pincode-serviceability';
import { isCityGatedCart } from '@/lib/is-city-based';
import { track } from '@/lib/analytics/track';
import {
  deliveryModeAtom,
  isNonServiceableAtom,
  detectedCityAtom,
  serviceableCityAtom,
} from '@/store/serviceability';
import Cookies from 'js-cookie';
import { REVIEW_POPUP_MODAL_KEY } from '@/lib/constants';
import { Gift } from '@/components/ui/icon';

/** A fresh Idempotency-Key: one per checkout attempt, so a closed attempt is never replayed. */
const newAttemptKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const PlaceOrderAction: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = (props) => {
  const { t } = useTranslation('common');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { createOrder, isLoading } = useCreateOrder();
  // One key per checkout attempt (stable across double-clicks and network
  // retries on this mount): the server dedupes on it, so a duplicate POST
  // returns the ORIGINAL order instead of charging/creating twice. A new
  // mount (fresh checkout) gets a new key.
  const idempotencyKeyRef = useRef(newAttemptKey());
  const router = useRouter();
  const { locale }: any = router;
  const { items } = useCart();
  const { me } = useUser();

  const [
    {
      billing_address,
      shipping_address,
      delivery_time,
      coupon,
      verified_response,
      customer_contact,
      customer_name,
      customer_email,
      payment_gateway,
      payment_sub_gateway,
      note,
      token,
      payable_amount,
      delivery_verification,
    },
  ] = useAtom(checkoutAtom);

  const [wizard] = useAtom(checkoutStepAtom);
  const [discount] = useAtom(discountAtom);
  const [use_wallet_points] = useAtom(walletAtom);

  // Shopping-City redesign: delivery-type + recipient + the hard-gate dialog.
  const [deliverTo] = useAtom(deliverToAtom);
  const [recipientName] = useAtom(recipientNameAtom);
  const [recipientPhone] = useAtom(recipientPhoneAtom);
  const [cityMismatch, setCityMismatch] = useState<any | null>(null);

  // Order-time 422 gate (useCreateOrder dispatches this event on
  // SHOPPING_CITY_MISMATCH) and verify-time gate (checkout/verify returns
  // city_mismatch in the response) both open the same dialog.
  useEffect(() => {
    const onMismatch = (e: any) => setCityMismatch(e.detail);
    window.addEventListener('pah-city-mismatch', onMismatch);
    return () => window.removeEventListener('pah-city-mismatch', onMismatch);
  }, []);
  useEffect(() => {
    const vm = (verified_response as any)?.city_mismatch;
    if (vm?.code === 'SHOPPING_CITY_MISMATCH') setCityMismatch(vm);
  }, [verified_response]);

  // Unavailable, ghost and refused-variant lines are left out of what is submitted, and the totals
  // are the ones the order summary and the mobile bar show — what the customer saw is exactly what
  // is submitted (percentage coupons, free shipping and all).
  const { available_items, totals } = useCheckoutTotals();
  const subtotal = totals.subtotal;
  const total = totals.total;

  // The payment-failed prompt (owner rule, 2026-10-16): an online order is placed only once it is
  // paid. When the payment fails, is closed or never starts, the customer is offered Cash on
  // Delivery — "Place order? Yes / No". No keeps them here with the cart to try again.
  const consumeCheckout = useConsumeCheckout();
  const { settings } = useSettings();
  const { isOpen: modalOpen, view: modalView } = useModalState();
  const [unpaid, setUnpaid] = useState<{
    tracking_number: string;
    token?: string;
    reason: UnpaidReason;
  } | null>(null);
  const [unpaidBusy, setUnpaidBusy] = useState(false);
  const [unpaidNote, setUnpaidNote] = useState<string | null>(null);
  // Mirrors the server's switch (on unless the admin turned it off); a COD_DISABLED answer wins.
  const [codRefused, setCodRefused] = useState(false);
  const codAvailable = settings?.useCashOnDelivery !== false && !codRefused;

  useEffect(() => {
    const onUnpaid = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.tracking_number) return;
      setUnpaidNote(null);
      setUnpaid({ tracking_number: detail.tracking_number, token: detail.token ?? undefined, reason: detail.reason });
    };
    window.addEventListener('pah-payment-unpaid', onUnpaid);
    return () => window.removeEventListener('pah-payment-unpaid', onUnpaid);
  }, []);

  /** The order is placed (paid after all, or switched to COD): empty the checkout, show the order. */
  const goToPlacedOrder = (trackingNumber: string, attemptToken?: string) => {
    consumeCheckout();
    router.push(
      `${Routes.order(trackingNumber)}${attemptToken ? `?token=${encodeURIComponent(attemptToken)}` : ''}`,
    );
  };
  // A remembered attempt is only ever this shopper's (see getPendingAttempt).
  const attemptOwner = String(me?.id ?? 'guest');
  const failure = (e: unknown) => {
    const response = (e as { response?: { status?: number; data?: { code?: string } } })?.response;
    return { status: response?.status, code: response?.data?.code };
  };

  // An attempt left waiting on its payment — the tab reloaded during a UPI app switch, the window
  // was closed — is settled first: placed means the payment went through, cancelled means it is
  // gone, anything else gets the same prompt instead of a second order (and a second payment).
  useEffect(() => {
    // Same shopper AND the same cart — someone else on this browser never sees it.
    const pending = getPendingAttempt(
      attemptOwner,
      cartFingerprint((available_items ?? []).map((item) => formatOrderedProduct(item))),
    );
    if (!pending || (modalOpen && modalView === 'PAYMENT_MODAL')) return;
    let stale = false;
    const attemptToken = getOrderToken(pending);
    client.orders
      .get(pending, attemptToken)
      .then((order) => {
        if (stale) return;
        if (order?.placed_at) goToPlacedOrder(pending, attemptToken);
        else if (['order-cancelled', 'order-refunded', 'order-failed'].includes(order?.order_status)) clearPendingAttempt();
        else setUnpaid({ tracking_number: pending, token: attemptToken, reason: 'dismissed' });
      })
      .catch((e) => {
        // Forget it only when the server says it is gone. A blip must not drop the marker, or the
        // next "Place order" would open a second attempt while this one may still be paid.
        if (!stale && failure(e).status === 404) clearPendingAttempt();
      });
    return () => {
      stale = true;
    };
    // Once, when checkout opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** "Yes": place the unpaid checkout as Cash on Delivery. */
  const answerYes = async () => {
    if (!unpaid) return;
    setUnpaidBusy(true);
    setUnpaidNote(null);
    try {
      const res = await client.orders.cashOnDelivery(unpaid.tracking_number, unpaid.token);
      toast.success(res?.status === 'paid' ? 'Your payment went through — order placed.' : 'Order placed — pay on delivery.');
      setUnpaid(null);
      goToPlacedOrder(unpaid.tracking_number, unpaid.token);
    } catch (e) {
      const { status, code } = failure(e);
      if (code === 'COD_DISABLED') {
        setCodRefused(true);
      } else if (code === 'ATTEMPT_CLOSED') {
        clearPendingAttempt();
        idempotencyKeyRef.current = newAttemptKey();
        setUnpaid(null);
        toast.info('That checkout was closed. Please place your order again.');
      } else {
        setUnpaidNote(
          status === 409
            ? "We're still confirming your payment — please try again in a moment."
            : "We couldn't place the order just now — please try again in a moment.",
        );
      }
    } finally {
      setUnpaidBusy(false);
    }
  };

  /** "No": close the unpaid checkout (its stock, coupon and wallet points come back); stay here. */
  const answerNo = async () => {
    if (!unpaid) return;
    setUnpaidBusy(true);
    setUnpaidNote(null);
    try {
      const res = await client.orders.abandonPayment(unpaid.tracking_number, unpaid.token);
      if (res?.status === 'placed' || res?.status === 'paid') {
        setUnpaid(null);
        goToPlacedOrder(unpaid.tracking_number, unpaid.token);
        return;
      }
    } catch (e) {
      const { status } = failure(e);
      if (status !== 404) {
        setUnpaidNote(
          status === 409
            ? "We're still confirming your payment — please wait a moment."
            : "We couldn't reach the server — please try again.",
        );
        return;
      }
      // 404: the attempt is already gone — nothing left to close.
    } finally {
      setUnpaidBusy(false);
    }
    clearPendingAttempt();
    // The next "Place order" is a new attempt: a reused key would replay this closed one.
    idempotencyKeyRef.current = newAttemptKey();
    setUnpaid(null);
  };

  /**
   * Before placing again, close an earlier attempt still waiting on its payment — two open attempts
   * would hold the stock twice and could both be paid. False when it was handled here instead (it
   * was paid after all, or its payment is still settling).
   */
  const closeEarlierAttempt = async (): Promise<boolean> => {
    // Any earlier attempt of this shopper's, whatever the cart now holds.
    const pending = getPendingAttempt(attemptOwner);
    if (!pending) return true;
    const attemptToken = getOrderToken(pending);
    try {
      const res = await client.orders.abandonPayment(pending, attemptToken);
      if (res?.status === 'placed' || res?.status === 'paid') {
        goToPlacedOrder(pending, attemptToken);
        return false;
      }
    } catch (e) {
      const { status } = failure(e);
      if (status !== 404) {
        setErrorMessage('Your earlier payment is still being confirmed — please wait a moment before placing the order again.');
        return false;
      }
    }
    clearPendingAttempt();
    idempotencyKeyRef.current = newAttemptKey();
    return true;
  };

  // Serviceability / courier mode (set by the location gate). When the shopper
  // chose "Continue Anyway" from a non-serviceable area we ALLOW the order and
  // flag it as courier; otherwise a non-serviceable pincode is still hard-blocked.
  const [deliveryMode] = useAtom(deliveryModeAtom);
  const [isNonServiceable] = useAtom(isNonServiceableAtom);
  const [detectedCity] = useAtom(detectedCityAtom);
  const [serviceableCity] = useAtom(serviceableCityAtom);
  const courierMode = deliveryMode === 'courier' || isNonServiceable;
  const [confirmCourier, setConfirmCourier] = useState(false);

  // A cart with no city-based line (Tools only) ships nationwide by courier: the
  // city-stock lock and the local pincode allow-list are Plants' gates (the
  // server still runs the courier's pincode check).
  const cityGated = isCityGatedCart(items);

  // Display-only city: verify() flagged the whole cart as browse-only.
  const cityStock = cityGated ? (verified_response as any)?.city_stock ?? null : null;

  const shippingZip = (shipping_address as any)?.address?.zip as string | undefined;
  const { result: pincodeResult } = usePincodeServiceability(cityGated ? shippingZip : undefined);
  const pincodeBlocked = pincodeResult?.serviceable === false && !courierMode;
  // The server's own words when it has them ("We couldn't find this PIN code…").
  const pincodeMessage =
    pincodeResult?.message ||
    `We don't deliver to ${pincodeResult?.pincode ?? shippingZip} yet. Please use a serviceable delivery address.`;

  // Delivery coverage, per LINE. verify() has always returned this and the page
  // only displayed it, so a cart with an uncoverable item reached /orders and
  // came back a 422 the shopper could not act on. The server enforces it now;
  // this says so before they press the button, and names the items.
  const coverage = (verified_response as any)?.coverage ?? null;
  const coverageBlockedIds: Array<number | string> = asIdList(coverage?.blocked_products);
  const coverageBlockedItems = items?.filter(
    (item: any) =>
      coverageBlockedIds.includes(item.productId ?? item.id) ||
      coverageBlockedIds.includes(item.id),
  );

  useEffect(() => {
    setErrorMessage(null);
  }, [payment_gateway]);

  const submitOrder = async () => {
    if (!(await closeEarlierAttempt())) return;
    // Fold the optional shared-location check into the order note so it's
    // persisted + visible to admins without an API change.
    let locationLine = '';
    if (delivery_verification) {
      const dv: any = delivery_verification;
      const coords = `${Number(dv.lat).toFixed(5)}, ${Number(dv.lng).toFixed(5)}`;
      if (dv.at_delivery_location === true) {
        locationLine = `📍 Location verified: customer at delivery address (${coords}).`;
      } else if (dv.at_delivery_location === false) {
        const km =
          dv.distance_km != null ? `${Number(dv.distance_km).toFixed(2)} km` : 'unknown';
        locationLine = `⚠️ Location mismatch: customer ~${km} from delivery address (${coords}).`;
      } else {
        locationLine = `📍 Customer location: ${coords} (delivery address has no map coordinates).`;
      }
    }
    const finalNote = [note, locationLine].filter(Boolean).join('\n');

    // P3 matching — persist the customer's coordinates on the order so the admin
    // vendor/delivery-partner matching has precise distances. Prefer the location
    // shared at checkout, then the delivery address's map pin, then the stored one.
    const dvLoc =
      delivery_verification &&
      Number.isFinite(Number((delivery_verification as any).lat)) &&
      Number.isFinite(Number((delivery_verification as any).lng))
        ? { lat: Number((delivery_verification as any).lat), lng: Number((delivery_verification as any).lng) }
        : null;
    // The address's own map pin is TOP-LEVEL on the address object (Address.location);
    // reading only the nested `.address.location` dropped it and orders reached the
    // courier with no drop coordinates.
    const pinOf = (a: any) => {
      const l = a?.location ?? a?.address?.location;
      return l && Number(l.lat) && Number(l.lng)
        ? { lat: Number(l.lat), lng: Number(l.lng) }
        : null;
    };
    const shippingPin = pinOf(shipping_address);
    const billingPin = pinOf(billing_address);
    const customerLatLng = dvLoc || shippingPin || getStoredLatLng();
    // Per-address location precedence: the address's OWN pin wins; customerLatLng
    // is only the fallback for addresses without one.
    const shippingLoc = shippingPin ?? customerLatLng;
    const billingLoc = billingPin ?? customerLatLng;

    const isFullWalletPayment =
      use_wallet_points && payable_amount == 0 ? true : false;
    const gateWay = isFullWalletPayment
      ? PaymentGateway.FULL_WALLET_PAYMENT
      : payment_gateway;

    let input = {
      //@ts-ignore
      products: available_items?.map((item) => formatOrderedProduct(item)),
      amount: subtotal,
      coupon_id: Number(coupon?.id),
      // The RESOLVED currency discount (percentage/free-shipping computed), matching the
      // summary — not the raw coupon.amount, which recorded a 10% coupon as flat ₹10.
      discount: totals.discount ?? 0,
      paid_total: total,
      sales_tax: totals.tax,
      delivery_fee: totals.effectiveShipping,
      total,
      delivery_time: delivery_time?.title,
      customer_contact,
      customer_name,
      // Optional guest email — the server sends the order-confirmation email
      // when present.
      ...(typeof customer_email === 'string' && customer_email.trim()
        ? { customer_email: customer_email.trim() }
        : {}),
      note: finalNote,
      payment_gateway: gateWay,
      payment_sub_gateway,
      use_wallet_points,
      isFullWalletPayment,
      billing_address: {
        ...(billing_address?.address && billing_address.address),
        ...(billingLoc && { location: billingLoc }),
      },
      shipping_address: {
        ...(shipping_address?.address && shipping_address.address),
        ...(shippingLoc && { location: shippingLoc }),
      },
      // Operations / courier-area order flags (persisted on the order).
      is_non_serviceable_order: courierMode,
      ...(detectedCity ? { detected_city: detectedCity } : {}),
      ...(serviceableCity ? { serviceable_city: serviceableCity } : {}),
      // Shopping-City redesign: the declared shopping city arms the server's
      // hard mismatch gate; deliver_to + recipient ride on shipping_address.
      ...(getStoredCity() ? { shopping_city: getStoredCity() } : {}),
      deliver_to: deliverTo,
    };
    if (deliverTo === 'someone_else') {
      (input.shipping_address as any).recipient_name = recipientName.trim();
      (input.shipping_address as any).recipient_phone = recipientPhone.trim();
    }
    delete input.billing_address.__typename;
    delete input.shipping_address.__typename;
    track(courierMode ? 'non_serviceable_order' : 'serviceable_order', {
      label: serviceableCity ?? detectedCity ?? undefined,
    });
    //@ts-ignore
    createOrder({ ...input, __idempotency_key: idempotencyKeyRef.current });
    Cookies.remove(REVIEW_POPUP_MODAL_KEY);
  };

  const handlePlaceOrder = () => {
    if (!customer_contact) {
      setErrorMessage('Contact Number Is Required');
      return;
    }
    if (pincodeBlocked) {
      setErrorMessage(pincodeMessage);
      return;
    }
    if (coverageBlockedItems?.length) {
      const names = coverageBlockedItems
        .map((item: any) => item.name)
        .filter(Boolean)
        .slice(0, 3)
        .join(', ');
      setErrorMessage(
        `${names || 'Some items'} can't be delivered to ${
          coverage?.pincode ?? shippingZip
        } yet. Remove them or choose another address.`,
      );
      return;
    }
    if (!use_wallet_points && !payment_gateway) {
      setErrorMessage('Gateway Is Required');
      return;
    }
    if (
      deliverTo === 'someone_else' &&
      (!recipientName.trim() || !recipientPhone.trim())
    ) {
      setErrorMessage(
        'Recipient name and phone are required to deliver to someone else.',
      );
      return;
    }
    // Non-serviceable (courier) order → confirm before placing.
    if (courierMode && !confirmCourier) {
      setConfirmCourier(true);
      return;
    }
    submitOrder();
  };
  // items comes from cart context and can be momentarily undefined during
  // hydration — the ?.filter above concedes that, so guard the read too.
  const isDigitalCheckout = (available_items ?? []).find((item) =>
    Boolean(item.is_digital),
  );

  let formatRequiredFields = isDigitalCheckout
    ? [customer_contact, payment_gateway, available_items]
    : [
        customer_contact,
        payment_gateway,
        billing_address,
        shipping_address,
        delivery_time,
        available_items,
      ];
  if (!isDigitalCheckout && !me) {
    formatRequiredFields.push(customer_name);
  }

  const isAllRequiredFieldSelected = formatRequiredFields.every(
    (item) => !isEmpty(item),
  );
  return (
    <>
      {courierMode && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-800">
          <span className="font-semibold">Courier delivery selected.</span> Your
          location is outside our standard service area
          {detectedCity ? ` (${detectedCity})` : ''}. Delivery may take longer and
          additional courier charges may apply.
        </div>
      )}
      <button
        className="pa-place-order-btn"
        onClick={handlePlaceOrder}
        disabled={!isAllRequiredFieldSelected || !!isLoading || pincodeBlocked || !!cityStock}
      >
        {isLoading ? (
          <BrandSpinner className="h-5 w-5" />
        ) : (
          <Gift size={18} aria-hidden />
        )}
        {props.children ?? t('text-place-order')}
      </button>
      {cityStock && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-800">
          {cityStock.message}
        </div>
      )}
      {/* verify() refuses a PIN the postal master doesn't know (PINCODE_UNKNOWN): said here for
          as long as it stands. When the PIN check already says so, its notice is the one shown. */}
      {(pincodeBlocked || coverage?.code === 'PINCODE_UNKNOWN') && (
        <div className="mt-3">
          <ValidationError message={pincodeBlocked ? pincodeMessage : coverage.message} />
        </div>
      )}
      {errorMessage && (
        <div className="mt-3">
          <ValidationError message={errorMessage} />
        </div>
      )}
      {!isAllRequiredFieldSelected && (
        <div className="mt-3">
          <ValidationError message={t('text-place-order-helper-text')} />
        </div>
      )}

      <CityMismatchDialog
        open={cityMismatch !== null}
        shoppingCity={cityMismatch?.shopping_city ?? getStoredCity() ?? ''}
        addressCity={cityMismatch?.address_city ?? ''}
        onClose={() => setCityMismatch(null)}
        onChooseAnother={() => {
          // Send the shopper back to the ADDRESS step, then scroll. The old
          // scroll-only version landed on whatever step was mounted (on Review
          // that is the Order Note card) and never switched the wizard.
          wizard?.setStep(1);
          setTimeout(() => {
            document
              .querySelector('.pa-checkout-step')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 50);
        }}
      />

      {unpaid && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pa-unpaid-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-box">
            <h3 id="pa-unpaid-title" className="text-lg font-medium text-forest-900">
              {unpaid.reason === 'dismissed'
                ? 'Payment not completed'
                : unpaid.reason === 'unavailable'
                  ? "Payment couldn't start"
                  : 'Payment failed'}
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              {codAvailable
                ? 'No worries — you can still place this order with Cash on Delivery. Place order?'
                : 'Your order has not been placed. Please try again, or choose another payment method.'}
            </p>
            {unpaidNote && <p className="mt-3 text-sm text-amber-700">{unpaidNote}</p>}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              {codAvailable ? (
                <>
                  <button
                    type="button"
                    disabled={unpaidBusy}
                    onClick={answerNo}
                    className="rounded-lg border border-border-200 px-4 py-2.5 text-sm font-medium text-heading hover:bg-gray-50 disabled:opacity-60"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    disabled={unpaidBusy}
                    onClick={answerYes}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest-800 px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
                  >
                    {unpaidBusy && <BrandSpinner className="h-4 w-4" />}
                    Yes, place order
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={unpaidBusy}
                  onClick={answerNo}
                  className="rounded-lg bg-forest-800 px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmCourier && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-box">
            <h3 className="text-lg font-medium text-forest-900">
              Order from a non-serviceable area?
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              You’re ordering from outside our standard service area
              {detectedCity ? ` (${detectedCity})` : ''}. Delivery will be processed
              through a courier partner — it may take longer and incur additional
              charges. Do you wish to continue?
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmCourier(false)}
                className="rounded-lg border border-border-200 px-4 py-2.5 text-sm font-medium text-heading hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmCourier(false);
                  submitOrder();
                }}
                className="rounded-lg bg-forest-800 px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
