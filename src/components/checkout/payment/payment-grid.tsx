import { RadioGroup } from '@headlessui/react';
import { useTranslation } from 'next-i18next';
import { Fragment, useEffect, useState } from 'react';
import Alert from '@/components/ui/alert';
import CashOnDelivery from '@/components/checkout/payment/cash-on-delivery';
import { useAtom } from 'jotai';
import { paymentGatewayAtom } from '@/store/checkout';
import cn from 'classnames';
import { useSettings } from '@/framework/settings';
import { PaymentGateway } from '@/types';
import PaymentOnline from '@/components/checkout/payment/payment-online';
import Image from 'next/image';
import PaymentSubGrid from './payment-sub-grid';
import { PayMongoCase, SSLCommerceCase } from './payment-variable-case';
import Spinner from '@/components/ui/loaders/spinner/spinner';
import { StripeIcon } from '@/components/icons/payment-gateways/stripe';
import { PayPalIcon } from '@/components/icons/payment-gateways/paypal';
import { MollieIcon } from '@/components/icons/payment-gateways/mollie';
import { RazorPayIcon } from '@/components/icons/payment-gateways/razorpay';
import { SSLComerz } from '@/components/icons/payment-gateways/sslcomerz';
import { PayStack } from '@/components/icons/payment-gateways/paystack';
import { IyzicoIcon } from '@/components/icons/payment-gateways/iyzico';
import { XenditIcon } from '@/components/icons/payment-gateways/xendit';
import { BkashIcon } from '@/components/icons/payment-gateways/bkash';
import { PaymongoIcon } from '@/components/icons/payment-gateways/paymongo';
import { FlutterwaveIcon } from '@/components/icons/payment-gateways/flutterwave';

interface PaymentSubGateways {
  name: string;
  value: string;
}
interface PaymentMethodInformation {
  name: string;
  value: PaymentGateway;
  icon: any;
  component: React.FunctionComponent;
}

interface PaymentGroupOptionProps {
  payment: PaymentMethodInformation;
  theme?: string;
}

// const PAYMENT_GATEWAYS = [
//   { name: 'stripe', title: 'Stripe' },
//   { name: 'paypal', title: 'Paypal' },
//   { name: 'razorpay', title: 'RazorPay' },
//   { name: 'mollie', title: 'Mollie' },
//   { name: 'paystack', title: 'Paystack' },
//   { name: 'sslcommerz', title: 'SslCommerz' },
// ];

const PaymentGroupOption: React.FC<PaymentGroupOptionProps> = ({
  payment,
  theme,
}) => {
  // A gateway name from settings that isn't in the methods map used to destructure
  // undefined here and crash the whole order-summary column. Skip it instead.
  if (!payment) return null;
  const { name, value, icon } = payment;
  return (
    <RadioGroup.Option value={value} key={value}>
      {({ checked }) => (
        <div
          className={cn(
            'relative flex h-full w-full cursor-pointer items-center justify-center rounded border border-gray-200 bg-light p-3 text-center',
            checked && '!border-accent bg-light shadow-600',
            {
              '!border-accent bg-light shadow-600': theme === 'bw' && checked,
            }
          )}
        >
          {icon ? (
            <>{icon}</>
          ) : (
            <span className="text-xs font-semibold text-heading">{name}</span>
          )}
        </div>
      )}
    </RadioGroup.Option>
  );
};

