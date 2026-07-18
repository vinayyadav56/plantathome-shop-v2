'use client';
import React from 'react';
import Link from 'next/link';
import { useSubscription } from '@/framework/settings';
import { Hero } from './hero';
import { SearchBar } from './search-bar';
import { CategoryCircles } from './category-circles';
import { SpecialOffer } from './special-offer';
import { VerticalsRail } from './verticals-rail';
import { Collections } from './collections';
import { BestSellers } from './best-sellers';
import { TrustRow } from './trust-row';
import { WhyPlants } from './why-plants';
import { CorporateGifting } from './corporate-gifting';
import { Gifting } from './gifting';
import { BottomNav } from './bottom-nav';

/* ============ FOOTER (Claude Design) ============ */
const FOOTER_COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Shop',
    links: [
      { label: 'Indoor Plants', href: '/plants/search' },
      { label: 'Planters & Pots', href: '/plants/search' },
      { label: 'Plant Gifts', href: '/plants/search' },
      { label: 'Sale', href: '/plants/search' },
    ],
  },
  {
    title: 'Care',
    links: [
      { label: 'Care Guides', href: '#' },
      { label: 'Repotting', href: '#' },
      { label: 'Plant Doctor', href: '/plant-doctor' },
      { label: 'FAQ', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Our Story', href: '#' },
      { label: 'Sustainability', href: '#' },
      { label: 'Stores', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
];

const FOOTER_SOCIAL: { name: string; faClass: string; href: string }[] = [
  { name: 'Instagram', faClass: 'fa-instagram', href: 'https://instagram.com/plantathome' },
  { name: 'Pinterest', faClass: 'fa-pinterest', href: 'https://pinterest.com/plantathome' },
  { name: 'Facebook', faClass: 'fa-facebook-f', href: 'https://facebook.com/plantathome' },
  { name: 'YouTube', faClass: 'fa-youtube', href: 'https://youtube.com/@plantathome' },
];

function Footer() {
  const [email, setEmail] = React.useState('');
  const { mutate: subscribe, isLoading, isSubscribed } = useSubscription();
  return (
    <footer className="relative mt-[26px] overflow-hidden bg-forest-900 px-[22px] pb-[88px] pt-[34px] text-[#E7EEE2] md:pb-6">
      {/* faint botanical ornament */}
      <svg
        className="absolute right-[-26px] top-[-22px] z-0 opacity-[0.07]"
        width="168"
        height="168"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#DCC07A"
        strokeWidth="0.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 22V5" />
        <path d="M12 10c0-3.2 2.2-5.7 6.2-6.2C18 7.6 15.6 10 12 10Z" />
        <path d="M12 13c0-2.7-1.9-4.8-5.2-5.2C6.6 11.3 9 13 12 13Z" />
        <path d="M12 7.5c0-2 1.2-3.6 3.4-4" />
      </svg>

      <div className="relative z-[1]">
        {/* newsletter / brand moment */}
        <div className="text-center">
          <span className="font-jost text-[9.5px] font-medium uppercase tracking-[0.32em] text-gold-300">
            Join the plant club
          </span>
          <h3 className="font-pahserif mt-[9px] text-[28px] font-medium leading-[1.06] tracking-[0.01em] text-[#FCFBF6]">
            Grow with us.
          </h3>
          <p
            className="mx-auto mt-2 max-w-[252px] text-[11.5px] leading-[1.5]"
            style={{ color: 'rgba(231,238,226,0.62)' }}
          >
            Plant care tips, new arrivals, and members-only offers — gently, never spammy.
          </p>

          {/* email field */}
          <form
            onSubmit={(e) => { e.preventDefault(); if (email.trim() && !isLoading) subscribe({ email: email.trim() }); }}
            className="mt-4 flex items-center gap-2 rounded-[12px] border py-[5px] pl-[14px] pr-[5px]"
            style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(231,238,226,0.18)' }}
          >
            <i className="fa-solid fa-envelope text-[16px] text-sage-300" aria-hidden />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              aria-label="Email address"
              className="min-w-0 flex-1 border-none bg-transparent py-2 font-hanken text-[13px] text-white outline-none placeholder:text-white/45"
            />
            <button
              type="submit"
              aria-label="Subscribe"
              disabled={isLoading}
              className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[9px] border-none bg-ds-btn transition-colors hover:bg-ds-btn-hover active:scale-90 active:bg-forest-700 disabled:opacity-60"
            >
              {isSubscribed
                ? <i className="fa-solid fa-check text-[14px] text-white" aria-hidden />
                : <i className="fa-solid fa-arrow-right text-[14px] text-white" aria-hidden />
              }
            </button>
          </form>
        </div>

        {/* divider */}
        <div
          className="my-6 h-px"
          style={{
            background:
              'linear-gradient(90deg,rgba(231,238,226,0),rgba(231,238,226,0.16),rgba(231,238,226,0))',
          }}
        />

        {/* link columns */}
        <div className="grid grid-cols-3 gap-[14px]">
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <div className="mb-3 font-jost text-[9px] font-medium uppercase tracking-[0.2em] text-gold-300">
                {col.title}
              </div>
              <div className="flex flex-col gap-2.5">
                {col.links.map((lk) => (
                  <Link
                    key={lk.label}
                    href={lk.href}
                    className="text-[12px] leading-[1.1] text-[rgba(231,238,226,0.74)] transition-colors hover:text-white"
                  >
                    {lk.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* social */}
        <div className="mt-7 flex justify-center gap-[11px]">
          {FOOTER_SOCIAL.map((s) => (
            <a
              key={s.name}
              href={s.href}
              aria-label={s.name}
              className="flex h-[38px] w-[38px] items-center justify-center rounded-full border transition-colors hover:border-[rgba(231,238,226,0.42)] hover:bg-white/[0.08] hover:text-white active:scale-90"
              style={{ borderColor: 'rgba(231,238,226,0.2)', color: 'rgba(231,238,226,0.82)' }}
            >
              <i className={`fa-brands ${s.faClass} text-[18px]`} aria-hidden />
            </a>
          ))}
        </div>

        {/* sustainability strip */}
        <div
          className="mt-[22px] flex items-center justify-center gap-2.5 rounded-[11px] border px-[14px] py-[11px]"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(231,238,226,0.1)' }}
        >
          <i className="fa-solid fa-leaf text-[15px] text-sage-300" aria-hidden />
          <span className="text-[10px] leading-[1.4]" style={{ color: 'rgba(231,238,226,0.7)' }}>
            Peat-free soil · Recycled pots · Carbon-neutral delivery
          </span>
        </div>

        {/* bottom bar */}
        <div
          className="mt-6 flex flex-col items-center gap-[13px] border-t pt-[18px]"
          style={{ borderColor: 'rgba(231,238,226,0.12)' }}
        >
          {/* white logo lockup (no white asset shipped — reproduce wordmark in white) */}
          <div
            className="flex items-end gap-[7px]"
            aria-label="Plant At Home — Bring Nature Home"
            role="img"
          >
            <span className="font-jost text-[15px] font-normal uppercase tracking-[0.3em] text-white">
              PLANT
            </span>
            <span className="relative inline-flex items-center justify-center">
              <svg
                className="absolute -top-[9px]"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#DCC07A"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 21V11" />
                <path d="M12 11c0-3.5 2.5-6 6.5-6.5C18 8.5 15.5 11 12 11Z" />
                <path d="M12 13c0-3-2-5-5.5-5.5C6 11 8.5 13 12 13Z" />
              </svg>
              <span className="font-jost text-[15px] font-normal uppercase tracking-[0.2em] text-white">
                AT
              </span>
            </span>
            <span className="font-jost text-[15px] font-normal uppercase tracking-[0.3em] text-white">
              HOME
            </span>
          </div>
          <div className="flex items-center gap-[14px]">
            <span className="text-[10px]" style={{ color: 'rgba(231,238,226,0.5)' }}>
              © 2026 Plant At Home
            </span>
            <a
              href="#"
              className="text-[10px] transition-colors hover:text-white"
              style={{ color: 'rgba(231,238,226,0.5)' }}
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-[10px] transition-colors hover:text-white"
              style={{ color: 'rgba(231,238,226,0.5)' }}
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Faithful reproduction of the Claude Design "PlantAtHome Mobile Home" (current
 * version) — Hanken Grotesk / Jost / Cormorant, forest/clay/gold/cream — bound to
 * live, city-scoped data. Centred as an app column on desktop (mobile <lg only).
 */
export default function PahHome(_props: { variables?: any }) {
  return (
    <div className="min-h-screen w-full bg-cream-100 font-hanken text-forest-900 antialiased">
      <div className="mx-auto min-h-screen max-w-[440px] overflow-hidden bg-cream-50 shadow-[0_0_60px_-30px_rgba(34,48,26,0.3)]">
        <Hero />
        <div className="relative rounded-t-[22px] bg-cream-50 pb-[calc(72px+env(safe-area-inset-bottom))]">
          <SearchBar />
          <CategoryCircles />
          <SpecialOffer />
          <VerticalsRail />
          <Collections />
          <BestSellers />
          <TrustRow />
          <WhyPlants />
          <CorporateGifting />
          <Gifting />
          <Footer />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
