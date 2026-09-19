import { signIn } from 'next-auth/react';
import { useSetAtom } from 'jotai';
import Logo from '@/components/ui/logo';
import Alert from '@/components/ui/alert';
import Input from '@/components/ui/forms/input';
import PasswordInput from '@/components/ui/forms/password-input';
import Checkbox from '@/components/ui/forms/checkbox/checkbox';
import Button from '@/components/ui/button';
import { useTranslation } from 'next-i18next';
import * as yup from 'yup';
import { GoogleIcon } from '@/components/icons/google';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { Smartphone, Mail, Lock } from '@/components/ui/icon';
import { Form } from '@/components/ui/forms/form';
import { useGoogleLogin, useLogin } from '@/framework/user';
import { initialOtpState, optAtom } from '@/components/otp/atom';
import { AnonymousIcon } from '@/components/icons/anonymous-icon';
import { useRouter } from '@/compat/next-router';
import { Routes } from '@/config/routes';
import { useSettings } from '@/framework/settings';

/**
 * Is this identifier an Indian mobile number rather than an email?
 *
 * Anchored to the Indian numbering plan because the store is India-only and
 * PhoneNumberForm already locks the dial code to +91. Accepts an optional 91 /
 * +91 prefix and the usual human separators.
 */
const MOBILE_RE = /^(?:\+?91)?[6-9]\d{9}$/;
export const isMobileIdentifier = (value: string) =>
  MOBILE_RE.test((value ?? '').replace(/[\s()-]/g, ''));

/**
 * The single identifier field the design asks for.
 *
 * It cannot simply be a relaxed email rule. `POST /token` validates
 * `required|email` server-side and looks the user up with `where('email', …)`
 * — there is no phone branch — so a mobile number submitted there comes back as
 * a 422 field bag that this form does not even render. The user would get a
 * dead field and no explanation. So a recognised mobile is routed into the OTP
 * flow instead, and `password` stops being required on that path.
 */
const loginFormSchema = yup.object().shape({
  email: yup
    .string()
    .required('error-email-required')
    .test(
      'email-or-mobile',
      'error-email-or-mobile',
      (v) => !!v && (yup.string().email().isValidSync(v) || isMobileIdentifier(v)),
    ),
  password: yup.string().when('email', {
    is: (v: string) => !isMobileIdentifier(v ?? ''),
    then: (schema) => schema.required('error-password-required'),
    otherwise: (schema) => schema.optional(),
  }),
  remember: yup.boolean(),
});

type LoginFormValues = {
  email: string;
  password: string;
  remember?: boolean;
};

type LoginFormProps = {
  /** When provided (page context), switches to the register view in place
   *  instead of opening the register modal. */
  onSwitchToRegister?: () => void;
  onForgot?: () => void;
  /** Same idea for the phone-OTP step: on /signin it renders in the column
   *  rather than popping a dialog over the page it is already on. Absent
   *  (header, checkout) it falls back to the modal, unchanged.
   *  Receives digits-only when the user reached it by typing a mobile number
   *  into the identifier field, so the next screen opens pre-filled. */
  onPhoneOtp?: (phone?: string) => void;
};

/** Envelope / padlock affordances from the design. Wrapping rather than adding
 *  an icon slot to `Input`, which has dozens of other call sites. */
function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute top-[41px] text-stone-400 ltr:left-4 rtl:right-4">
      {children}
    </span>
  );
}

