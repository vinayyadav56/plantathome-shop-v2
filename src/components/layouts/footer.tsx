'use client';
import Link from 'next/link';
import React from 'react';
import { useTranslation } from 'next-i18next';
import { useSettings, useSubscription } from '@/framework/settings';
import { useTypes } from '@/framework/type';
import { TYPES_PER_PAGE } from '@/framework/client/variables';
import { getVerticalMeta } from '@/components/storefront/verticals';
import { WordmarkStacked } from '@/components/storefront/logo-mark';
import InlineLanguageSelect from '@/components/ui/inline-language-select';

const COLS: { title: string; links: { name: string; href: string }[] }[] = [
  {
    title: 'Plant Care',
    links: [
      { name: 'Care Guides', href: '/plant-doctor' },
      { name: 'Repotting', href: '/plant-doctor' },
      { name: 'Plant Doctor', href: '/plant-doctor' },
      { name: 'Watering Tips', href: '/plant-doctor' },
      { name: 'Light Guide', href: '/plant-doctor' },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'Our Story', href: '/contact' },
      { name: 'Sustainability', href: '/garden-service' },
      { name: 'Stores', href: '/contact' },
      { name: 'Careers', href: '/contact' },
      { name: 'Contact Us', href: '/contact' },
    ],
  },
  {
    title: 'Help',
    links: [
      { name: 'Track Order', href: '/track-order' },
      { name: 'Shipping & Returns', href: '/terms' },
      { name: 'Bulk & Corporate', href: '/corporate-gifting' },
      { name: 'FAQ', href: '/terms' },
      { name: 'Contact Us', href: '/contact' },
    ],
  },
];

const SOCIALS: { name: string; href: string; icon: JSX.Element }[] = [
  { name: 'Instagram', href: 'https://instagram.com/plantathome', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" /></svg>) },
  { name: 'Facebook', href: 'https://facebook.com/plantathome', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden><path d="M14.5 21v-7h2.6l.4-3h-3V9.1c0-.9.3-1.5 1.6-1.5h1.5V4.9c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8V11H9v3h2.7v7" /></svg>) },
  { name: 'YouTube', href: 'https://youtube.com/@plantathome', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="M10.2 9.5l5 2.5-5 2.5Z" fill="currentColor" stroke="none" /></svg>) },
  { name: 'Pinterest', href: 'https://pinterest.com/plantathome', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden><circle cx="12" cy="12" r="9.5" /><path d="M9.5 17.5 12 8m0 0c2-1.5 4 .2 4 2.4 0 2-1.4 3.6-3.2 3.6-1 0-1.8-.6-1.8-1.6" /></svg>) },
];