const PaymentGrid: React.FC<{ className?: string; theme?: 'bw' }> = ({
  className,
  theme,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gateway, setGateway] = useAtom(paymentGatewayAtom);
  const { t } = useTranslation('common');
  const { settings, isLoading } = useSettings();
  // If no payment gateway is set and cash on delivery also disable then cash on delivery will be on by default
  const isEnableCashOnDelivery =
    (!settings?.useCashOnDelivery && !settings?.paymentGateway) ||
    settings?.useCashOnDelivery;

  // DERIVED from settings on every render — these were one-shot useState(settings?…)
  // captured before /settings resolved, so a late fetch left the grid with zero online
  // gateways and COD as the only option until a hard reload.
  const defaultGateway = settings?.defaultPaymentGateway?.toUpperCase() || '';
  const cashOnDelivery =
    (!settings?.useCashOnDelivery && !settings?.paymentGateway) ||
    settings?.useCashOnDelivery;
  const availableGateway = settings?.paymentGateway || [];

  // FixME
  // @ts-ignore
  const AVAILABLE_PAYMENT_METHODS_MAP: Record<
    PaymentGateway,
    PaymentMethodInformation
  > = {
    STRIPE: {
      name: 'Stripe',
      value: PaymentGateway.STRIPE,
      icon: <StripeIcon />,
      component: PaymentOnline,
    },
    PAYPAL: {
      name: 'Paypal',
      value: PaymentGateway.PAYPAL,
      icon: <PayPalIcon />,
      // icon: '/payment/paypal.png',
      component: PaymentOnline,
    },
    RAZORPAY: {
      name: 'RazorPay',
      value: PaymentGateway.RAZORPAY,
      icon: <RazorPayIcon />,
      component: PaymentOnline,
    },
    MOLLIE: {
      name: 'Mollie',
      value: PaymentGateway.MOLLIE,
      icon: <MollieIcon />,
      component: PaymentOnline,
    },
    SSLCOMMERZ: {
      name: 'SslCommerz',
      value: PaymentGateway.SSLCOMMERZ,
      icon: <SSLComerz />,
      component: PaymentOnline,
    },
    PAYSTACK: {
      name: 'Paystack',
      value: PaymentGateway.PAYSTACK,
      icon: <PayStack />,
      component: PaymentOnline,
    },
    XENDIT: {
      name: 'Xendit',
      value: PaymentGateway.XENDIT,
      icon: <XenditIcon />,
      component: PaymentOnline,
    },
    IYZICO: {
      name: 'Iyzico',
      value: PaymentGateway.IYZICO,
      icon: <IyzicoIcon />,
      component: PaymentOnline,
    },
    BKASH: {
      name: 'bKash',
      value: PaymentGateway.BKASH,
      icon: <BkashIcon />,
      component: PaymentOnline,
    },
    PAYMONGO: {
      name: 'Paymongo',
      value: PaymentGateway.PAYMONGO,
      icon: <PaymongoIcon />,
      component: PaymentOnline,
    },
    FLUTTERWAVE: {
      name: 'Flutterwave',
      value: PaymentGateway.FLUTTERWAVE,
      icon: <FlutterwaveIcon />,
      component: PaymentOnline,
    },

    CASH_ON_DELIVERY: {
      name: t('text-cash-on-delivery'),
      value: PaymentGateway.COD,
      icon: '',
      component: CashOnDelivery,
    },
  };

  // this is the actual useEffect hooks
  // useEffect(() => {
  //   if (settings && availableGateway) {
  //     // At first, team up the selected gateways.
  //     let selectedGateways = [];
  //     for (let i = 0; i < availableGateway.length; i++) {
  //       selectedGateways.push(availableGateway[i].name.toUpperCase());
  //     }

  //     // if default payment-gateway did not present in the selected gateways, then this will attach default with selected
  //     if (!selectedGateways.includes(defaultGateway)) {
  //       const pluckedGateway = PAYMENT_GATEWAYS.filter((obj) => {
  //         return obj.name.toUpperCase() === defaultGateway;
  //       });
  //       Array.prototype.push.apply(availableGateway, pluckedGateway);
  //     }

  //     availableGateway.forEach((gateway: any) => {
  //       setGateway(gateway?.name.toUpperCase() as PaymentGateway);
  //     });

  //     // TODO : Did not understand properly the planning here. about state
  //     // setGateway(
  //     //   settings?.paymentGateway[0]?.name.toUpperCase() as PaymentGateway
  //     // );
  //   } else {
  //     setGateway(PaymentGateway.COD);
  //   }
  // }, [isLoading, cashOnDelivery, defaultGateway, availableGateway]);

  // Seed the DEFAULT gateway only while nothing is selected. This used to fire on every
  // settings refetch and overwrite the method the customer had just picked (D7).
  // Guard: only seed a gateway the customer can actually SEE — a default that isn't
  // in the enabled list became an invisible selection and a 422 at order time.
  useEffect(() => {
    if (gateway || isLoading) return;
    const online: string[] = settings?.useEnableGateway
      ? availableGateway.map((g: any) => String(g?.name ?? '').toUpperCase())
      : [];
    const selectable: string[] = [
      ...online,
      ...(cashOnDelivery ? [PaymentGateway.COD as string] : []),
    ];
    const seed = selectable.includes(defaultGateway)
      ? defaultGateway
      : selectable[0];
    if (seed) setGateway(seed as PaymentGateway);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateway, isLoading, defaultGateway, settings]);

  const PaymentMethod = AVAILABLE_PAYMENT_METHODS_MAP[gateway];
  const Component = PaymentMethod?.component ?? CashOnDelivery;

  let payment_sub_gateway: PaymentSubGateways[] = [];
  switch (gateway) {
    case 'PAYMONGO':
      payment_sub_gateway = PayMongoCase;
      break;
  }

  if (isLoading) {
    return <Spinner showText={false} />;
  }
  return (
    <div className={className}>
      {errorMessage ? (
        <Alert
          message={t(`common:${errorMessage}`)}
          variant="error"
          closeable={true}
          className="mt-5"
          onClose={() => setErrorMessage(null)}
        />
      ) : null}

      <RadioGroup value={gateway} onChange={setGateway}>
        <RadioGroup.Label className="mb-5 block text-base font-semibold text-heading">
          {t('text-choose-payment')}
        </RadioGroup.Label>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          {/* {settings?.paymentGateway && (
            <PaymentGroupOption
              theme={theme}
              payment={
                AVAILABLE_PAYMENT_METHODS_MAP[
                  settings?.paymentGateway?.toUpperCase() as PaymentGateway
                ]
              }
            />
          )} */}

          {settings?.useEnableGateway &&
            availableGateway &&
            availableGateway?.map((gateway: any, index: any) => {
              return (
                <Fragment key={index}>
                  <PaymentGroupOption
                    theme={theme}
                    payment={
                      AVAILABLE_PAYMENT_METHODS_MAP[
                        gateway?.name.toUpperCase() as PaymentGateway
                      ]
                    }
                  />
                </Fragment>
              );
            })}

          {cashOnDelivery && (
            <PaymentGroupOption
              theme={theme}
              payment={AVAILABLE_PAYMENT_METHODS_MAP[PaymentGateway.COD]}
            />
          )}
        </div>
      </RadioGroup>

      <PaymentSubGrid
        theme={theme}
        gateway={gateway}
        paymentSubGateway={payment_sub_gateway}
      />

      <div>
        <Component />
      </div>
    </div>
  );
};

export default PaymentGrid;
