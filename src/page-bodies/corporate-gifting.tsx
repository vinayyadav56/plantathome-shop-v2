'use client';

/**
 * /corporate-gifting — "Request a Custom Proposal" (owner's spec and mocks, 2026-10-17):
 * hero → one enquiry form with its live summary, help card and why-list → the buyable
 * hampers → the trust row. The copy lives in components/corporate-gifting/content; the
 * hampers, their prices and the contact details come from the API.
 */

import Link from 'next/link';
import { getLayout as getSiteLayout } from '@/components/layouts/layout';
import Hero from '@/components/corporate-gifting/hero';
import EnquirySection from '@/components/corporate-gifting/enquiry-section';
import GiftingTiers from '@/components/corporate-gifting/gifting-tiers';
import { HAMPERS, TRUST } from '@/components/corporate-gifting/content';
import { useGiftingTemplates } from '@/framework/garden';
import { ArrowRight, CircleCheck } from '@/components/ui/icon';

function CorporateGiftingPage() {
  // The hampers section exists only when the API lists a hamper (the same query GiftingTiers
  // reads — one request).
  const { data } = useGiftingTemplates();
  const hasTiers = (data?.data?.length ?? 0) > 0;

  return (
    <main id="main-content" className="bg-page pb-14 sm:pb-20">
      <Hero />
      {/* 20px gutters on phones: the hampers rail (.pah-rail) bleeds 20px into this padding. */}
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mt-6 lg:mt-8">
          <EnquirySection />
        </div>

        {hasTiers && (
          <section aria-labelledby="hampers-title" className="mt-10 lg:mt-14">
            <div className="flex items-end justify-between gap-4">
              <h2 id="hampers-title" className="font-heading text-[24px] leading-tight text-forest-900 lg:text-[28px]">
                {HAMPERS.title}
              </h2>
              <Link
                href={HAMPERS.href}
                className="inline-flex shrink-0 items-center gap-1 text-[14px] font-semibold text-forest-700 hover:text-forest-900"
              >
                {HAMPERS.link}
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
            <div className="mt-5">
              <GiftingTiers className="pah-rail gap-4 [--rail-w:84%] sm:[--rail-w:48%] lg:[--rail-w:calc((100%_-_32px)/3)]" />
            </div>
          </section>
        )}

        <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 lg:mt-14">
          {TRUST.map((t) => (
            <li key={t} className="flex items-start gap-2.5">
              <CircleCheck size={20} aria-hidden className="mt-px shrink-0 text-forest-700" />
              <span className="text-[13px] font-medium leading-snug text-forest-900">{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

CorporateGiftingPage.getLayout = getSiteLayout;

export default CorporateGiftingPage;

/* ── App Router body wrapper (V1 _app.tsx getLayout semantics) ── */
export function PageBody() {
  return CorporateGiftingPage.getLayout(<CorporateGiftingPage />);
}
