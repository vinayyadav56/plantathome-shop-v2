'use client';

import { useRouter } from '@/compat/next-router';
import { BackArrowRound } from '@/components/icons/back-arrow-round';
import { useUser } from '@/framework/user';
import LoginView from '@/components/auth/login-form';
import { useToken } from '@/lib/hooks/use-token';
import VerifyEmail from '@/page-bodies/verify-email';

import dynamic from 'next/dynamic';
import { useHasMounted } from '@/lib/use-has-mounted';
import axios from 'axios';
import { useSettings } from '@/framework/settings';
import { Routes } from '@/config/routes';
import NotFound from '@/components/404/404';
const Loader = dynamic(
  () => import('@/components/ui/loaders/spinner/spinner'),
  { ssr: false }
);

const PrivateRoute: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { getEmailVerified, setEmailVerified } = useToken();
  const router = useRouter();
  const { me, isAuthorized, error } = useUser();
  const { settings } = useSettings();
  const hasMounted = useHasMounted();
  const isUser = !!me;

  if (axios.isAxiosError(error)) {
    if (error?.response?.status === 417) {
      return (
        <NotFound
          title={`${settings?.siteTitle} ${process.env.NEXT_PUBLIC_VERSION}`}
          subTitle={`This copy of ${settings?.siteTitle} is not genuine.`}
          linkTitle="Please contact with site admin."
          link={Routes.contactUs}
        />
      );
    }
  }

  const { emailVerified } = getEmailVerified();
  if (!isUser && !isAuthorized && hasMounted) {
    return (
      <div className="relative flex min-h-screen w-full justify-center py-5 md:py-8">
        <button
          className="absolute top-5 flex h-8 w-8 items-center justify-center text-gray-200 transition-colors hover:text-gray-400 ltr:left-5 rtl:right-5 md:top-1/2 md:-mt-8 md:h-16 md:w-16 md:text-gray-300 ltr:md:left-10 rtl:md:right-10"
          onClick={router.back}
        >
          <BackArrowRound />
        </button>
        <div className="my-auto flex flex-col">
          <LoginView />
        </div>
      </div>
    );
  }

  if (isAuthorized && emailVerified === false) {
    return <VerifyEmail />;
  }
  if (isUser && isAuthorized) {
    return <div>{children}</div>;
  }

  // Authorized (cookie present) but /me FAILED with something other than 401 — a 500, a
  // timeout, offline. This used to fall through to the spinner below forever ("the redirect
  // effect" never existed): the unresponsive-checkout bug. Show the truth + a way forward.
  if (isAuthorized && error && hasMounted) {
    return (
      <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-semibold text-heading">
          We couldn&apos;t load your account
        </p>
        <p className="max-w-sm text-sm text-body">
          Something went wrong while checking your session. Your cart is safe — try again in a
          moment.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md bg-accent px-6 py-2.5 text-sm font-semibold text-light hover:bg-accent-hover"
        >
          Retry
        </button>
      </div>
    );
  }

  // Session is still being fetched.
  return <Loader showText={false} />;
};

export default PrivateRoute;
