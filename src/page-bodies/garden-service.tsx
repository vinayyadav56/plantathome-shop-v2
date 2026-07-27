'use client';

import { useForm } from 'react-hook-form';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { getLayout as getSiteLayout } from '@/components/layouts/layout';
import Seo from '@/components/seo/seo';
import { useGardenTemplates, useSubmitGardenLead, GardenLeadInput } from '@/framework/garden';
import StateCitySelect from '@/components/location/state-city-select';
import LineIcon from '@/components/icons/line-icons';
import { GsIcon, GoldStar } from '@/components/garden-service/icons';
import { EXPO } from '@/components/storefront/motion';


const PHONE = '+918000000000';
const GARDEN_TYPES = ['Balcony', 'Terrace', 'Backyard', 'Indoor', 'Rooftop'];
const BUDGETS = ['Under ₹15,000', '₹15,000–₹40,000', '₹40,000–₹90,000', '₹90,000+'];

const STEPS = [
  { img: '/images/garden/step1.jpg', icon: 'ruler', title: 'Tell us about your space', text: 'Share your balcony, terrace or backyard and what you dream of. Takes 30 seconds.' },
  { img: '/images/garden/step2.jpg', icon: 'sparkle', title: 'We design your package', text: 'Our botanists build a plan tailored to your light, space and budget — plants, soil, tools, visits.' },
  { img: '/images/garden/step3.jpg', icon: 'sprout', title: 'We plant & maintain', text: 'Experts set it up and visit on schedule to keep everything thriving. You just enjoy it.' },
];

const INCLUDED = [
  { icon: 'sprout', title: 'Hand-picked plants & seeds', text: 'Chosen for your exact light and climate — nothing dies on you.' },
  { icon: 'soil', title: 'Premium soil & fertilizer', text: 'Organic potting mix, compost and plant food for healthy growth.' },
  { icon: 'tools', title: 'Tools & planters', text: 'Everything you need, delivered and set up — no hardware-store runs.' },
  { icon: 'gardener', title: 'Scheduled gardener visits', text: 'Trained gardeners visit to prune, feed and care — you track every visit.' },
];

const TESTIMONIALS = [
  { name: 'Ananya R.', city: 'Bengaluru', quote: 'My empty balcony is now a jungle. The gardener visits keep everything alive — I do nothing!' },
  { name: 'Rohan M.', city: 'Mumbai', quote: 'They designed a terrace garden around my budget. Setup was spotless and the plants are thriving.' },
  { name: 'Priya S.', city: 'Delhi', quote: 'Best decision. The package had everything and I can track every visit in my account.' },
];

const FAQS = [
  { q: 'Do you build gardens for small balconies and apartments?', a: 'Absolutely. Most of our gardens are for balconies, terraces and small urban spaces. Every package is sized to your space.' },
  { q: 'What does a gardener visit include?', a: 'Watering guidance, pruning, repotting, pest care, fertilizing and replacing any plant that isn’t thriving — all tracked in your account.' },
  { q: 'Can I customise the package?', a: 'Yes — after you share your space we tailor the plants, number of visits and budget. You approve before anything is charged.' },
  { q: 'Is there a guarantee?', a: 'Yes. Every package includes our plant-health guarantee — if a plant doesn’t make it under our care, we replace it.' },
];

/* Subtle photographic grain for the dark forest bands (self-contained data URI). */
const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/* Luxury card language shared across the page (matches the product-card bar). */
const CARD =
  'rounded-[22px] border border-[#ECECEC] bg-white shadow-[0_4px_10px_rgba(0,0,0,0.04),0_20px_40px_rgba(0,0,0,0.08)]';
const CARD_HOVER =
  'transition-shadow duration-300 hover:shadow-[0_10px_18px_rgba(0,0,0,0.08),0_30px_60px_rgba(0,0,0,0.12)]';

/* NOTE: reveals never hide content — y-offset only (whileInView opacity is
   unreliable on the deployed build; see src/components/storefront/motion.tsx). */
