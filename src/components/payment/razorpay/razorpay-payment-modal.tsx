import { useCallback, useEffect, useRef, useState } from 'react';
import useRazorpay, { RazorpayOptions } from '@/lib/use-razorpay';
import { formatAddress } from '@/lib/format-address';
import { PaymentGateway, PaymentIntentInfo } from '@/types';
import { useTranslation } from 'next-i18next';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { useSettings } from '@/framework/settings';
import { useOrder } from '@/framework/order';
import client from '@/framework/client';
import { API_ENDPOINTS } from '@/framework/client/api-endpoints';
import { useQueryClient } from '@/compat/react-query';
import { toast } from 'react-toastify';
import Spinner from '@/components/ui/loaders/spinner/spinner';

interface Props {
  paymentIntentInfo: PaymentIntentInfo;
  trackingNumber: string;
  paymentGateway: PaymentGateway;
}

const RazorpayPaymentModal: React.FC<Props> = ({
  trackingNumber,
  paymentIntentInfo,
  paymentGateway,
}) => {
  const { t } = useTranslation();
  const { closeModal } = useModalAction();
  const { loadRazorpayScript, checkScriptLoaded } = useRazorpay();
  const { settings, isLoading: isSettingsLoading } = useSettings();
  const { order, isLoading, refetch } = useOrder({
    tracking_number: trackingNumber,
  });
  const queryClient = useQueryClient();

  // Confirm the captured payment with our backend. Razorpay has ALREADY taken
  // the money by the time this fires, so losing this call means a paid order
  // stuck "payment-pending" (the Razorpay webhook is the server-side backstop).
  // It runs via the raw client — NOT a component-owned mutation — so closing
  // the modal can never tear the request down mid-flight; and it retries once
  // on a transport failure before surfacing anything to the customer.
  const confirmPayment = useCallback(async () => {
    const body = { tracking_number: trackingNumber!, payment_gateway: 'razorpay' };
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await client.orders.payment(body as any);
        queryClient.refetchQueries(API_ENDPOINTS.ORDERS);
        queryClient.refetchQueries(API_ENDPOINTS.ORDERS_DOWNLOADS);
        return true;
      } catch (e) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        // Both tries failed. The webhook will still reconcile it server-side;
        // tell the customer their money is safe and where to look.
        toast.error(
          'Payment received — we are confirming your order. It will appear in "My Orders" shortly.',
        );
      }
    }
    return false;
  }, [trackingNumber, queryClient]);
  // Script-load failure (ad-blocker, CSP, offline) used to be an UNHANDLED rejection that
  // rendered null: no modal, no error, no way forward, order left unpaid (D10).
  const [loadError, setLoadError] = useState(false);
  const launchedRef = useRef(false);

  // @ts-ignore
  const { customer_name, customer_contact, customer, billing_address } =
    order ?? {};

  const paymentHandle = useCallback(async () => {
    if (!checkScriptLoaded()) {
      await loadRazorpayScript();
    }
    const options: RazorpayOptions = {
      // Prefer the server's public key (from /settings) so the client key always matches
      // the gateway the order was created with; fall back to the build-time env var.
      key: (settings as any)?.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: paymentIntentInfo?.amount!,
      currency: paymentIntentInfo?.currency!,
      name: customer_name!,
      description: `${t('text-order')}#${trackingNumber}`,
      image: settings?.logo?.original!,
      order_id: paymentIntentInfo?.payment_id!,
      handler: async () => {
        // Confirm FIRST (awaited, retrying), THEN close. The old order —
        // closeModal() before the confirm — unmounted this modal and the
        // mutation it owned, dropping the POST entirely, so a paid order was
        // never confirmed (order 248: captured on Razorpay, stuck pending).
        await confirmPayment();
        closeModal();
        await refetch();
      },
      prefill: {
        ...(customer_name && { name: customer_name }),
        ...(customer_contact && { contact: `+${customer_contact}` }),
        ...(customer?.email && { email: customer?.email }),
      },
      notes: {
        address: formatAddress(billing_address as any),
      },
      modal: {
        ondismiss: async () => {
          closeModal();
          await refetch();
        },
      },
    };
    // checkout.js expects construction with `new`.
    const razorpay = new (window as any).Razorpay(options);
    return razorpay.open();
  }, [isLoading, isSettingsLoading]);

  const launch = useCallback(async () => {
    setLoadError(false);
    try {
      await paymentHandle();
    } catch {
      setLoadError(true);
    }
  }, [paymentHandle]);

  useEffect(() => {
    // Launch ONCE per modal open — the old effect re-fired on every refetch-driven
    // identity change and could relaunch the Razorpay window.
    if (!isLoading && !isSettingsLoading && !launchedRef.current) {
      launchedRef.current = true;
      void launch();
    }
  }, [isLoading, isSettingsLoading, launch]);

  if (loadError) {
    return (
      <div className="m-auto flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl bg-light p-6 text-center">
        <p className="text-base font-semibold text-heading">
          Payment window couldn&apos;t load
        </p>
        <p className="text-sm text-body">
          The Razorpay checkout script failed to load — this can happen with ad-blockers or a
          flaky connection. Your order is saved; nothing was charged.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={closeModal}
            className="rounded-md border border-border-200 px-5 py-2 text-sm font-medium text-heading"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => void launch()}
            className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-light hover:bg-accent-hover"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || isSettingsLoading) {
    return <Spinner showText={false} />;
  }

  return null;
};

export default RazorpayPaymentModal;
