'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/compat/next-router';
import Link from 'next/link';
import { useAtom } from 'jotai';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { authorizationAtom } from '@/store/authorization-atom';
import Seo from '@/components/seo/seo';

/**
 * Dedicated split-screen sign-in / sign-up page (replaces the login popup).
 * Left: brand plant photo. Right: the reused Login/Register forms with an
 * in-place tab toggle. Renders standalone (no site header/footer). Auth success
 * redirects via the authorization atom to ?redirect or home.
 */
function SignInPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [isAuthorized] = useAtom(authorizationAtom);
  const [mode, setMode] = useState<'login' | 'register'>(
    router.query.mode === 'register' ? 'register' : 'login',
  );

  const redirect =
    typeof router.query.redirect === 'string' && router.query.redirect.startsWith('/')
      ? router.query.redirect
      : '/';

  // Any auth method (password / Google / WhatsApp) flips the atom → leave the page.
  useEffect(() => {
    if (isAuthorized) router.replace(redirect);
  }, [isAuthorized, redirect, router]);

  return (
    <>
      <Seo title="Sign in" url="signin" noindex nofollow />
      <div className="flex min-h-screen bg-white">
        {/* left — brand photo */}
        <div className="relative hidden w-1/2 shrink-0 overflow-hidden lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-villa-interior.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(150deg,rgba(8,20,12,0.82)_0%,rgba(10,26,16,0.55)_45%,rgba(10,26,16,0.30)_100%)]" />
          <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
            <Link href="/" className="font-pahserif text-[22px] font-bold tracking-tight">
              Plant <span className="text-[#8FD56F]">atHome</span>
            </Link>
            <div>
              <h2 className="font-pahserif text-[40px] font-medium leading-[1.05] tracking-[-0.02em]">
                {t('signin-hero-line-1')}
                <br />
                <span className="text-[#8FD56F]">{t('signin-hero-line-2')}</span>
              </h2>
              <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/80">
                {t('signin-hero-sub')}
              </p>
            </div>
          </div>
        </div>

        {/* right — form */}
        <div className="flex w-full flex-col justify-center px-5 py-10 sm:px-10 lg:w-1/2 lg:px-16">
          <div className="mx-auto w-full max-w-[420px]">
            {/* mobile brand */}
            <Link href="/" className="mb-8 inline-flex font-pahserif text-[22px] font-bold text-forest-900 lg:hidden">
              Plant <span className="ml-1 text-forest-600">atHome</span>
            </Link>

            <h1 className="font-pahserif text-[28px] font-medium text-forest-900">
              {mode === 'login' ? t('signin-welcome') : t('signin-create-account')}
            </h1>
            <p className="mb-7 mt-1 text-[14px] text-stone-500">
              {mode === 'login' ? t('login-helper') : t('registration-helper')}
            </p>

            {/* segmented toggle */}
            <div className="mb-7 grid grid-cols-2 gap-1 rounded-xl bg-sage-100 p-1">
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-lg py-2.5 text-[13.5px] font-semibold transition ${
                    mode === m ? 'bg-white text-forest-900 shadow-sm' : 'text-forest-700/70 hover:text-forest-900'
                  }`}
                >
                  {m === 'login' ? t('signin-tab-login') : t('signin-tab-register')}
                </button>
              ))}
            </div>

            {/* Both forms stay mounted, stacked in the same grid cell, so the
                column keeps the taller form's height — switching tabs no longer
                makes the page jump up and down. */}
            <div className="grid">
              <div
                className={`[grid-area:1/1] ${mode === 'login' ? '' : 'invisible'}`}
                aria-hidden={mode !== 'login'}
              >
                <LoginForm onSwitchToRegister={() => setMode('register')} />
              </div>
              <div
                className={`[grid-area:1/1] ${mode === 'register' ? '' : 'invisible'}`}
                aria-hidden={mode !== 'register'}
              >
                <RegisterForm onSwitchToLogin={() => setMode('login')} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

(SignInPage as any).standalone = true;


export default SignInPage;


/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <SignInPage {...props} />;
  const withLayout = (SignInPage as any).getLayout ? (SignInPage as any).getLayout(page) : page;
  return withLayout;
}
