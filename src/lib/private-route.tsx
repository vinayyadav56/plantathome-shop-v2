'use client';

import { useEffect } from 'react';
import { useUser } from '@/framework/user';
import { goToSignin } from '@/lib/go-to-signin';
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
  const { me, isAuthorized, error } = useUser();
  const { settings } = useSettings();
  const hasMounted = useHasMounted();
  const isUser = !!me;
  const mustSignIn = !isUser && !isAuthorized && hasMounted;

  // This branch used to render <LoginView/> inline, which meant every gated
  // page (checkout, order detail, the whole account shell) carried a SECOND
  // login UI that looked nothing like /signin. Everything needed to send people
  // to the real one already existed — goToSignin preserves where they came
  // from, http-client bounces expired 401s the same way, and /signin already
  // honours ?redirect on success. This was simply the last caller that never
  // got the memo.
  useEffect(() => {
    if (mustSignIn) goToSignin({ replace: true });
  }, [mustSignIn]);

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
  // The effect above is already navigating; hold a spinner rather than flashing
  // page content on the way out.
  if (mustSignIn) {
    return <Loader showText={false} />;
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
