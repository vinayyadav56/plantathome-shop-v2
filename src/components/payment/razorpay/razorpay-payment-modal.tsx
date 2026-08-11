import { useCallback, useEffect, useRef, useState } from 'react';
import useRazorpay, { RazorpayOptions } from '@/lib/use-razorpay';
import { formatAddress } from '@/lib/format-address';
import { PaymentGateway, PaymentIntentInfo } from '@/types';
import { useTranslation } from 'next-i18next';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { useSettings } from '@/framework/settings';
import { useOrder, useOrderPayment } from '@/framework/order';
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
  const { createOrderPayment } = useOrderPayment();
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
        closeModal();
        createOrderPayment({
          tracking_number: trackingNumber!,
          payment_gateway: 'razorpay' as string,
        });
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
      <div className="m-auto flex w-full max-w-sm flex-col items-center gap-4 rounded-lg bg-light p-6 text-center">
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
