import { useTranslation } from 'next-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Alert from '@/components/ui/alert';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { useOtpLogin, useSendOtpCode } from '@/framework/user';
import { initialOtpState, optAtom } from '@/components/otp/atom';
import { useModalAction, useModalState } from '@/components/ui/modal/modal.context';
import Logo from '@/components/ui/logo';
import PhoneNumberForm from '@/components/otp/phone-number-form';
import OtpCodeForm from '@/components/otp/code-verify-form';
import OtpRegisterForm from '@/components/otp/otp-register-form';
import { WhatsAppIcon } from '@/components/icons/whatsapp';
import type { OtpChannel } from '@/types';

function OtpLogin({ channel }: { channel: OtpChannel }) {
  const { t } = useTranslation('common');
  const [otpState, setOtpState] = useAtom(optAtom);
  const reduceMotion = useReducedMotion();

  const {
    mutate: sendOtpCode,
    isLoading,
    serverError,
    setServerError,
  } = useSendOtpCode();

  const {
    mutate: otpLogin,
    isLoading: otpLoginLoading,
    serverError: optLoginError,
  } = useOtpLogin();

  // A fresh open must never inherit a half-finished attempt from last time.
  useEffect(() => {
    setOtpState({ ...initialOtpState, channel });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  function onSendCodeSubmission({ phone_number }: { phone_number: string }) {
    sendOtpCode({
      phone_number: `+${phone_number}`,
      // THE fix: the button says WhatsApp, so the request must say WhatsApp.
      // Without this the server fell back to its default gateway.
      channel,
    });
  }

  /** Resend on the same channel + number the code was first sent to. */
  function onResend() {
    if (!otpState.phoneNumber) return;
    // The UI intent (`channel`) is what the user picked; the atom holds the
    // gateway the server actually resolved. Resending on the intent keeps the
    // WhatsApp button honest even if the first attempt fell back.
    sendOtpCode({ phone_number: otpState.phoneNumber, channel });
  }

  function onOtpLoginSubmission(values: any) {
    otpLogin({
      ...values,
    });
  }

  return (
    <div className="mt-4">
      {/* Phone → code → details is a sequence, so it should read as one. Each step
          used to hard-cut while the surrounding dialog animated, which is what made
          the flow feel like three separate screens. Height animates too, because
          these steps are genuinely different lengths. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={otpState.step}
          initial={reduceMotion ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.04, 0.62, 0.23, 0.98] }}
          className="overflow-hidden"
        >
      {otpState.step === 'PhoneNumber' && (
        <>
          <Alert
            variant="error"
            message={serverError && t(serverError)}
            className="mb-4"
            closeable={true}
            onClose={() => setServerError(null)}
          />
          <div className="flex items-center">
            <PhoneNumberForm
              onSubmit={onSendCodeSubmission}
              isLoading={isLoading}
              view="login"
            />
          </div>
        </>
      )}
      {otpState.step === 'OtpForm' && (
        <>
          <Alert
            variant="error"
            message={serverError && t(serverError)}
            className="mb-4"
            closeable={true}
            onClose={() => setServerError(null)}
          />
          <OtpCodeForm
            isLoading={otpLoginLoading}
            onSubmit={onOtpLoginSubmission}
            onResend={onResend}
            isResending={isLoading}
          />
        </>
      )}
      {otpState.step === 'RegisterForm' && (
        <OtpRegisterForm
          loading={otpLoginLoading}
          onSubmit={onOtpLoginSubmission}
        />
      )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

type OtpLoginViewProps = {
  /** Inline callers pass the channel directly; modal callers still get it from payload. */
  channel?: OtpChannel;
  /** Inline: go back to the login view in place. Modal: defaults to reopening LOGIN_VIEW. */
  onBack?: () => void;
  /**
   * Rendered inside the /signin column rather than a dialog. Drops the
   * full-viewport shell and the logo — the page already carries both, and a
   * second brand mark stacked inside the form column reads as a modal that
   * forgot to open.
   */
  inline?: boolean;
};

export default function OtpLoginView({ channel: channelProp, onBack, inline = false }: OtpLoginViewProps = {}) {
  const { t } = useTranslation('common');
  const { openModal } = useModalAction();
  const { data } = useModalState() as { data?: { channel?: OtpChannel } };
  const channel: OtpChannel =
    channelProp ?? (data?.channel === 'whatsapp' ? 'whatsapp' : 'sms');

  return (
    <div
      className={
        inline
          ? 'flex flex-col'
          : 'flex h-screen w-screen flex-col justify-center bg-light px-5 py-6 sm:p-8 md:h-auto md:max-w-md md:rounded-xl'
      }
    >
      {!inline && (
        <div className="flex justify-center">
          <Logo />
        </div>
      )}
      {/* Inline, the page's own heading already says which channel this is and
          what happens next — repeating it here printed the same sentence twice
          in a row. The modal has no heading of its own, so it keeps the banner. */}
      {inline ? null : channel === 'whatsapp' ? (
        <div className="mt-5 mb-6 text-center sm:mt-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#25D366]/10 px-3 py-1 text-xs font-semibold text-[#128C7E]">
            <WhatsAppIcon className="h-4 w-4" />
            Continue with WhatsApp
          </span>
          <p className="mt-3 text-sm leading-relaxed text-body md:text-base">
            Enter your WhatsApp number and we&apos;ll send you a 6-digit code.
          </p>
        </div>
      ) : (
        <p className="mt-4 mb-7 text-center text-sm leading-relaxed text-body sm:mt-5 sm:mb-10 md:text-base">
          {t('otp-login-helper')}
        </p>
      )}
      <OtpLogin channel={channel} />
      <div className="relative mt-9 mb-7 flex flex-col items-center justify-center text-sm text-heading sm:mt-11 sm:mb-8">
        <hr className="w-full" />
        <span className="absolute -top-2.5 bg-light px-2 ltr:left-2/4 ltr:-ml-4 rtl:right-2/4 rtl:-mr-4">
          {t('text-or')}
        </span>
      </div>
      <div className="text-center text-sm text-body sm:text-base">
        {t('text-back-to')}{' '}
        <button
          onClick={onBack ?? (() => openModal('LOGIN_VIEW'))}
          className="font-semibold text-accent underline transition-colors duration-200 hover:text-accent-hover hover:no-underline focus:text-accent-hover focus:no-underline focus:outline-0 ltr:ml-1 rtl:mr-1"
        >
          {t('text-login')}
        </button>
      </div>
    </div>
  );
}