export function LoginForm({ onSwitchToRegister, onForgot, onPhoneOtp }: LoginFormProps = {}) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { openModal } = useModalAction();
  const { settings } = useSettings();
  const setOtpState = useSetAtom(optAtom);
  const isCheckout = router.pathname.includes('checkout');
  const { mutate: login, isLoading, serverError, setServerError } = useLogin();

  const { login: googleLogin, isLoading: googleBusy } = useGoogleLogin();
  const guestCheckout = settings?.guestCheckout;

  function goToOtp(phone?: string) {
    if (onPhoneOtp) return onPhoneOtp(phone);
    // Modal callers have no place to put a prefill, so seed the shared atom
    // instead; OtpLogin's mount reset preserves phoneNumber when it is set.
    if (phone) setOtpState({ ...initialOtpState, channel: 'sms', phoneNumber: phone });
    openModal('OTP_LOGIN', { channel: 'sms' });
  }

  function onSubmit({ email, password, remember }: LoginFormValues) {
    if (isMobileIdentifier(email)) {
      // Last 10 digits + country code: the shape PhoneInput and /send-otp-code expect.
      goToOtp('91' + email.replace(/\D/g, '').slice(-10));
      return;
    }
    login({ email, password, remember });
  }

  return (
    <>
      <Alert
        variant="error"
        message={serverError && t(serverError)}
        className="mb-6"
        closeable={true}
        onClose={() => setServerError(null)}
      />
      <Form<LoginFormValues>
        onSubmit={onSubmit}
        validationSchema={loginFormSchema}
      >
        {({ register, formState: { errors } }) => (
          <>
            <div className="relative mb-5">
              <FieldIcon>
                <Mail size={18} aria-hidden />
              </FieldIcon>
              <Input
                label={t('text-email-or-mobile')}
                {...register('email')}
                // Deliberately NOT type="email": native validation would reject a
                // mobile number before React ever sees it. autoComplete="username"
                // is the correct token for an email-or-phone identifier and keeps
                // password managers offering saved logins.
                type="text"
                inputMode="email"
                autoComplete="username"
                variant="outline"
                inputClassName="ltr:pl-11 rtl:pr-11"
                error={t(errors.email?.message!)}
              />
            </div>
            <div className="relative">
              <FieldIcon>
                <Lock size={18} aria-hidden />
              </FieldIcon>
              <PasswordInput
                label={t('text-password')}
                {...register('password')}
                autoComplete="current-password"
                error={t(errors.password?.message!)}
                variant="outline"
                inputClassName="ltr:!pl-11 rtl:!pr-11"
              />
            </div>

            {/* Remember + forgot on one row, per the design. `forgotPageRouteOnClick`
                is deliberately NOT passed to PasswordInput — that renders the link up
                in the label row, and its three other call sites still want it there. */}
            <div className="mt-4 mb-6 flex items-center justify-between gap-4">
              <Checkbox
                {...register('remember')}
                label={t('signin-remember-me')}
              />
              <button
                type="button"
                onClick={onForgot ?? (() => openModal('FORGOT_VIEW'))}
                className="shrink-0 rounded-sm text-[13px] font-medium text-forest-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 focus-visible:ring-offset-2"
              >
                {t('text-forgot-password')}
              </button>
            </div>

            <Button
              className="h-11 w-full !bg-forest-700 !text-light hover:!bg-forest-800 sm:h-12"
              loading={isLoading}
              disabled={isLoading}
            >
              {t('text-login')}
            </Button>
          </>
        )}
      </Form>
      {/* //===============// */}
      <div className="relative flex flex-col items-center justify-center mt-7 mb-6 text-sm text-heading">
        <hr className="w-full" />
        <span className="absolute -top-2.5 bg-white px-2 ltr:left-2/4 ltr:-ml-4 rtl:right-2/4 rtl:-mr-4">
          {t('text-or')}
        </span>
      </div>
      {/* Outline buttons per the design. Apple sits in this stack when its
          Developer credentials exist — nothing is rendered for it today, because
          a social button that looks real and fails is worse than none. */}
      <div className="grid grid-cols-1 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full sm:h-12"
          disabled={isLoading || googleBusy}
          onClick={googleLogin}
        >
          <GoogleIcon className="w-4 h-4 ltr:mr-3 rtl:ml-3" />
          {t('text-login-google')}
        </Button>

        {process.env.NEXT_PUBLIC_ENABLE_LINKEDIN === 'true' && (
          <Button
            className="h-11 w-full !bg-[#0A66C2] !text-light hover:!bg-[#004182] sm:h-12"
            disabled={isLoading}
            onClick={() => signIn('linkedin')}
          >
            <svg className="h-5 w-5 ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
            </svg>
            Continue with LinkedIn
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full sm:h-12"
          disabled={isLoading}
          onClick={() => goToOtp()}
        >
          <Smartphone size={18} className="ltr:mr-2 rtl:ml-2" aria-hidden />
          Continue with Phone (OTP)
        </Button>

        {isCheckout && guestCheckout && (
          <Button
            className="h-11 w-full !bg-pink-700 !text-light hover:!bg-pink-800 sm:h-12"
            disabled={isLoading}
            onClick={() => router.push(Routes.checkoutGuest)}
          >
            <AnonymousIcon className="h-6 text-light ltr:mr-2 rtl:ml-2" />
            {t('text-guest-checkout')}
          </Button>
        )}
      </div>
      <div className="mt-7 border-t border-stone-200 pt-6 text-sm text-center text-body">
        {t('text-no-account')}{' '}
        <button
          onClick={onSwitchToRegister ?? (() => openModal('REGISTER'))}
          className="font-semibold underline transition-colors duration-200 text-[#175840] hover:text-[#1B6B50] hover:no-underline focus:text-[#1B6B50] focus:no-underline focus:outline-0 ltr:ml-1 rtl:mr-1"
        >
          {t('text-register')}
        </button>
      </div>
    </>
  );
}

export default function LoginView() {
  const { t } = useTranslation('common');
  return (
    <div className="flex h-full min-h-screen w-screen flex-col justify-center bg-white py-6 px-5 sm:p-8 md:h-auto md:min-h-0 md:max-w-[480px] md:rounded-xl">
      <div className="flex justify-center">
        <Logo />
      </div>
      <p className="mt-4 mb-8 text-sm text-center text-body sm:mt-5 sm:mb-10 md:text-base">
        {t('login-helper')}
      </p>
      <LoginForm />
    </div>
  );
}