const reveal = (delay = 0) => ({
  initial: { y: 24 },
  whileInView: { y: 0 },
  viewport: { once: true, margin: '-48px' },
  transition: { duration: 0.6, delay, ease: EXPO },
});

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] ${
        dark
          ? 'border-[#E3CE97]/30 bg-white/[0.06] text-[#E3CE97]'
          : 'border-[#B58E39]/30 bg-[#B58E39]/[0.07] text-[#B58E39]'
      }`}
    >
      <LineIcon name="leaf" className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function SectionHead({
  eyebrow,
  title,
  sub,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  dark?: boolean;
}) {
  return (
    <motion.div {...reveal()} className="mx-auto max-w-[720px] text-center">
      <Eyebrow dark={dark}>{eyebrow}</Eyebrow>
      <h2
        className={`mt-4 text-[28px] font-bold leading-[1.12] tracking-[-0.01em] sm:text-[38px] ${
          dark ? 'text-white' : 'text-[#16301A]'
        }`}
      >
        {title}
      </h2>
      {sub ? (
        <p className={`mx-auto mt-3 max-w-xl text-[15px] leading-[1.6] ${dark ? 'text-white/70' : 'text-[#5B5B5B]'}`}>
          {sub}
        </p>
      ) : null}
    </motion.div>
  );
}

/* ─── Refined inquiry form (same fields, hooks and submission as before) ─── */

const FIELD =
  'w-full rounded-[14px] border border-[#E6E3DA] bg-[#FAF9F6] px-4 py-3 text-[15px] text-[#1F2E1F] placeholder:text-[#A6A29A] transition focus:border-[#14532D] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#14532D]/10';
const LABEL = 'mb-1.5 block text-[13px] font-semibold text-[#184A31]';

function LeadForm() {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<GardenLeadInput>();
  const { mutate, isLoading } = useSubmitGardenLead();
  const [done, setDone] = useState(false);

  const onSubmit = (values: GardenLeadInput) => {
    mutate(values, {
      onSuccess: () => { setDone(true); reset(); toast.success('Thanks! Our garden team will reach out shortly.'); },
      onError: () => { toast.error('Something went wrong. Please call us instead.'); },
    });
  };

  if (done) {
    return (
      <div className={`${CARD} p-8 text-center`}>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#F3F8EC] text-[#24693E]">
          <GsIcon name="shieldCheck" className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-[#184A31]">Request received</h3>
        <p className="mt-2 text-[15px] leading-[1.6] text-[#5B5B5B]">
          Our garden experts will call you within one business day to design your free plan.
        </p>
        <a
          href={`tel:${PHONE}`}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#14532D] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#0D4324]"
        >
          <GsIcon name="phone" className="h-4 w-4" />
          Or call us now
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${CARD} p-6 sm:p-7`}>
      <h3 className="text-[21px] font-bold leading-tight text-[#184A31]">Get your free garden plan</h3>
      <p className="mt-1.5 text-[13.5px] text-[#8A8A8A]">No cost, no obligation. We’ll call you within a day.</p>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="gs-name" className={LABEL}>Full name *</label>
          <input id="gs-name" {...register('name', { required: true })} placeholder="Your name" className={FIELD} />
          {errors.name && <span className="mt-1 block text-xs font-medium text-red-600">Name is required</span>}
        </div>

        <div>
          <label htmlFor="gs-phone" className={LABEL}>Phone number *</label>
          <input id="gs-phone" {...register('phone', { required: true, minLength: 8 })} placeholder="10-digit mobile number" inputMode="tel" className={FIELD} />
          {errors.phone && <span className="mt-1 block text-xs font-medium text-red-600">A valid phone number is required</span>}
        </div>

        {/* Standardised State → City dropdowns. Hidden registers keep RHF. */}
        <input type="hidden" {...register('state')} />
        <input type="hidden" {...register('city')} />
        <div className="grid grid-cols-2 gap-3">
          <StateCitySelect
            state={watch('state')}
            city={watch('city')}
            onChange={({ state, city }) => {
              setValue('state', state);
              setValue('city', city);
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="gs-type" className={LABEL}>Garden type</label>
            <select id="gs-type" {...register('garden_type')} className={FIELD}>
              <option value="">Select</option>
              {GARDEN_TYPES.map((t) => <option key={t} value={t.toLowerCase()}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="gs-budget" className={LABEL}>Budget</label>
            <select id="gs-budget" {...register('budget_range')} className={FIELD}>
              <option value="">Select</option>
              {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="gs-message" className={LABEL}>About your space <span className="font-normal text-[#8A8A8A]">(optional)</span></label>
          <textarea id="gs-message" {...register('message')} placeholder="e.g. 6×4 ft balcony, gets morning sun" rows={2} className={FIELD} />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#14532D] px-6 py-3.5 text-[15.5px] font-semibold text-white transition hover:bg-[#0D4324] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? 'Sending…' : 'Get my free garden plan'}
        {!isLoading && <LineIcon name="arrowRight" className="h-4 w-4" />}
      </button>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-[#8A8A8A]">
        <GsIcon name="lock" className="h-3.5 w-3.5" />
        We never share your details. Trusted by 2,000+ plant parents.
      </p>
    </form>
  );
}

/* ─────────────────────────────── Page ─────────────────────────────── */

export default function GardenServicePage() {
  const { data } = useGardenTemplates();
  const templates = data?.data ?? [];
  const fmt = (n: number) => '₹' + Number(n).toLocaleString('en-IN');

  return (
    <div className="bg-[#FAF9F6]">
      <Seo
        title="Garden Service — bespoke home gardens, planted & maintained"
        description="Get a free, no-obligation garden plan tailored to your balcony, terrace or backyard. Hand-picked plants, premium soil, tools and scheduled gardener visits — all tracked in your account."
        url="garden-service"
      />

      {/* ── HERO — full-bleed photo, forest scrim, lead form above the fold ── */}
      <section className="relative isolate overflow-hidden bg-[#16301A]">
        <img src="/images/garden/hero.jpg" alt="Lush bespoke home garden" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(8,22,11,0.95)_0%,rgba(14,36,19,0.85)_42%,rgba(22,48,26,0.45)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0B2012]/80 to-transparent" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{ backgroundImage: GRAIN, backgroundSize: '180px 180px' }}
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-16 lg:py-24">
          <div className="text-white">
            <Eyebrow dark>Bespoke home gardens</Eyebrow>
            <h1 className="mt-6 text-[34px] font-bold leading-[1.1] tracking-[-0.015em] sm:text-[46px] lg:text-[52px]">
              A thriving garden,
              <br />
              designed, planted &{' '}
              <span className="text-[#E3CE97]">cared for by experts</span>
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-[1.65] text-white/80 sm:text-[17px]">
              Balcony, terrace or backyard — we design, plant and maintain a beautiful green
              space tailored to you. Plants, soil, tools and a gardener who visits, all in one
              considered package.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <a
                href="#quote"
                className="inline-flex items-center gap-2 rounded-[14px] bg-[#14532D] px-7 py-3.5 text-[15.5px] font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/15 transition hover:bg-[#0D4324]"
              >
                Get my free garden plan
                <LineIcon name="arrowRight" className="h-4 w-4" />
              </a>
              <a
                href={`tel:${PHONE}`}
                className="inline-flex items-center gap-2 rounded-[14px] border border-white/30 bg-white/[0.08] px-7 py-3.5 text-[15.5px] font-semibold text-white backdrop-blur transition hover:border-white/60 hover:bg-white/[0.16]"
              >
                <GsIcon name="phone" className="h-4 w-4" />
                Call an expert
              </a>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-[13.5px] text-white/75">
              {['Plant-health guarantee', 'Trained gardeners', 'Eco-friendly setup'].map((t) => (
                <span key={t} className="inline-flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-white/10 ring-1 ring-white/25">
                    <LineIcon name="check" className="h-3 w-3" strokeWidth={2.4} />
                  </span>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* lead form in hero (above the fold) */}
          <div id="quote" className="scroll-mt-24 lg:justify-self-end lg:w-[26rem]">
            <LeadForm />
          </div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section className="border-b border-[#ECECEC] bg-[#F4F1EA]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-5 py-9 text-center sm:px-8 md:grid-cols-4 md:divide-x md:divide-[#E0DBCE]">
          {[
            ['2,000+', 'Gardens delivered'],
            ['4.9 / 5', 'Average rating'],
            ['100%', 'Plant-health guarantee'],
            ['Same-day', 'Metro delivery'],
          ].map(([a, b]) => (
            <div key={b} className="px-4">
              <div className="text-[26px] font-bold leading-none tracking-[-0.01em] text-[#184A31] sm:text-[30px]">{a}</div>
              <div className="mt-2 text-[13px] text-[#8A8A8A]">{b}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <SectionHead
          eyebrow="How it works"
          title="From bare space to thriving garden"
          sub="Three simple steps — you share, we design, we plant and maintain."
        />
        <div className="mt-12 grid gap-7 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div key={s.title} {...reveal(i * 0.08)} className={`group overflow-hidden ${CARD} ${CARD_HOVER}`}>
              <div className="relative h-48 overflow-hidden bg-[#F7F5EF]">
                <img
                  src={s.img}
                  alt={s.title}
                  className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                />
                <span className="absolute left-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-[#14532D] text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.25)] ring-4 ring-white/90">
                  {i + 1}
                </span>
              </div>
              <div className="p-6 sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#F3F8EC] text-[#24693E]">
                    <GsIcon name={s.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="text-[18px] font-bold leading-snug text-[#184A31]">{s.title}</h3>
                </div>
                <p className="mt-3.5 text-[14px] leading-[1.65] text-[#5B5B5B]">{s.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── EVERYTHING'S INCLUDED — sage wash ── */}
      <section className="border-y border-[#ECECEC] bg-[#F3F8EC]/60 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHead
            eyebrow="All-inclusive"
            title="Everything’s included"
            sub="One package, zero hassle. We bring the green thumb."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {INCLUDED.map((f, i) => (
              <motion.div
                key={f.title}
                {...reveal(i * 0.06)}
                className={`${CARD} ${CARD_HOVER} p-7 transition-transform duration-300 hover:-translate-y-1.5`}
              >
                <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-[#F3F8EC] text-[#24693E]">
                  <GsIcon name={f.icon} className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-[16.5px] font-bold leading-snug text-[#184A31]">{f.title}</h3>
                <p className="mt-2 text-[14px] leading-[1.65] text-[#5B5B5B]">{f.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REAL TRANSFORMATIONS ── */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <SectionHead
          eyebrow="Our work"
          title="Real transformations"
          sub="Bare corners become living rooms of green — here is what that looks like."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {[
            { img: '/images/garden/before.jpg', label: 'Before', chip: 'bg-[#16301A]/85 text-white/90' },
            { img: '/images/garden/after.jpg', label: 'After', chip: 'bg-[#14532D] text-white' },
          ].map((f, i) => (
            <motion.figure key={f.label} {...reveal(i * 0.08)} className={`relative overflow-hidden ${CARD}`}>
              <img src={f.img} alt={`${f.label} the garden makeover`} className="h-72 w-full object-cover sm:h-80" />
              <figcaption className={`absolute left-5 top-5 rounded-full px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] backdrop-blur ${f.chip}`}>
                {f.label}
              </figcaption>
            </motion.figure>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 sm:gap-6">
          {['/images/garden/g1.jpg', '/images/garden/g2.jpg', '/images/garden/g3.jpg'].map((src, i) => (
            <motion.div key={src} {...reveal(0.1 + i * 0.06)} className="overflow-hidden rounded-[18px] border border-[#ECECEC] shadow-[0_4px_10px_rgba(0,0,0,0.04)]">
              <img src={src} alt="A recent PlantAtHome garden project" className="h-32 w-full object-cover sm:h-44" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── PACKAGES — dark forest band, luxury white cards ── */}
      {templates.length > 0 && (
        <section className="relative overflow-hidden bg-[#16301A] py-16 lg:py-24">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
            style={{ backgroundImage: GRAIN, backgroundSize: '180px 180px' }}
          />
          <div className="pointer-events-none absolute -left-24 top-0 h-96 w-96 rounded-full bg-[#4E8244]/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-[#E3CE97]/[0.07] blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
            <SectionHead
              dark
              eyebrow="Garden packages"
              title="Popular garden packages"
              sub="Starting points — every package is customised to your space and budget."
            />
            <div className="mt-14 grid items-stretch gap-7 lg:grid-cols-3">
              {templates.map((t, i) => {
                const popular = i === 1;
                return (
                  <motion.div
                    key={t.id}
                    {...reveal(i * 0.08)}
                    className={`relative flex flex-col rounded-[22px] bg-white p-7 shadow-[0_4px_10px_rgba(0,0,0,0.15),0_24px_50px_rgba(0,0,0,0.3)] sm:p-8 ${
                      popular ? 'ring-2 ring-[#B58E39] lg:-translate-y-3' : 'border border-[#ECECEC]'
                    }`}
                  >
                    {popular && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#B58E39] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_6px_16px_rgba(181,142,57,0.45)]">
                        Most popular
                      </span>
                    )}

                    <h3 className="text-[21px] font-bold leading-tight text-[#184A31]">{t.name}</h3>
                    {t.tagline ? <p className="mt-1.5 text-[13.5px] text-[#8A8A8A]">{t.tagline}</p> : null}

                    <div className="mt-5 flex items-baseline gap-2">
                      <span className="text-[13px] font-medium text-[#8A8A8A]">From</span>
                      <span className="text-[32px] font-bold leading-none tracking-[-0.01em] text-[#14532D]">
                        {fmt(t.suggested_price)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F8EC] px-3 py-1.5 text-[12px] font-semibold text-[#24693E]">
                        <GsIcon name="gardener" className="h-3.5 w-3.5" />
                        {t.suggested_visits} gardener visits
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F8EC] px-3 py-1.5 text-[12px] font-semibold text-[#24693E]">
                        <GsIcon name="calendar" className="h-3.5 w-3.5" />
                        {t.duration_days} days
                      </span>
                    </div>

                    <div className="my-6 h-px bg-[#ECECEC]" />

                    <ul className="flex-1 space-y-3">
                      {(t.items ?? []).slice(0, 6).map((it, j) => (
                        <li key={j} className="flex items-start gap-3 text-[14px] leading-[1.5] text-[#5B5B5B]">
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#F3F8EC] text-[#24693E]">
                            <LineIcon name="check" className="h-3 w-3" strokeWidth={2.4} />
                          </span>
                          <span>
                            {it.name}
                            {it.qty && it.qty > 1 ? ` (${it.qty})` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <a
                      href="#quote"
                      className={`mt-7 flex w-full items-center justify-center gap-2 rounded-[14px] py-3.5 text-[15px] font-semibold transition ${
                        popular
                          ? 'bg-[#14532D] text-white hover:bg-[#0D4324]'
                          : 'border border-[#14532D]/25 bg-white text-[#14532D] hover:border-[#14532D] hover:bg-[#F3F8EC]'
                      }`}
                    >
                      Get a custom quote
                      <LineIcon name="arrowRight" className="h-4 w-4" />
                    </a>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ── */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <SectionHead
          eyebrow="Testimonials"
          title="Loved by plant parents"
          sub="Real homes, real gardens — and owners who barely lift a finger."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((tm, i) => (
            <motion.figure key={tm.name} {...reveal(i * 0.07)} className={`${CARD} ${CARD_HOVER} flex h-full flex-col p-7`}>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, s) => <GoldStar key={s} />)}
              </div>
              <blockquote className="mt-4 flex-1 text-[15px] leading-[1.7] text-[#5B5B5B]">
                “{tm.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-[#F0EEE8] pt-5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-sage-100 text-[13px] font-bold text-[#184A31]">
                  {tm.name.charAt(0)}
                </span>
                <span>
                  <span className="block text-[14px] font-semibold text-[#184A31]">{tm.name}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-[12px] text-[#8A8A8A]">
                    <GsIcon name="mapPin" className="h-3 w-3" />
                    {tm.city}
                  </span>
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-[#ECECEC] bg-[#F4F1EA] py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <SectionHead eyebrow="Good to know" title="Questions, answered" />
          <div className="mt-10 space-y-3.5">
            {FAQS.map((f, i) => (
              <motion.details key={f.q} {...reveal(i * 0.04)} className={`group ${CARD} p-5 sm:p-6`}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-[#184A31] [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F3F8EC] text-[#24693E] transition-transform duration-300 group-open:rotate-180">
                    <GsIcon name="chevronDown" className="h-4 w-4" />
                  </span>
                </summary>
                <p className="mt-3 pr-10 text-[14px] leading-[1.7] text-[#5B5B5B]">{f.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA — dark forest band ── */}
      <section className="relative overflow-hidden bg-[#1E4023] py-16 text-center lg:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{ backgroundImage: GRAIN, backgroundSize: '180px 180px' }}
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(ellipse_at_0%_60%,rgba(143,213,111,0.10)_0%,transparent_65%)]" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-[#E3CE97]/[0.08] blur-3xl" />

        <motion.div {...reveal()} className="relative mx-auto max-w-3xl px-5">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#8FD56F]/25 bg-[#8FD56F]/10 text-[#8FD56F]">
            <LineIcon name="leaf" className="h-7 w-7" />
          </span>
          <h2 className="mt-6 text-[28px] font-bold leading-[1.15] tracking-[-0.01em] text-white sm:text-[36px]">
            Ready for a garden you’ll actually keep alive?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-[1.65] text-white/75">
            Get a free, no-obligation plan tailored to your space today.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <a
              href="#quote"
              className="inline-flex items-center gap-2 rounded-[14px] bg-white px-7 py-3.5 text-[15.5px] font-semibold text-[#14532D] shadow-[0_12px_30px_rgba(0,0,0,0.3)] transition hover:bg-[#F3F8EC]"
            >
              Get my free garden plan
              <LineIcon name="arrowRight" className="h-4 w-4" />
            </a>
            <a
              href={`tel:${PHONE}`}
              className="inline-flex items-center gap-2 rounded-[14px] border border-white/30 bg-white/[0.06] px-7 py-3.5 text-[15.5px] font-semibold text-white transition hover:border-white/60 hover:bg-white/[0.14]"
            >
              <GsIcon name="phone" className="h-4 w-4" />
              Call an expert
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

GardenServicePage.getLayout = getSiteLayout;


/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <GardenServicePage {...props} />;
  const withLayout = (GardenServicePage as any).getLayout ? (GardenServicePage as any).getLayout(page) : page;
  return withLayout;
}
