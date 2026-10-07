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
});

type RegisterFormValues = {
  first_name: string;
  last_name?: string;
  email: string;
  contact: string;
  password: string;
};

/**
 * Required-field marker. The convention already used by checkout/deliver-to and
 * state-city-select — a red asterisk, hidden from screen readers because the
 * field itself carries `required` semantics through validation.
 */
const Req = () => (
  <span className="ms-0.5 text-red-500" aria-hidden>
    *
  </span>
);

type RegisterFormProps = {
  /** Accepted for callers' sake; the in-form "Login" link that used it was
   *  removed (the tab bar above the card is the same control). */
  onSwitchToLogin?: () => void;
  /** Renders the phone-OTP step in the page column instead of a dialog. Absent
   *  (header, checkout) it falls back to the modal, unchanged. */
  onPhoneOtp?: (channel?: OtpChannel) => void;
};

export function RegisterForm({ onPhoneOtp }: RegisterFormProps = {}) {
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
      {/* Social sign-up FIRST, as one row. Owner: "these options are hidden in
          the first view". They used to sit below every field, the submit button
          and a divider — ~820px down a card whose cap is ~730px at 1440×900, so
          they were never in the first view on a laptop. Three stacked 52px
          buttons cannot fit the budget at all (socials + fields + submit =
          546px with zero margins against a 525px form box), so this is a row of
          three compact buttons rather than a tighter stack. Outside <form> with
          type="button", so Enter still submits the email form. */}
      <div className="grid grid-cols-3 gap-3" data-social-row>
        <Button
          type="button"
          variant="formSecondary"
          size="small"
          className="w-full"
          loading={googleBusy}
          disabled={isLoading || googleBusy}
          onClick={googleLogin}
          aria-label="Continue with Google"
          title="Continue with Google"
        >
          <GoogleIcon className="h-5 w-5 shrink-0 ltr:mr-1.5 rtl:ml-1.5 max-[439px]:h-4 max-[439px]:w-4 lg:max-xl:h-4 lg:max-xl:w-4 max-[359px]:hidden" />
          <span className="max-[439px]:text-[12px] lg:max-xl:text-[12px]">{googleBusy ? 'Connecting…' : 'Google'}</span>
        </Button>
        <Button
          type="button"
          variant="formSecondary"
          size="small"
          className="w-full"
          disabled={isLoading}
          onClick={() => (onPhoneOtp ? onPhoneOtp('sms') : openModal('OTP_LOGIN', { channel: 'sms' }))}
          aria-label="Continue with phone OTP"
          title="Continue with phone OTP"
        >
          <Smartphone size={18} className="shrink-0 ltr:mr-1.5 rtl:ml-1.5 max-[439px]:h-4 max-[439px]:w-4 lg:max-xl:h-4 lg:max-xl:w-4 max-[359px]:hidden" aria-hidden />
          <span className="max-[439px]:text-[12px] lg:max-xl:text-[12px]">Phone</span>
        </Button>
        <Button
          type="button"
          variant="formSecondary"
          size="small"
          className="w-full"
          disabled={isLoading}
          onClick={() => (onPhoneOtp ? onPhoneOtp('whatsapp') : openModal('OTP_LOGIN', { channel: 'whatsapp' }))}
          aria-label="Continue with WhatsApp"
          title="Continue with WhatsApp"
        >
          <WhatsAppIcon className="h-5 w-5 shrink-0 text-[#25D366] ltr:mr-1.5 rtl:ml-1.5 max-[439px]:h-4 max-[439px]:w-4 lg:max-xl:h-4 lg:max-xl:w-4 max-[359px]:hidden" />
          {/* Icon + "WhatsApp" is ~96px at the default size; the buttons are ~83–87px on
              phones under 440px and in the lg–xl card, so there the icons drop to 16px and
              the labels to 12px (~82px), and under 360px the icons hide — never abbreviated. */}
          <span className="max-[439px]:text-[12px] lg:max-xl:text-[12px]">WhatsApp</span>
        </Button>
      </div>

      <div className="relative my-4 flex flex-col items-center justify-center text-sm text-heading">
        <hr className="w-full" />
        <span className="absolute -top-2.5 bg-white px-2 text-body">or sign up with email</span>
      </div>

      {/* mode: 'onTouched' — validate on the first blur and re-validate on every
          change after that. The default (onSubmit) only showed the phone/email
          format errors after a full submit attempt; plain onBlur would leave a
          stale error standing until the NEXT blur. */}
      <Form<RegisterFormValues>
        onSubmit={onSubmit}
        validationSchema={registerFormSchema}
        serverError={formError as any}
        useFormProps={{ mode: 'onTouched' }}
      >
        {({ register, control, formState: { errors } }) => (
          <>
            <div className="mb-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={<>First name<Req /></>}
                {...register('first_name')}
                autoComplete="given-name"
                variant="outline"
                dimension="big"
                inputClassName="h-[52px]"
                error={t(errors.first_name?.message!)}
              />
              <Input
                label="Last name (optional)"
                {...register('last_name')}
                autoComplete="family-name"
                variant="outline"
                dimension="big"
                inputClassName="h-[52px]"
                error={t(errors.last_name?.message!)}
              />
            </div>
            <Input
              label={<>{t('text-email')}<Req /></>}
              {...register('email')}
              type="email"
              autoComplete="email"
              variant="outline"
              dimension="big"
              inputClassName="h-[52px]"
              className="mb-3"
              error={t(errors.email?.message!)}
            />
            <div className="mb-3">
              <label htmlFor="contact" className="mb-3 block text-sm font-semibold leading-none text-body-dark">
                Mobile number<Req />
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
                    onBlur={field.onBlur}
                    inputProps={{ id: 'contact', autoComplete: 'tel', inputMode: 'tel' }}
                    inputClass="!h-[52px] !w-full !text-base"
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
              label={<>{t('text-password')}<Req /></>}
              {...register('password')}
              autoComplete="new-password"
              error={t(errors.password?.message!)}
              variant="outline"
              inputClassName="h-[52px]"
              className="mb-4"
            />
            {/* The terms checkbox that used to sit here duplicated the subtitle,
                which already states "By signing up, you agree to our Terms &
                Policy" next to the button. One consent statement, not two. */}
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
      {/* "Already have an account? Login" used to follow. The tab bar above the
          card does the same switch, so it was a second copy of the same control. */}
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
      subtitle="By signing up, you agree to our Terms & Privacy Policy"
    >
      <RegisterForm />
    </AuthShell>
  );
}
