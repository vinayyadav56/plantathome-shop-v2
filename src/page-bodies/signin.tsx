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
 * The supplied artwork IS this page.
 *
 * `/signin-hero-wide.png` already carries the logo, the headline, the sub-line, the
 * four benefits, the script signature and the category row. None of that is
 * re-drawn in HTML on top of it, and NOTHING tints it — no scrim, no gradient,
 * no overlay of any kind. The only thing above the picture is the login card.
 *
 * The owner chose this over a rebuilt HTML panel knowing the trade: that copy
 * is pixels, so it does not translate, does not resize for a screen reader and
 * is not indexed. The route is `noindex` regardless.
 *
 * Renders standalone (no site header/footer). Auth success redirects via the
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

  // Only the active view is mounted, so the card's height changes on every
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

  // Sign Up is taller than Login, so on a short viewport switching tabs crosses
  // the scroll threshold: a vertical scrollbar appears, the viewport narrows by
  // its width, and the backdrop narrows with it — the picture visibly jumps
  // mid-transition (annotated: "image size became change"). Reserving the
  // gutter for as long as this page is mounted keeps the viewport one constant
  // width, so nothing behind the card ever moves.
  useEffect(() => {
    const root = document.documentElement;
    const prevGutter = root.style.scrollbarGutter;
    const prevOverflow = root.style.overflowY;
    // Both, deliberately. `scrollbar-gutter` covers browsers with overlay
    // scrollbars and is the tidier of the two, but Chrome only honours it on
    // the root once the root is actually a scroll container — which it is not
    // while the Login form fits the viewport exactly. Pinning overflow-y to
    // scroll guarantees the gutter exists in every state.
    root.style.scrollbarGutter = 'stable';
    root.style.overflowY = 'scroll';
    return () => {
      root.style.scrollbarGutter = prevGutter;
      root.style.overflowY = prevOverflow;
    };
  }, []);

  // Any auth method (password / Google / WhatsApp) flips the atom → leave the page.
  useEffect(() => {
    if (isAuthorized) router.replace(redirect);
  }, [isAuthorized, redirect, router]);

  return (
    <>
      <Seo title="Sign in" url="signin" noindex nofollow />
      {/* The page ground is sampled from the artwork's own edge, so the
          letterbox bands either side of it at wide aspect ratios read as part
          of the picture rather than as empty margin. */}
      <div className="relative min-h-[100svh] bg-[#eef1ea]">
        {/* ── the artwork, untouched ──────────────────────────────────────────
            `fixed`, not absolute: inside normal flow a `fill` image stretches to
            the whole SCROLLED page height, so the crop goes wrong and
            `sizes="100vw"` stops describing a real box.

            `object-contain` from lg up. A cover crop loses ~200px vertically at
            16:9, which eats the logo at the top and the category row along the
            bottom — the two things that make this the supplied design rather
            than a stock plant photo. Below lg the composition is unreadable at
            that scale anyway, so it becomes a plain backdrop and covers. */}
        {/* The filename is versioned on purpose. public/ root media is served
            `immutable, max-age=31536000` (see next.config headers), so replacing
            the bytes behind an existing name leaves browsers and the CDN happily
            serving last year's artwork — which is exactly what happened when the
            3:2 version was swapped for this 16:9 one in place. New art, new name. */}
        <div className="fixed inset-0" aria-hidden>
          <Image
            src="/signin-hero-wide.png"
            alt=""
            fill
            priority
            sizes="100vw"
            quality={75}
            className="object-cover object-[70%_center] lg:object-contain lg:object-center"
          />
        </div>

        {/* ── the card ────────────────────────────────────────────────────────
            Rendered ONCE. A separate desktop and mobile copy would put two
            inputs named "email" and two named "password" in the document at the
            same time, which is what autofill and password managers act on. */}
        <div className="relative z-10 flex min-h-[100svh] items-start justify-center px-4 py-8 lg:items-center lg:p-0">
          {/* At lg this box reproduces the artwork's rendered rectangle exactly:
              same 3:2 ratio, same "largest box that fits the viewport" cap that
              object-contain applies. That is what lets the card be positioned
              against the PICTURE — the same spot the mock puts it — instead of
              against the viewport, which would drift away from the artwork as
              the letterbox bands grow. */}
          <div className="w-full max-w-[460px] lg:relative lg:aspect-[1672/941] lg:max-w-[min(100vw,calc(100svh*1.7768))]">
            {/* Top-anchored, never centred: Sign Up is taller than Login, and a
                vertically-centred card absorbs that difference from both edges,
                sliding the tabs up under the pointer that just clicked them.
                Measured at 38px before this was pinned. */}
            <div
              className="rounded-[20px] bg-white px-6 py-7 shadow-[0_18px_50px_rgba(31,48,32,0.28)] sm:px-8
                         lg:absolute lg:top-[5%] lg:right-[3%] lg:max-h-[90%] lg:w-[34%] lg:overflow-y-auto
                         lg:px-7 lg:py-7 lg:shadow-[0_18px_50px_rgba(31,48,32,0.18)] xl:px-9"
            >
              {/* tabs — underline, per the design. A framer `layoutId` slider was
                  considered and rejected: its parent chain contains a motion.div
                  animating `height` on the very same click, which is the classic
                  one-frame jitter. A colour transition on a pseudo-element cannot
                  jitter. */}
              {isTabbed && (
                <div role="tablist" aria-label={t('text-login')} className="mb-6 flex gap-8 border-b border-stone-200">
                  {(['login', 'register'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="tab"
                      aria-selected={mode === m}
                      onClick={() => setMode(m)}
                      className={`relative -mb-px rounded-sm pb-3 text-[15px] font-semibold transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-[2.5px] after:rounded-full after:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 focus-visible:ring-offset-2 ${
                        mode === m
                          ? 'text-forest-800 after:bg-forest-700'
                          : 'text-stone-400 after:bg-transparent hover:text-forest-700'
                      }`}
                    >
                      {m === 'login' ? t('signin-tab-login') : t('signin-tab-register')}
                    </button>
                  ))}
                </div>
              )}

              <h1 className="text-center text-[24px] font-bold text-forest-900 sm:text-[26px]">
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
              <p className="mb-6 mt-1 min-h-[2.5rem] text-center text-[14px] text-stone-500 sm:min-h-[1.25rem]">
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
                  makes every swap overshoot. */}
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
