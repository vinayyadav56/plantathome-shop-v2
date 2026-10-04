import Link from '@/components/ui/link';
import { Controller } from 'react-hook-form';
import AuthShell from '@/components/auth/auth-shell';
import PhoneInput from '@/components/ui/forms/phone-input';
import { isMobileIdentifier } from '@/components/auth/login-form';
import Input from '@/components/ui/forms/input';
import PasswordInput from '@/components/ui/forms/password-input';
import Button from '@/components/ui/button';
import { useTranslation } from 'next-i18next';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { GoogleIcon } from '@/components/icons/google';
import { WhatsAppIcon } from '@/components/icons/whatsapp';
import type { OtpChannel } from '@/types';
import { Smartphone, ArrowRight } from '@/components/ui/icon';
import { Form } from '@/components/ui/forms/form';
import * as yup from 'yup';
import { useRegister } from '@/framework/user';
import { useGoogleLogin } from '@/framework/user';

const registerFormSchema = yup.object().shape({
  first_name: yup.string().trim().required('error-name-required'),
  last_name: yup.string(),
  email: yup
    .string()
    .email('error-email-format')
    .required('error-email-required'),
  // PhoneInput emits digits with the country code ('919876543210').
  contact: yup
    .string()
    .required('Enter your mobile number')
    // Last 10 digits: react-phone-input-2 can double the dial code when a
    // "+91 …" number is pasted into a field that already carries +91.
    .test('valid-mobile', 'Enter a valid 10-digit mobile number', (v) =>
      isMobileIdentifier((v ?? '').replace(/\D/g, '').slice(-10)),
    ),
  // The API rejects shorter passwords with a 422; say so before the round trip.
  password: yup
    .string()
    .required('error-password-required')
    .min(8, 'Password must be at least 8 characters'),
  terms: yup
    .boolean()
    .oneOf([true], 'Please accept the Terms of Service to continue'),
});

type RegisterFormValues = {
  first_name: string;
  last_name?: string;
  email: string;
  contact: string;
  password: string;
  terms?: boolean;
};

type RegisterFormProps = {
  /** When provided (page context), switches to the login view in place. */
  onSwitchToLogin?: () => void;
  /** Renders the phone-OTP step in the page column instead of a dialog. Absent
   *  (header, checkout) it falls back to the modal, unchanged. */
  onPhoneOtp?: (channel?: OtpChannel) => void;
};

