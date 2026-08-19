'use client';

import Breadcrumb from '@/components/ui/breadcrumb';
import { Routes } from '@/config/routes';
import { useForm } from 'react-hook-form';
import { goToSignin } from '@/lib/go-to-signin';
import { useState } from 'react';
import { useAtom } from 'jotai';
import { toast } from 'react-toastify';
import { getLayout as getSiteLayout } from '@/components/layouts/layout';
import Seo from '@/components/seo/seo';
import { authorizationAtom } from '@/store/authorization-atom';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { useGiftingConfig, resolveImageUrl } from '@/lib/use-home-config';
import {
  useGiftingTemplates, useSubmitCorporateLead, useGiftingCheckout, GardenLeadInput,
} from '@/framework/garden';
import {
  BadgeCheck,
  Check,
  Gift,
  Lock,
  Plus,
  ShieldCheck,
  Sprout,
  Truck,
  UserRound,
  WandSparkles,
} from '@/components/ui/icon';


type CorporateInput = GardenLeadInput & { company?: string; occasion?: string; quantity?: string };

const OCCASIONS = ['Diwali / Festivals', 'Employee onboarding', 'Work anniversaries', 'Client gifting', 'Events / Conferences', 'Other'];
const QTY = ['10–50', '50–200', '200–500', '500+'];

const AUDIENCE = [
  { icon: <Gift size={24} className="text-forest-700" aria-hidden />, title: 'Festive & Diwali gifting', text: 'Sustainable, memorable gifts that outlast the season — for clients, partners and teams.' },
  { icon: <UserRound size={24} className="text-forest-700" aria-hidden />, title: 'Employee gifting', text: 'Onboarding kits, milestones and appreciation gifts that bring the outdoors to every desk.' },
  { icon: <BadgeCheck size={24} className="text-forest-700" aria-hidden />, title: 'Client & VIP gifting', text: 'Premium curated hampers with custom branding that leave a lasting impression.' },
];
const WHY = [
  { icon: <Sprout size={20} className="text-forest-700" aria-hidden />, title: 'Memorable & sustainable', text: 'A living gift that keeps growing — far better recall than chocolates or generic kits.' },
  { icon: <WandSparkles size={20} className="text-forest-700" aria-hidden />, title: 'Custom branding', text: 'Branded pots, tags and packaging tailored to your company and occasion.' },
  { icon: <Truck size={20} className="text-forest-700" aria-hidden />, title: 'Bulk, pan-India delivery', text: 'Any quantity, coordinated delivery to one office or hundreds of addresses.' },
  { icon: <ShieldCheck size={20} className="text-forest-700" aria-hidden />, title: 'Healthy-plant guarantee', text: 'Hardy, easy-care plants picked to thrive in office and home environments.' },
];
const FAQS = [
  { q: 'What’s the minimum order quantity?', a: 'We handle orders from 10 to thousands of gifts. Per-unit pricing improves with volume — share your numbers for a quote.' },
  { q: 'Can you add our branding?', a: 'Yes — custom pots, message tags, sleeves and packaging with your logo and a personalised note.' },
  { q: 'Do you deliver to multiple addresses?', a: 'Absolutely. We can ship to a single office or split-ship to individual employee/client addresses pan-India.' },
  { q: 'How do we order?', a: 'Buy a standard hamper online, or send an enquiry for custom/bulk and our gifting team will share a tailored proposal.' },
];

// Fallback showcase — used only when the admin hasn't authored a gallery yet.
const DEFAULT_GALLERY = [
  { image: '/images/gifting/hamper.jpg', caption: 'Curated festive hampers' },
  { image: '/images/gifting/office.jpg', caption: 'Employee welcome kits' },
  { image: '/images/gifting/box.jpg', caption: 'Custom branded packaging' },
];

function EnquiryForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CorporateInput>();
  const { mutate, isLoading } = useSubmitCorporateLead();
  const [done, setDone] = useState(false);

  const onSubmit = (values: CorporateInput) =>
    mutate(values, {
      onSuccess: () => { setDone(true); reset(); toast.success('Thanks! Our gifting team will reach out.'); },
      onError: () => { toast.error('Something went wrong. Please call us instead.'); },
    });

  if (done) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-kraft-200">
        <div className="mb-3 text-4xl">🎁</div>
        <h3 className="font-cormorant text-2xl font-medium text-forest-900">Enquiry received!</h3>
        <p className="mt-2 text-sm text-stone-600">Our corporate gifting team will reach out with a tailored proposal.</p>
      </div>
    );
  }

  const inputCls = 'w-full rounded-lg border border-kraft-300 bg-cream-50 px-4 py-3 text-sm text-forest-900 placeholder:text-stone-400 focus:border-forest-500 focus:bg-white focus:outline-0 focus:ring-2 focus:ring-sage-200';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-kraft-200 sm:p-8">
      <h3 className="font-cormorant text-2xl font-medium text-forest-900">Get a custom gifting quote</h3>
      <p className="mt-1 text-sm text-stone-500">Tell us your needs — we’ll tailor a proposal & pricing.</p>
      <div className="mt-5 space-y-3">
        <input {...register('company', { required: true })} placeholder="Company name *" className={inputCls} />
        {errors.company && <span className="text-xs text-clay-600">Company is required</span>}
        <input {...register('name', { required: true })} placeholder="Your name *" className={inputCls} />
        <div className="grid grid-cols-2 gap-3">
          <input {...register('phone', { required: true })} placeholder="Phone *" inputMode="tel" className={inputCls} />
          <input {...register('email')} placeholder="Work email" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select {...register('occasion')} className={inputCls + ' text-stone-600'}>
            <option value="">Occasion</option>{OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select {...register('quantity')} className={inputCls + ' text-stone-600'}>
            <option value="">Quantity</option>{QTY.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>
        <textarea {...register('message')} placeholder="Anything specific? (branding, budget, timeline)" rows={2} className={inputCls} />
      </div>
      <button type="submit" disabled={isLoading} className="mt-5 w-full rounded-xl bg-ds-btn px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-ds-btn-hover disabled:opacity-60">
        {isLoading ? 'Sending…' : 'Request a quote →'}
      </button>
      <p className="mt-3 flex items-center justify-center gap-1 text-center text-xs text-stone-400">
        <Lock size={12} className="shrink-0" aria-hidden />
        B2B enquiries only · Trusted by teams across India
      </p>
    </form>
  );
}

