import { useEffect } from 'react';
import {
  useModalAction,
  useModalState,
} from '@/components/ui/modal/modal.context';
import StripePaymentModal from '@/components/payment/stripe/stripe-payment-modal';
import Modal from '@/components/ui/modal/modal';
import dynamic from 'next/dynamic';

const RazorpayPaymentModal = dynamic(
  () => import('@/components/payment/razorpay/razorpay-payment-modal'),
  { ssr: false }
);

const PAYMENTS_FORM_COMPONENTS: any = {
  STRIPE: {
    component: StripePaymentModal,
    type: 'custom',
  },
  RAZORPAY: {
    component: RazorpayPaymentModal,
    type: 'default',
  },
};

const PaymentModal = () => {
  const {
    isOpen,
    // onPaid / onUnpaid: set when checkout opens the payment itself (an online order is placed
    // only once paid); absent on the order page, which just refetches.
    data: { paymentGateway, paymentIntentInfo, trackingNumber, onPaid, onUnpaid },
  } = useModalState();
  const { closeModal } = useModalAction();
  const PaymentMethod = PAYMENTS_FORM_COMPONENTS[paymentGateway?.toUpperCase()];
  const PaymentComponent = PaymentMethod?.component;
  const paymentModalType = PaymentMethod?.type;

  // A gateway with no form (COD, wallet, an empty intent) has nothing to
  // render here — returning <undefined /> crashed the whole shell to the
  // global error page. Close quietly; the page state already reflects the
  // gateway change after its reload.
  const missingComponent = !PaymentComponent;
  useEffect(() => {
    if (missingComponent && isOpen) closeModal();
  }, [missingComponent, isOpen, closeModal]);
  if (missingComponent) {
    return null;
  }

  return paymentModalType === 'custom' ? (
    <Modal open={isOpen} onClose={closeModal}>
      <PaymentComponent
        paymentIntentInfo={paymentIntentInfo}
        trackingNumber={trackingNumber}
        paymentGateway={paymentGateway}
        onPaid={onPaid}
        onUnpaid={onUnpaid}
      />
    </Modal>
  ) : (
    <PaymentComponent
      paymentIntentInfo={paymentIntentInfo}
      trackingNumber={trackingNumber}
      paymentGateway={paymentGateway}
      onPaid={onPaid}
      onUnpaid={onUnpaid}
    />
  );
};

export default PaymentModal;
