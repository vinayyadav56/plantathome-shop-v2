import { BrandSpinner } from '@/components/ui/plant-loader';
import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import isEmpty from 'lodash/isEmpty';
import { useCreateOrder } from '@/framework/order';
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
import { checkoutAtom, discountAtom, walletAtom } from '@/store/checkout';
import { calculateTotal } from '@/store/quick-cart/cart.utils';
import { computeCheckoutTotals } from '@/lib/checkout-totals';
import { useTranslation } from 'next-i18next';
import { useRouter } from '@/compat/next-router';
import { useLogout, useUser } from '@/framework/user';
import { PaymentGateway } from '@/types';
import { useSettings } from '@/framework/settings';
import { usePincodeServiceability } from '@/lib/use-pincode-serviceability';
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
  const idempotencyKeyRef = useRef(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const { locale }: any = useRouter();
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

  // Serviceability / courier mode (set by the location gate). When the shopper
  // chose "Continue Anyway" from a non-serviceable area we ALLOW the order and
  // flag it as courier; otherwise a non-serviceable pincode is still hard-blocked.
  const [deliveryMode] = useAtom(deliveryModeAtom);
  const [isNonServiceable] = useAtom(isNonServiceableAtom);
  const [detectedCity] = useAtom(detectedCityAtom);
  const [serviceableCity] = useAtom(serviceableCityAtom);
  const courierMode = deliveryMode === 'courier' || isNonServiceable;
  const [confirmCourier, setConfirmCourier] = useState(false);

  // Display-only city: verify() flagged the whole cart as browse-only.
  const cityStock = (verified_response as any)?.city_stock ?? null;

  const shippingZip = (shipping_address as any)?.address?.zip as string | undefined;
  const { result: pincodeResult } = usePincodeServiceability(shippingZip);
  const pincodeBlocked = pincodeResult?.serviceable === false && !courierMode;

  useEffect(() => {
    setErrorMessage(null);
  }, [payment_gateway]);

  // unavailable_products carries PRODUCT ids while a variation cart item's id is
  // the composite "product.variation" STRING — match productId too, or an
  // unavailable variable product slips through. invalid_option_lines = ghost
  // lines (variable product, no variation picked) that would 422 the order.
  const available_items = items?.filter(
    (item: any) =>
      !verified_response?.unavailable_products?.includes(item.id) &&
      !(item.productId && verified_response?.unavailable_products?.includes(item.productId)) &&
      !(
        !item.variationId &&
        (verified_response as any)?.invalid_option_lines?.includes(item.productId ?? item.id)
      ),
  );

  // ONE totals computation, shared verbatim with the order summary — what the customer
  // saw is exactly what is submitted. (This used to diverge: percentage coupons were
  // submitted flat, and free-shipping totals still included the fee shown as ₹0.)
  const { settings } = useSettings();
  const totals = computeCheckoutTotals({
    clientSubtotal: calculateTotal(available_items),
    verifiedAmount: verified_response?.amount,
    totalTax: verified_response?.total_tax,
    shippingCharge: verified_response?.shipping_charge,
    coupon,
    freeShippingEnabled: settings?.freeShipping,
    freeShippingAmount: settings?.freeShippingAmount,
  });
  const subtotal = totals.subtotal;
  const freeShippings = totals.freeShipping;
  const total = totals.total;
  const submitOrder = () => {
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
      setErrorMessage(
        `We don't deliver to ${pincodeResult?.pincode ?? shippingZip} yet. Please use a serviceable delivery address.`,
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
  const isDigitalCheckout = available_items.find((item) =>
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
      {pincodeBlocked && (
        <div className="mt-3">
          <ValidationError
            message={`We don't deliver to ${pincodeResult?.pincode ?? shippingZip} yet. Please use a serviceable delivery address.`}
          />
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
          // Send the shopper back to the Address step's grid.
          document
            .querySelector('.pa-checkout-step')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      />

      {confirmCourier && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
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
