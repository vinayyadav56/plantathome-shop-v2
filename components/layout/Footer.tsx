'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Logo } from './Logo';
import { useVerticals } from '@/lib/hooks/useVerticals';

const COLS = [
  {
    title: 'Plant Care',
    links: [
      ['Care guides', '/pages/care-guides'],
      ['Repotting', '/pages/repotting'],
      ['Plant Doctor', '/plant-doctor'],
      ['Watering & light', '/pages/watering'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['Our story', '/pages/about'],
      ['Sustainability', '/pages/sustainability'],
      ['Careers', '/pages/careers'],
      ['Contact', '/pages/contact'],
    ],
  },
  {
    title: 'Help',
    links: [
      ['Track order', '/track-order'],
      ['Shipping & returns', '/pages/shipping'],
      ['Bulk & corporate', '/offers'],
      ['FAQ', '/pages/faq'],
    ],
  },
];

const SUSTAIN = ['Peat-free', 'Carbon-neutral delivery', '30-day guarantee', 'Secure checkout'];
const PAY = ['visa', 'master', 'rupay', 'upi'];

export function Footer() {
  const { verticals } = useVerticals();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="g-footer mt-24 text-cream">
      {/* Newsletter band */}
      <div className="border-b border-cream/10">
        <div className="container-wide flex flex-col items-center gap-6 py-14 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cta">Join the plant club</p>
            <h2 className="mt-1 font-pahserif text-3xl font-semibold text-cream md:text-4xl">Grow with us.</h2>
            <p className="mt-1 text-sm text-cream/70">Care tips, new arrivals & members-only drops. No spam, ever.</p>
          </div>
          <form
            className="flex w-full max-w-md items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (email) setSubscribed(true);
            }}
          >
            {subscribed ? (
              <p className="rounded-full bg-cta/15 px-5 py-3 text-sm font-medium text-cta">You’re in — welcome to the club! 🌱</p>
            ) : (
              <>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full rounded-full border-cream/20 bg-cream/10 px-5 py-3 text-sm text-cream placeholder:text-cream/50 focus:border-cta focus:ring-0"
                />
                <button type="submit" className="btn-cta shrink-0 px-6 py-3">Subscribe</button>
              </>
            )}
          </form>
        </div>
      </div>

      {/* Main grid */}
      <div className="container-wide grid grid-cols-2 gap-10 py-14 md:grid-cols-5">
        <div className="col-span-2 md:col-span-1">
          <Logo dark />
          <p className="mt-4 max-w-xs text-sm text-cream/70">
            Rare foliage, premium tools & farm-fresh produce — delivered thriving from nurseries near you.
          </p>
          <div className="mt-5 flex gap-3">
            {['instagram', 'facebook', 'youtube', 'pinterest'].map((s) => (
              <a key={s} href="#" aria-label={s} className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/10 text-cream/80 transition hover:bg-cta hover:text-cta-ink">
                <span className="text-xs font-semibold capitalize">{s[0]}</span>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-cta">Shop</h3>
          <ul className="space-y-2.5 text-sm text-cream/75">
            {verticals.map((v) => (
              <li key={v.key}>
                <Link href={v.path} className="hover:text-cream">{v.label}</Link>
              </li>
            ))}
            <li><Link href="/categories" className="hover:text-cream">All categories</Link></li>
          </ul>
        </div>

        {COLS.map((col) => (
          <div key={col.title}>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-cta">{col.title}</h3>
            <ul className="space-y-2.5 text-sm text-cream/75">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-cream">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Sustainability strip */}
      <div className="border-y border-cream/10">
        <div className="container-wide flex flex-wrap items-center justify-center gap-x-8 gap-y-2 py-4 text-xs font-medium text-cream/70">
          {SUSTAIN.map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-cta"><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="container-wide flex flex-col items-center justify-between gap-3 py-6 text-xs text-cream/60 sm:flex-row">
        <p>© {new Date().getFullYear()} PlantAtHome. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/pages/privacy" className="hover:text-cream">Privacy</Link>
          <Link href="/pages/terms" className="hover:text-cream">Terms</Link>
          <div className="flex items-center gap-1.5">
            {PAY.map((p) => (
              <span key={p} className="rounded bg-cream/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-cream/70">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