export function RegisterForm({ onSwitchToLogin, onPhoneOtp }: RegisterFormProps = {}) {
  const { t } = useTranslation('common');
  const { openModal } = useModalAction();
  const { mutate, isLoading, formError } = useRegister();

  const { login: googleLogin, isLoading: googleBusy } = useGoogleLogin();
  function onSubmit({ first_name, last_name, email, contact, password }: RegisterFormValues) {
    const trimmedFirst = first_name.trim();
    const trimmedLast = (last_name ?? '').trim();
    // Keep sending the joined `name` too — old-API belt and braces. `/register`
    // itself ignores `contact`; useRegister saves it with PUT /me/contacts once
    // the token is set, so the backend contract stays untouched.
    mutate({
      name: [trimmedFirst, trimmedLast].filter(Boolean).join(' '),
      first_name: trimmedFirst,
      last_name: trimmedLast || undefined,
      email,
      contact: '+91' + contact.replace(/\D/g, '').slice(-10),
      password,
    } as any);
  }

  return (
    <>
      <Form<RegisterFormValues>
        onSubmit={onSubmit}
        validationSchema={registerFormSchema}
        serverError={formError as any}
      >
        {({ register, control, formState: { errors } }) => (
          <>
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="First name"
                {...register('first_name')}
                autoComplete="given-name"
                variant="outline"
                dimension="big"
                error={t(errors.first_name?.message!)}
              />
              <Input
                label="Last name (optional)"
                {...register('last_name')}
                autoComplete="family-name"
                variant="outline"
                dimension="big"
                error={t(errors.last_name?.message!)}
              />
            </div>
            <Input
              label={t('text-email')}
              {...register('email')}
              type="email"
              autoComplete="email"
              variant="outline"
              dimension="big"
              className="mb-5"
              error={t(errors.email?.message!)}
            />
            <div className="mb-5">
              <label className="mb-3 block text-sm font-semibold leading-none text-body-dark">
                Mobile number
              </label>
              <Controller
                name="contact"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    country="in"
                    onlyCountries={['in']}
                    countryCodeEditable={false}
                    value={field.value}
                    onChange={field.onChange}
                    inputProps={{ autoComplete: 'tel', inputMode: 'tel' }}
                    inputClass="!h-14 !w-full !text-base"
                  />
                )}
              />
              {errors.contact?.message && (
                <p role="alert" className="mt-2 text-xs text-red-500">
                  {t(errors.contact.message)}
                </p>
              )}
            </div>
            <PasswordInput
              label={t('text-password')}
              {...register('password')}
              autoComplete="new-password"
              error={t(errors.password?.message!)}
              variant="outline"
              inputClassName="h-14"
              className="mb-5"
            />
            {/* Terms acceptance gates registration (frontend only; the routes exist). */}
            <div className="mb-6">
              <label className="flex cursor-pointer items-start gap-3 text-sm text-body">
                <input
                  type="checkbox"
                  {...register('terms')}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-gray-300 text-ds-btn focus:ring-ds-accent"
                />
                <span>
                  I agree to the{' '}
                  <Link href="/terms" target="_blank" className="font-semibold text-forest-700 underline hover:no-underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" target="_blank" className="font-semibold text-forest-700 underline hover:no-underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.terms?.message && (
                <p role="alert" className="mt-2 text-xs text-red-500">
                  {t(errors.terms.message)}
                </p>
              )}
            </div>
            <Button
              variant="formPrimary"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : t('text-register')}
              {!isLoading && <ArrowRight size={18} className="ltr:ml-2 rtl:mr-2" aria-hidden />}
            </Button>
          </>
        )}
      </Form>
      {/* End of forgot register form */}

      <div className="relative mt-8 mb-6 flex flex-col items-center justify-center text-sm text-heading sm:mt-11 sm:mb-8">
        <hr className="w-full" />
        <span className="absolute -top-2.5 bg-white px-2 ltr:left-2/4 ltr:-ml-4 rtl:right-2/4 rtl:-mr-4">
          {t('text-or')}
        </span>
      </div>

      {/* Social + phone sign-up (NextAuth session is bridged to the API by the
          global <SocialLogin/> in _app.tsx; OTP_LOGIN handles phone sign-up). */}
      <div className="mb-8 grid grid-cols-1 gap-4">
        <Button
          type="button"
          variant="formSecondary"
          className="w-full"
          loading={googleBusy}
          disabled={isLoading || googleBusy}
          onClick={googleLogin}
        >
          <GoogleIcon className="h-5 w-5 ltr:mr-3 rtl:ml-3" />
          {googleBusy ? 'Connecting...' : 'Continue with Google'}
        </Button>
        <Button
          type="button"
          variant="formSecondary"
          className="w-full"
          disabled={isLoading}
          onClick={() => (onPhoneOtp ? onPhoneOtp('sms') : openModal('OTP_LOGIN', { channel: 'sms' }))}
        >
          <Smartphone size={18} className="ltr:mr-3 rtl:ml-3" aria-hidden />
          Continue with Phone (OTP)
        </Button>

        <Button
          type="button"
          variant="formSecondary"
          className="w-full"
          disabled={isLoading}
          onClick={() => (onPhoneOtp ? onPhoneOtp('whatsapp') : openModal('OTP_LOGIN', { channel: 'whatsapp' }))}
        >
          <WhatsAppIcon className="h-5 w-5 text-[#25D366] ltr:mr-3 rtl:ml-3" />
          Continue with WhatsApp
        </Button>
      </div>

      <div className="text-center text-sm text-body sm:text-base">
        {t('text-already-account')}{' '}
        <button
          onClick={onSwitchToLogin ?? (() => openModal('LOGIN_VIEW'))}
          className="font-semibold text-[#175840] underline transition-colors duration-200 hover:text-[#1B6B50] hover:no-underline focus:text-[#1B6B50] focus:no-underline focus:outline-0 ltr:ml-1 rtl:mr-1"
        >
          {t('text-login')}
        </button>
      </div>
    </>
  );
}
export default function RegisterView() {
  const { openModal, closeModal } = useModalAction();
  return (
    <AuthShell
      tab="register"
      onLogin={() => openModal('LOGIN_VIEW')}
      onRegister={() => {}}
      onClose={closeModal}
      title="Create your account"
      subtitle="Join PlantAtHome — greener living, happier homes"
    >
      <RegisterForm />
    </AuthShell>
  );
}