export default function CorporateGiftingPage() {
  const { data } = useGiftingTemplates();
  const tiers = data?.data ?? [];
  const cms = useGiftingConfig();
  const [isAuthorize] = useAtom(authorizationAtom);
  const { openModal } = useModalAction();
  const { mutate: checkout, isLoading: buying } = useGiftingCheckout();
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const fmt = (n: number) => '₹' + Number(n).toLocaleString('en-IN');

  const heroImg = resolveImageUrl(cms?.heroImage ?? null) || '/images/gifting/hero.jpg';
  const usingDefaultGallery = !(cms?.gallery && cms.gallery.length);
  const gallery = (usingDefaultGallery
    ? DEFAULT_GALLERY
    : [...cms!.gallery!].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  )
    .map((g) => ({ url: resolveImageUrl((g as any).image ?? null), caption: g.caption }))
    .filter((g) => g.url);
  // Show the built-in subtitle whenever the placeholder gallery is displayed;
  // once a real gallery is authored, respect a deliberately-blank subtitle.
  const gallerySubtitle = cms?.gallerySubtitle
    || (usingDefaultGallery ? 'A glimpse of the hampers, kits and branded packaging we’ve created for teams across India.' : '');

  const buy = (id: number) => {
    if (!isAuthorize) { goToSignin(); return; }
    setBuyingId(id);
    checkout(id, {
      onSuccess: (res) => {
        const url = res?.data?.url;
        if (url) window.location.href = url;
        else toast.success('Order created — see it in My Packages.');
        setBuyingId(null);
      },
      onError: () => { toast.error('Could not start checkout. Please try the enquiry form.'); setBuyingId(null); },
    });
  };

  return (
    <div className="bg-cream-50">
      <Seo
        title="Corporate Plant Gifting — festive hampers & employee kits"
        description="Memorable, sustainable plant gifts for employees, clients and festive occasions. Ready-to-buy hampers and kits, or enquire for bespoke bulk gifting tailored to your brand."
        url="corporate-gifting"
      />
      <Breadcrumb
        className="mx-auto w-full max-w-7xl px-5 pt-4 sm:px-8"
        items={[{ label: 'Home', href: Routes.home }, { label: 'Corporate Gifting' }]}
      />
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <img src={heroImg} alt="Corporate plant gifting" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-900/[0.92] via-forest-800/[0.72] to-forest-700/35" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:py-24">
          <div className="text-white">
            <span className="font-jost inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] backdrop-blur">🎁 Corporate Gifting</span>
            <h1 className="font-cormorant mt-5 text-[34px] font-medium leading-[1.02] tracking-[-0.015em] sm:text-[46px] lg:text-[52px]">Gift something that <span className="italic text-sage-300">grows</span></h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-cream-50/90">
              Memorable, sustainable plant gifts for clients and teams — custom branded, delivered in bulk across India. Buy a ready hamper or get a tailored quote.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#tiers" className="font-jost rounded-xl bg-ds-cta px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] text-ds-cta-ink transition-colors hover:bg-ds-cta-hover">Browse gift hampers</a>
              <a href="#quote" className="font-jost rounded-xl border border-white/40 bg-white/10 px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] text-white backdrop-blur transition-colors hover:border-white hover:bg-white/20">Get a bulk quote</a>
            </div>
          </div>
          <div id="quote" className="lg:w-[26rem] lg:justify-self-end"><EnquiryForm /></div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <p className="text-center font-jost text-[11px] font-semibold uppercase tracking-[0.22em] text-forest-600">Corporate & bulk</p>
        <h2 className="font-cormorant mt-2 text-center text-4xl font-medium text-forest-900 sm:text-5xl">Perfect for every occasion</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {AUDIENCE.map((a) => (
            <div key={a.title} className="rounded-2xl border border-kraft-200 bg-white p-7 shadow-[0_6px_20px_rgba(5,16,8,0.06)] transition-shadow hover:shadow-[0_12px_30px_rgba(5,16,8,0.1)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-100 text-2xl">{a.icon}</div>
              <h3 className="mt-4 font-cormorant text-2xl font-medium text-forest-900">{a.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{a.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TIERS */}
      <section id="tiers" className="bg-forest-900 py-16 text-white lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <p className="text-center font-jost text-[11px] font-semibold uppercase tracking-[0.22em] text-sage-300">Ready to gift</p>
          <h2 className="font-cormorant mt-2 text-center text-4xl font-medium sm:text-5xl">Curated gift hampers</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-cream-50/75">Buy online, or request a custom quote for bulk & branding.</p>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {tiers.map((t) => {
              const highlight = !!t.badge;
              return (
                <div key={t.id} className={`relative flex flex-col rounded-2xl p-7 ring-1 ${highlight ? 'bg-white/[0.07] ring-2 ring-ds-cta' : 'bg-white/5 ring-white/10'}`}>
                  {t.badge && <div className="mb-3 inline-flex w-fit rounded-full bg-ds-cta px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ds-cta-ink">{t.badge}</div>}
                  <h3 className="font-cormorant text-2xl font-medium">{t.name}</h3>
                  <p className="mt-1 text-sm text-cream-50/65">{t.tagline}</p>
                  <div className="mt-4 font-cormorant text-4xl font-semibold">From {fmt(t.suggested_price)}<span className="text-sm font-normal text-cream-50/55"> /gift</span></div>
                  <ul className="mt-5 flex-1 space-y-2 text-sm">
                    {(t.items ?? []).map((it, j) => <li key={j} className="flex gap-2"><span className="text-ds-cta"><Check size={14} aria-hidden /></span><span className="text-cream-50/90">{it.name}</span></li>)}
                  </ul>
                  <button onClick={() => buy(t.id)} disabled={buying && buyingId === t.id}
                    className={`mt-6 w-full rounded-xl px-5 py-3 text-sm font-semibold uppercase tracking-[0.06em] transition-colors disabled:opacity-60 ${highlight ? 'bg-ds-cta text-ds-cta-ink hover:bg-ds-cta-hover' : 'bg-white/15 text-white hover:bg-white/25'}`}>
                    {buying && buyingId === t.id ? 'Starting…' : isAuthorize ? 'Buy now' : 'Login to buy'}
                  </button>
                  <a href="#quote" className="mt-2.5 text-center text-sm text-sage-300 underline underline-offset-2 hover:text-sage-200">or get a bulk quote</a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WORK SHOWCASE / GALLERY */}
      {gallery.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <p className="text-center font-jost text-[11px] font-semibold uppercase tracking-[0.22em] text-forest-600">{cms?.galleryEyebrow || 'Our work'}</p>
          <h2 className="font-cormorant mt-2 text-center text-4xl font-medium text-forest-900 sm:text-5xl">{cms?.galleryHeading || 'Gifting we’ve delivered'}</h2>
          {gallerySubtitle && (
            <p className="mx-auto mt-3 max-w-2xl text-center text-stone-600">{gallerySubtitle}</p>
          )}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((g, i) => (
              <figure key={i} className={`group relative overflow-hidden rounded-2xl bg-sage-100 ring-1 ring-kraft-200 ${i === 0 ? 'sm:col-span-2 lg:col-span-1' : ''}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.url} alt={g.caption || 'Corporate gifting'} loading="lazy" className="aspect-[4/3] h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]" />
                {g.caption && (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest-900/85 to-transparent p-4 pt-10">
                    <span className="font-jost text-sm font-medium text-white">{g.caption}</span>
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* WHY */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <h2 className="font-cormorant text-center text-4xl font-medium text-forest-900 sm:text-5xl">Why plant gifts work</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((f) => (
              <div key={f.title} className="rounded-2xl border border-kraft-200 bg-cream-50 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-100 text-xl">{f.icon}</div>
                <h3 className="mt-3.5 font-cormorant text-xl font-medium text-forest-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-cream-50 py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <h2 className="font-cormorant text-center text-4xl font-medium text-forest-900 sm:text-5xl">Questions, answered</h2>
          <div className="mt-8 space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-xl border border-kraft-200 bg-white p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-jost font-semibold text-forest-900">
                  {f.q}
                  <Plus size={16} className="shrink-0 text-forest-600 transition-transform group-open:rotate-45" aria-hidden />
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-forest-800 py-14 text-center text-white lg:py-16">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="font-cormorant text-4xl font-medium sm:text-5xl">Gifting at scale, made effortless</h2>
          <p className="mt-3 text-cream-50/85">Tell us your occasion and quantity — we’ll handle the rest.</p>
          <a href="#quote" className="font-jost mt-6 inline-flex rounded-xl bg-ds-cta px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.1em] text-ds-cta-ink shadow-lg transition-colors hover:bg-ds-cta-hover">Get a custom quote →</a>
        </div>
      </section>
    </div>
  );
}

CorporateGiftingPage.getLayout = getSiteLayout;


/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <CorporateGiftingPage {...props} />;
  const withLayout = (CorporateGiftingPage as any).getLayout ? (CorporateGiftingPage as any).getLayout(page) : page;
  return withLayout;
}