const BADGES: { label: string; icon: JSX.Element }[] = [
  { label: 'Peat-free soil & recycled pots', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 9-9 0 5-2 9-2 9" /><path d="M11 20c0-3 1-6 3-8" /></svg>) },
  { label: 'Carbon-neutral delivery', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M5 17H3V6h11v11" /><path d="M14 9h4l3 3v5h-2" /><circle cx="7.5" cy="18" r="1.8" /><circle cx="17.5" cy="18" r="1.8" /></svg>) },
  { label: '30-day plant guarantee', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M12 3 5 6v5c0 4 3 7 7 9 4-2 7-5 7-9V6Z" /><path d="m9 12 2 2 4-4" /></svg>) },
  { label: 'Secure checkout', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>) },
];

const PayMark = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <span aria-label={label} className="inline-flex h-[22px] w-[34px] items-center justify-center rounded-[4px] border border-white/20 text-[8px] font-bold tracking-tight text-white/60">
    {children}
  </span>
);

const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

function NewsletterForm() {
  const { t } = useTranslation('common');
  const [email, setEmail] = React.useState('');
  const { mutate: subscribe, isLoading, isSubscribed } = useSubscription();
  return (
    <div className="w-full lg:w-[430px]">
      <form
        onSubmit={(e) => { e.preventDefault(); if (email.trim() && !isLoading) subscribe({ email: email.trim() }); }}
        className="flex items-center gap-2.5 rounded-[14px] border border-white/[0.14] bg-white/[0.07] py-1.5 pe-1.5 ps-4"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px] shrink-0 text-[#86EFAC]" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3.5 7 8.5 6 8.5-6" /></svg>
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder={t('footer-newsletter-email-placeholder')} aria-label="Email address"
          className="min-w-0 flex-1 bg-transparent py-3 font-hanken text-[15px] text-white outline-none placeholder:text-white/40"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex shrink-0 items-center gap-2 rounded-[10px] bg-ds-cta px-6 py-3 font-hanken text-[13.5px] font-bold text-ds-cta-ink transition duration-200 hover:bg-ds-cta-hover active:scale-[0.97] disabled:opacity-60"
        >
          {isSubscribed ? t('footer-newsletter-subscribed') : t('footer-newsletter-subscribe')}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden><path d="M5 12h13M13 6l6 6-6 6" /></svg>
        </button>
      </form>
      <p className="mt-2.5 flex items-center gap-2 font-hanken text-[12px] text-white/45">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 shrink-0" aria-hidden><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
        {t('footer-newsletter-privacy-note')}
      </p>
    </div>
  );
}

const Footer = () => {
  const { t } = useTranslation('common');
  const { settings }: any = useSettings();
  const contact = settings?.contactDetails ?? {};
  const email = contact?.emailAddress || settings?.contactEmail || 'hello@plantathome.in';
  const phone = contact?.contact || settings?.contactPhone || '+91 98765 43210';
  // Company address is admin-managed (Settings → Company Information); the locale
  // string is only a fallback for a blank installation.
  const address = contact?.location?.formattedAddress || t('footer-address');
  const year = new Date().getFullYear();

  // Shop column from the live catalogue (works on staging's 6 verticals and
  // production's 3, whose slugs differ) + the All Categories index.
  const { types } = useTypes({ limit: TYPES_PER_PAGE } as any);
  const cols = React.useMemo(() => {
    const shopLinks = (types ?? []).map((ty: any) => {
      const meta = getVerticalMeta(ty.slug, ty.name);
      return { name: ty.name ?? meta.label, href: meta.shopPath ?? meta.path };
    });
    return [
      {
        title: 'Shop',
        links: [...shopLinks, { name: 'All Categories', href: '/categories' }],
      },
      ...COLS,
    ];
  }, [types]);

  return (
    <footer className="relative overflow-hidden g-footer text-white/80">

      {/* ── decorative layers ── */}
      {/* grain texture */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.045] mix-blend-overlay"
        style={{ backgroundImage: GRAIN, backgroundSize: '180px 180px' }}
      />
      {/* top-right green radial glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 z-0 h-[500px] w-[500px] rounded-full bg-[radial-gradient(ellipse,rgba(74,222,128,0.09)_0%,transparent_65%)]" />
      {/* bottom-left warm glow */}
      <div className="pointer-events-none absolute -bottom-24 -left-16 z-0 h-[400px] w-[400px] rounded-full bg-[radial-gradient(ellipse,rgba(134,239,172,0.06)_0%,transparent_65%)]" />
      {/* large ghost leaf watermark */}
      <svg
        aria-hidden
        className="pointer-events-none absolute -bottom-16 right-8 z-0 opacity-[0.04]"
        width="480" height="480" viewBox="0 0 24 24" fill="white" stroke="none"
      >
        <path d="M11 21A8 8 0 0 1 3 13c0-6 5-10 10-10 0 6-2.5 10-2.5 10S15 11 19 11c0 5-4 9-8 10Z" />
      </svg>

      {/* ── newsletter band ── */}
      <div className="relative z-[1] border-b border-white/[0.09]">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-14 lg:px-16 lg:py-[52px]">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.12] bg-white/[0.06] px-3.5 py-1.5">
              <span className="relative flex h-[7px] w-[7px] shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ADE80] opacity-70" />
                <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-[#4ADE80]" />
              </span>
              <span className="font-hanken text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#86EFAC]">
                {t('footer-newsletter-eyebrow')}
              </span>
            </div>
            <h3 className="font-cormorant mt-4 text-[2.2rem] font-medium leading-[1.02] tracking-[0.01em] text-white sm:text-[2.8rem]">
              {t('footer-newsletter-heading')}
            </h3>
            <p className="mt-3 max-w-[440px] font-hanken text-[14.5px] leading-relaxed text-white/68">
              {t('footer-newsletter-subheading')}
            </p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      {/* ── main grid: brand + link columns ── */}
      <div className="relative z-[1] mx-auto grid max-w-7xl grid-cols-2 gap-x-8 gap-y-10 px-5 py-12 sm:px-8 md:grid-cols-4 md:gap-x-6 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] lg:gap-10 lg:px-16 lg:pb-[46px] lg:pt-[54px]">

        {/* brand column */}
        <div className="col-span-2 md:col-span-4 lg:col-span-1 lg:max-w-[300px]">
          <WordmarkStacked light className="[&_*]:!text-white" />
          <p className="mt-4 text-[13.5px] leading-relaxed text-white/62">{t('footer-brand-description')}</p>

          {/* contact */}
          <div className="mt-5 flex flex-col gap-2.5">
            <span className="flex items-center gap-3 text-[13px] text-white/60">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[14px] w-4 shrink-0 text-[#86EFAC]" aria-hidden><path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
              {address}
            </span>
            <a href={`tel:${phone}`} className="flex items-center gap-3 text-[13px] text-white/60 transition hover:text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[14px] w-4 shrink-0 text-[#86EFAC]" aria-hidden><path d="M5.5 3h3l1.7 4.3-2 1.6a13.5 13.5 0 0 0 6 6l1.6-2L20 14.6v3.1A2.3 2.3 0 0 1 17.7 20 15.8 15.8 0 0 1 4 6.3 2.3 2.3 0 0 1 5.5 3Z" /></svg>
              {phone}
            </a>
            <a href={`mailto:${email}`} className="flex items-center gap-3 text-[13px] text-white/60 transition hover:text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[14px] w-4 shrink-0 text-[#86EFAC]" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3.5 7 8.5 6 8.5-6" /></svg>
              {email}
            </a>
          </div>

          {/* socials */}
          <div className="mt-6 flex items-center gap-2">
            {SOCIALS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.name}
                className="grid h-9 w-9 place-items-center rounded-[10px] border border-white/[0.12] bg-white/[0.05] text-white/55 transition duration-200 hover:border-[#4ADE80]/40 hover:bg-[#4ADE80]/10 hover:text-[#86EFAC] active:scale-90"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* link columns */}
        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="mb-5 text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#86EFAC]">
              {col.title}
            </h4>
            <ul className="flex flex-col gap-3">
              {col.links.map((l) => (
                <li key={l.name}>
                  <Link
                    href={l.href}
                    className="group inline-flex items-center gap-1.5 text-[13.5px] text-white/55 transition-colors duration-200 hover:text-white md:text-[12.5px] lg:text-[13.5px]"
                  >
                    <span className="h-px w-0 rounded-full bg-[#4ADE80] transition-all duration-300 group-hover:w-3" />
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── sustainability badge strip ── */}
      <div className="relative z-[1] border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-5 py-5 sm:px-8 lg:px-16">
          {BADGES.map((b) => (
            <span
              key={b.label}
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.11] bg-white/[0.04] px-4 py-1.5 font-hanken text-[12px] text-white/65 transition-colors duration-200 hover:border-[#4ADE80]/30 hover:text-white/85"
            >
              <span className="text-[#86EFAC]">{b.icon}</span>
              {b.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── bottom bar ── */}
      <div className="relative z-[1] border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-5 text-[12.5px] sm:flex-row sm:px-8 lg:px-16">
          <span className="text-white/40">© {year} {t('footer-copyright')}</span>
          <InlineLanguageSelect tone="dark" className="order-first sm:order-none" />
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/privacy" className="text-white/45 transition hover:text-white">{t('footer-privacy')}</Link>
            <Link href="/terms" className="text-white/45 transition hover:text-white">{t('footer-terms')}</Link>
            <Link href="/track-order" className="text-white/45 transition hover:text-white">{t('footer-track-order')}</Link>
            <span className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-1.5">
              <PayMark label="Visa"><span className="italic">VISA</span></PayMark>
              <PayMark label="Mastercard"><svg viewBox="0 0 36 22" className="h-3.5 w-auto" aria-hidden><circle cx="14" cy="11" r="7" fill="currentColor" opacity="0.7" /><circle cx="22" cy="11" r="7" fill="currentColor" opacity="0.4" /></svg></PayMark>
              <PayMark label="UPI">UPI</PayMark>
              <PayMark label="RuPay">RuPay</PayMark>
            </div>
          </div>
        </div>
      </div>

      {/* clears fixed mobile bottom nav */}
      <div className="h-[68px] md:hidden" aria-hidden />
    </footer>
  );
};

export default Footer;
