'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@/compat/next-router';
import Link from 'next/link';
import { useAtom } from 'jotai';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';

// Only pulled in when the operator actually chooses them, same as the modal registry does.
// `loading` matters as much as the split here: without a fallback these render NOTHING while the
// chunk downloads, so choosing "Continue with WhatsApp" collapsed the column to zero height and
// then sprang it back open when the code landed. The placeholder holds the space instead.
const ChunkPlaceholder = () => (
  <div aria-hidden className="h-[268px] w-full animate-pulse rounded-xl bg-sage-100/60" />
);
const OtpLoginView = dynamic(() => import('@/components/auth/otp-login'), {
  loading: ChunkPlaceholder,
});
const ForgotUserPassword = dynamic(() => import('@/components/auth/forgot-password'), {
  loading: ChunkPlaceholder,
});
import { authorizationAtom } from '@/store/authorization-atom';
import { Routes } from '@/config/routes';
import Seo from '@/components/seo/seo';

/** The four things the right-hand column can show. */
type AuthView = 'login' | 'register' | 'whatsapp' | 'forgot';

const SWAP_EASE: [number, number, number, number] = [0.04, 0.62, 0.23, 0.98];

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
  const [mode, setMode] = useState<AuthView>(
    router.query.mode === 'register' ? 'register' : 'login',
  );
  const reduceMotion = useReducedMotion();
  // login/register are the two tabbed forms; whatsapp/forgot are full replacements
  // for the column, reached from inside those forms.
  const isTabbed = mode === 'login' || mode === 'register';

  const redirect =
    typeof router.query.redirect === 'string' && router.query.redirect.startsWith('/')
      ? router.query.redirect
      : '/';

  // Only the active view is mounted, so the column's height now changes on every
  // swap. Measuring the live box is what lets that change be animated rather than
  // snapped. A ResizeObserver rather than a swap-time measurement because the
  // forms also grow in place — a server-error alert, a validation message.
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxHeight, setBoxHeight] = useState<number>();
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setBoxHeight(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
              {mode === 'login'
                ? t('signin-welcome')
                : mode === 'register'
                  ? t('signin-create-account')
                  : mode === 'whatsapp'
                    ? 'Continue with WhatsApp'
                    : 'Reset your password'}
            </h1>
            {/* min-h reserves the taller of the two states. The register copy wraps to two
                lines and the login copy does not, so without this the tab strip and the entire
                form below shifted down every time you switched tabs — over the very heading you
                were reading. */}
            <p className="mb-7 mt-1 min-h-[2.5rem] text-[14px] text-stone-500 sm:min-h-[1.25rem]">
              {mode === 'login' && t('login-helper')}
              {mode === 'whatsapp' && 'We will send a 6-digit code to your WhatsApp number.'}
              {mode === 'forgot' && t('forgot-password-helper')}
              {/* `registration-helper` is a fragment ("…you agree to our"); the two
                  words that finish it are separate keys meant to be inlined as links. */}
              {mode === 'register' && (
                <>
                  {t('registration-helper')}{' '}
                  <Link href={Routes.terms} className="underline hover:no-underline">
                    {t('text-terms')}
                  </Link>
                  {' & '}
                  <Link href={Routes.privacy} className="underline hover:no-underline">
                    {t('text-policy')}
                  </Link>
                </>
              )}
            </p>

            {/* segmented toggle — only for the two tabbed forms. WhatsApp and
                password reset replace the column and carry their own way back. */}
            {isTabbed && (
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
            )}

            {/* Every view renders HERE, in the column, rather than punching out
                into a dialog over the page it was launched from.

                Exactly one view is mounted at a time: keeping both tabbed forms
                stacked put two inputs named "email" and two named "password" at
                the same coordinates, which is what autofill and password managers
                act on regardless of `invisible`. The column height that stacking
                used to reserve is animated instead.

                Only the login/register pair is height-pinned; WhatsApp and reset
                measure themselves.

                The swap to WhatsApp/reset used to be given duration 0, because those
                chunks rendered empty for a beat and animating to that meant collapsing
                the column to nothing and springing back. They have a loading placeholder
                now, so there is a real height to travel to and the animation can stay on
                — which is the whole point: it should read the same however you got here. */}
            <motion.div
              initial={false}
              animate={{ height: isTabbed ? boxHeight ?? 'auto' : 'auto' }}
              transition={{ duration: reduceMotion ? 0 : 0.28, ease: SWAP_EASE }}
            >
              <div ref={boxRef}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={mode}
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                    transition={{ duration: reduceMotion ? 0 : 0.22, ease: SWAP_EASE }}
                  >
                    {mode === 'login' ? (
                      <LoginForm
                        onSwitchToRegister={() => setMode('register')}
                        onForgot={() => setMode('forgot')}
                        onWhatsapp={() => setMode('whatsapp')}
                      />
                    ) : mode === 'register' ? (
                      <RegisterForm
                        onSwitchToLogin={() => setMode('login')}
                        onWhatsapp={() => setMode('whatsapp')}
                      />
                    ) : mode === 'whatsapp' ? (
                      <OtpLoginView inline channel="whatsapp" onBack={() => setMode('login')} />
                    ) : (
                      <ForgotUserPassword inline onBack={() => setMode('login')} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
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
