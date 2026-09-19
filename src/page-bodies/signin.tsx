'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@/compat/next-router';
import Link from 'next/link';
import Image from 'next/image';
import { useAtom } from 'jotai';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { SigninBrand, SigninFeatures } from '@/components/auth/signin-brand';

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

/** The four things the card can show. */
type AuthView = 'login' | 'register' | 'phone' | 'forgot';

const SWAP_EASE: [number, number, number, number] = [0.04, 0.62, 0.23, 0.98];

/**
 * Dedicated sign-in / sign-up page (replaces the login popup), and since
 * private-route.tsx now redirects here, the ONLY login UI outside the header
 * dropdown modal.
 *
 * A photograph fills the viewport; the brand story is real HTML laid over it,
 * and the forms live in an opaque white card floating on the right. Renders
 * standalone (no site header/footer). Auth success redirects via the
 * authorization atom to ?redirect or home.
 */
function SignInPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [isAuthorized] = useAtom(authorizationAtom);
  // `?mode=register` used to be read in a useState initializer, which runs
  // during the hydration render — and the compat router's SERVER search
  // snapshot is empty, so that link silently always landed on Login. Reading
  // window.location there instead is not an option either: server and client
  // would disagree and React 19 treats that as a hydration mismatch.
  //
  // So the view is DERIVED rather than seeded. Until the visitor picks a tab
  // the URL decides; the moment they pick one, their choice wins permanently,
  // which is what stops a later shallow URL change or a back-button popstate
  // yanking someone out of a half-typed form.
  const [chosenMode, setMode] = useState<AuthView | null>(null);
  const mode: AuthView =
    chosenMode ?? (router.query.mode === 'register' ? 'register' : 'login');
  // Set when someone typed a mobile number into the identifier field instead of
  // an email: the OTP step then opens with that number already in it, rather
  // than asking them to type what they just typed.
  const [otpPrefill, setOtpPrefill] = useState<string>();
  const reduceMotion = useReducedMotion();
  // login/register are the two tabbed forms; phone/forgot are full replacements
  // for the card, reached from inside those forms.
  const isTabbed = mode === 'login' || mode === 'register';

  const redirect =
    typeof router.query.redirect === 'string' && router.query.redirect.startsWith('/')
      ? router.query.redirect
      : '/';

  // Only the active view is mounted, so the card's height now changes on every
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
      <div className="relative min-h-[100svh] bg-forest-950">
        {/* ── backdrop ───────────────────────────────────────────────────────
            `fixed`, not absolute. Inside normal flow a `fill` image stretches to
            the whole SCROLLED page height, which on a phone is ~1600px — the
            crop goes wrong and `sizes="100vw"` stops being true, so the browser
            picks a candidate for a box that does not exist. Pinning it to the
            viewport keeps both honest at every breakpoint, and the card scrolling
            over a still photo is the parallax the design wants anyway. */}
        <div className="fixed inset-0" aria-hidden>
          <Image
            src="/plants-1.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            quality={65}
            className="object-cover object-center"
          />
          {/* Scrim. Flat below lg because the brand text sits BOTH above and
              below the card there, and an angled ramp tuned for a 16:9 desktop
              viewport is meaningless at 390x844. Above lg it leans hard into the
              left column and lifts under the card, so the card reads as floating
              on a photograph rather than pasted onto a dark plate.
              Alphas are chosen so white text clears 5.5:1 against the BRIGHTEST
              patch of this photo, not its average — see the plan. */}
          <div className="absolute inset-0 bg-[rgba(9,22,13,0.80)] lg:bg-[linear-gradient(104deg,rgba(9,22,13,0.94)_0%,rgba(9,22,13,0.92)_44%,rgba(9,22,13,0.55)_56%,rgba(9,22,13,0.16)_68%,rgba(9,22,13,0.08)_100%)]" />
          {/* Keeps the category row off a sunlit floorboard. */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_top,rgba(9,22,13,0.70),transparent)]" />
        </div>

        {/* ── content ────────────────────────────────────────────────────────
            DOM order is Brand → Card → Features, which is the phone reading
            order. Desktop re-places them with explicit col/row starts so the two
            brand blocks stack in column 1 while the card spans both rows and
            centres against them. */}
        <div
          className="relative z-10 mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-y-9 px-4 py-8
                     md:px-8 md:py-12
                     lg:min-h-[100svh] lg:grid-cols-[1fr_minmax(420px,470px)] lg:grid-rows-[auto_auto]
                     lg:content-start lg:gap-x-14 lg:gap-y-12 lg:px-12 lg:pt-[7vh] lg:pb-10
                     xl:gap-x-20 xl:px-16"
        >
          <SigninBrand className="lg:col-start-1 lg:row-start-1" />

          {/* the card — opaque white at every width. Translucency or a backdrop
              blur here is where 13px helper text and field labels stop being
              readable over a photograph, and a blur on a panel this large is a
              real compositing cost on mid-range Android. The shadow is what
              makes it float.

              `self-start`, NOT `self-center`. Sign Up is taller than Login, and
              a vertically-centred card absorbs that difference from BOTH edges,
              so the tabs and heading slide up ~38px on every tab switch — under
              the pointer that just clicked them. Anchoring the top edge means
              only the bottom grows. This was annotated on the old page, fixed
              there by top-anchoring, and re-broken when this redesign centred
              it; measure the tab's bounding box across a swap before changing
              it back.

              The grid is `content-start` for the same reason: with
              `content-center`, a taller Sign Up card grows the row, the row
              grows the grid, and the centred block slides up — so the drift
              came back at 1440 even with the card top-anchored. Nothing here
              may re-centre on content height. */}
          <div
            className="w-full rounded-[20px] bg-white p-6 shadow-[0_24px_70px_rgba(6,20,10,0.40)]
                       md:mx-auto md:max-w-[480px] md:rounded-[22px] md:p-8
                       lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:mx-0 lg:max-w-none lg:self-start lg:p-9
                       xl:p-10"
          >
            {/* tabs — underline, per the design. A framer `layoutId` slider was
                considered and rejected: its parent chain contains a motion.div
                animating `height` on the very same click, which is the classic
                one-frame jitter. A colour transition on a pseudo-element cannot
                jitter. Removing the old pill background also removed the only
                focus affordance, hence the explicit focus-visible ring. */}
            {isTabbed && (
              <div role="tablist" aria-label={t('text-login')} className="mb-6 flex gap-7 border-b border-stone-200">
                {(['login', 'register'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => setMode(m)}
                    className={`relative -mb-px rounded-sm pb-3 text-[15px] font-semibold transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-[2.5px] after:rounded-full after:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 focus-visible:ring-offset-2 ${
                      mode === m
                        ? 'text-forest-900 after:bg-forest-700'
                        : 'text-stone-400 after:bg-transparent hover:text-forest-800'
                    }`}
                  >
                    {m === 'login' ? t('signin-tab-login') : t('signin-tab-register')}
                  </button>
                ))}
              </div>
            )}

            <h1 className="font-pahserif text-[26px] font-medium text-forest-900 sm:text-[28px]">
              {mode === 'login'
                ? t('signin-welcome')
                : mode === 'register'
                  ? t('signin-create-account')
                  : mode === 'phone'
                    ? 'Login with Phone'
                    : 'Reset your password'}
            </h1>
            {/* min-h reserves the taller of the two states. The register copy wraps to two
                lines and the login copy does not, so without this the form below shifted
                down every time you switched tabs — under the very heading you were reading. */}
            <p className="mb-6 mt-1 min-h-[2.5rem] text-[14px] text-stone-500 sm:min-h-[1.25rem]">
              {mode === 'login' && t('signin-login-sub')}
              {mode === 'phone' && 'We will send a 6-digit code to your phone by SMS.'}
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

            {/* Every view renders HERE, in the card, rather than punching out
                into a dialog over the page it was launched from.

                Exactly one view is mounted at a time: keeping both tabbed forms
                stacked put two inputs named "email" and two named "password" at
                the same coordinates, which is what autofill and password managers
                act on regardless of `invisible`. The card height that stacking
                used to reserve is animated instead.

                boxRef must stay the IMMEDIATE child of the height-animated
                motion.div — move the card's padding onto it and the
                ResizeObserver starts reporting padding-inclusive heights, which
                makes every swap overshoot.

                Only the login/register pair is height-pinned; WhatsApp and reset
                measure themselves. */}
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
                        onPhoneOtp={(phone) => {
                          setOtpPrefill(phone);
                          setMode('phone');
                        }}
                      />
                    ) : mode === 'register' ? (
                      <RegisterForm
                        onSwitchToLogin={() => setMode('login')}
                        onPhoneOtp={() => {
                          setOtpPrefill(undefined);
                          setMode('phone');
                        }}
                      />
                    ) : mode === 'phone' ? (
                      <OtpLoginView inline channel="sms" prefillPhone={otpPrefill} onBack={() => setMode('login')} />
                    ) : (
                      <ForgotUserPassword inline onBack={() => setMode('login')} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          <SigninFeatures className="lg:col-start-1 lg:row-start-2" />
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
