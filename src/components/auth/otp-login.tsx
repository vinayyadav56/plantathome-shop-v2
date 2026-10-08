import { useTranslation } from 'next-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Alert from '@/components/ui/alert';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { useOtpLogin, useSendOtpCode } from '@/framework/user';
import { initialOtpState, optAtom } from '@/components/otp/atom';
import { useModalAction, useModalState } from '@/components/ui/modal/modal.context';
import AuthShell from '@/components/auth/auth-shell';
import { ArrowLeft } from '@/components/ui/icon';
import Logo from '@/components/ui/logo';
import PhoneNumberForm from '@/components/otp/phone-number-form';
import OtpCodeForm from '@/components/otp/code-verify-form';
import OtpRegisterForm from '@/components/otp/otp-register-form';
import { WhatsAppIcon } from '@/components/icons/whatsapp';
import type { OtpChannel } from '@/types';

function OtpLogin({ channel, prefillPhone }: { channel: OtpChannel; prefillPhone?: string }) {
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
  // `prefillPhone` is the one thing that MAY survive the reset: when someone
  // typed a mobile number into the login form's identifier field we route them
  // here, and making them retype the number they just typed reads as the app
  // losing their input. Digits only, no '+' — that is the shape PhoneInput and
  // onSendCodeSubmission expect.
  useEffect(() => {
    setOtpState({
      ...initialOtpState,
      channel,
      ...(prefillPhone ? { phoneNumber: prefillPhone } : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, prefillPhone]);

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
          <div>
            <PhoneNumberForm
              onSubmit={onSendCodeSubmission}
              isLoading={isLoading}
              view="login"
              // prefillPhone, not the atom: react-hook-form reads defaultValues
              // on its FIRST render, and the effect above seeds the atom only
              // after mount — so going through the atom always arrived one
              // render too late and the field came up empty.
              phoneNumber={prefillPhone || otpState.phoneNumber || undefined}
            />
          </div>
          <p className="mt-4 text-center text-[13px] leading-relaxed text-stone-500">
            By continuing, you agree to our{' '}
            <a href="/terms" target="_blank" className="font-medium text-forest-700 underline hover:no-underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" className="font-medium text-forest-700 underline hover:no-underline">
              Privacy Policy
            </a>
            .
          </p>
        </>
      )}
      {otpState.step === 'OtpForm' && (
        <>
          <Alert
            variant="error"
            message={(serverError && t(serverError)) || (optLoginError && t(optLoginError))}
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
        <>
          <Alert
            variant="error"
            message={optLoginError && t(optLoginError)}
            className="mb-4"
          />
          <OtpRegisterForm
            loading={otpLoginLoading}
            onSubmit={onOtpLoginSubmission}
          />
        </>
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
  /** Digits only (e.g. "919876543210"), pre-filled into the number field. */
  prefillPhone?: string;
};

export default function OtpLoginView({ channel: channelProp, onBack, inline = false, prefillPhone }: OtpLoginViewProps = {}) {
  const { t } = useTranslation('common');
  const { openModal, closeModal } = useModalAction();
  const { data } = useModalState() as { data?: { channel?: OtpChannel } };
  const channel: OtpChannel =
    channelProp ?? (data?.channel === 'whatsapp' ? 'whatsapp' : 'sms');

  const body = (
    <>
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
      ) : null}
      <OtpLogin channel={channel} prefillPhone={prefillPhone} />
      <div className="mt-9 flex items-center gap-4 sm:mt-10">
        <hr className="min-w-0 flex-1 border-stone-200" />
        <button
          onClick={onBack ?? (() => openModal('LOGIN_VIEW'))}
          className="inline-flex items-center gap-2 rounded-sm font-semibold text-forest-700 transition-colors hover:text-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 focus-visible:ring-offset-2"
        >
          <ArrowLeft size={16} aria-hidden />
          Back to login
        </button>
        <hr className="min-w-0 flex-1 border-stone-200" />
      </div>
    </>
  );

  if (inline) return <div className="flex flex-col">{body}</div>;
  return (
    <AuthShell onClose={closeModal}>
      <div className="mb-5 flex justify-center">
        <Logo />
      </div>
      <h1 className="text-center font-heading text-[30px] font-bold leading-tight text-forest-900 sm:text-[34px]">
        Welcome to PlantAtHome
      </h1>
      <p className="mt-2 mb-8 text-center text-[16px] text-stone-500">
        Sign in or create your account using your mobile number.
      </p>
      {body}
    </AuthShell>
  );
}
