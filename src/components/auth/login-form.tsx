import { signIn } from 'next-auth/react';
import Logo from '@/components/ui/logo';
import Alert from '@/components/ui/alert';
import Input from '@/components/ui/forms/input';
import PasswordInput from '@/components/ui/forms/password-input';
import Button from '@/components/ui/button';
import { useTranslation } from 'next-i18next';
import * as yup from 'yup';
import { GoogleIcon } from '@/components/icons/google';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { MobileIcon } from '@/components/icons/mobile-icon';
import { WhatsAppIcon } from '@/components/icons/whatsapp';
import { Form } from '@/components/ui/forms/form';
import { useLogin } from '@/framework/user';
import type { LoginUserInput } from '@/types';
import { AnonymousIcon } from '@/components/icons/anonymous-icon';
import { useRouter } from '@/compat/next-router';
import { Routes } from '@/config/routes';
import { useSettings } from '@/framework/settings';

const loginFormSchema = yup.object().shape({
  email: yup
    .string()
    .email('error-email-format')
    .required('error-email-required'),
  password: yup.string().required('error-password-required'),
});
type LoginFormProps = {
  /** When provided (page context), switches to the register view in place
   *  instead of opening the register modal. */
  onSwitchToRegister?: () => void;
  onForgot?: () => void;
};

export function LoginForm({ onSwitchToRegister, onForgot }: LoginFormProps = {}) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { openModal } = useModalAction();
  const { settings, isLoading: settingLoading } = useSettings();
  const isCheckout = router.pathname.includes('checkout');
  const { mutate: login, isLoading, serverError, setServerError } = useLogin();

  const guestCheckout = settings?.guestCheckout;

  function onSubmit({ email, password }: LoginUserInput) {
    login({
      email,
      password,
    });
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
      <Form<LoginUserInput>
        onSubmit={onSubmit}
        validationSchema={loginFormSchema}
      >
        {({ register, formState: { errors } }) => (
          <>
            <Input
              label={t('text-email')}
              {...register('email')}
              type="email"
              variant="outline"
              className="mb-5"
              error={t(errors.email?.message!)}
            />
            <PasswordInput
              label={t('text-password')}
              {...register('password')}
              error={t(errors.password?.message!)}
              variant="outline"
              className="mb-5"
              forgotPageRouteOnClick={onForgot ?? (() => openModal('FORGOT_VIEW'))}
            />
            <div className="mt-8">
              <Button
                className="w-full h-11 sm:h-12"
                loading={isLoading}
                disabled={isLoading}
              >
                {t('text-login')}
              </Button>
            </div>
          </>
        )}
      </Form>
      {/* //===============// */}
      <div className="relative flex flex-col items-center justify-center mt-8 mb-6 text-sm text-heading sm:mt-11 sm:mb-8">
        <hr className="w-full" />
        <span className="absolute -top-2.5 bg-white px-2 ltr:left-2/4 ltr:-ml-4 rtl:right-2/4 rtl:-mr-4">
          {t('text-or')}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 mt-2">
        <Button
          className="!bg-social-google !text-light hover:!bg-social-google-hover"
          disabled={isLoading}
          onClick={() => {
            signIn('google');
          }}
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
          className="h-11 w-full !bg-[#25D366] !text-light hover:!bg-[#1da851] sm:h-12"
          disabled={isLoading}
          onClick={() => openModal('OTP_LOGIN')}
        >
          <WhatsAppIcon className="h-5 w-5 text-light ltr:mr-2 rtl:ml-2" />
          Continue with WhatsApp
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
      <div className="relative flex flex-col items-center justify-center mt-8 mb-6 text-sm text-heading sm:mt-11 sm:mb-8">
        <hr className="w-full" />
      </div>
      <div className="text-sm text-center text-body sm:text-base">
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
