'use client';

import { useState, type ReactNode } from 'react';
import { useSettings } from '@/framework/settings';
import { ChevronDown, Headset, Mail, Phone } from '@/components/ui/icon';
import { HELP, PLANT_PREFS, QUANTITIES, SUMMARY, WHY } from './content';
import type { EnquiryValues } from './enquiry-section';

/**
 * A panel that collapses on phones and tablets and is always open from lg: one render, state +
 * CSS only. The button header is the phone's; its `<h2>` twin is the desktop's.
 */
function Collapsible({
  id,
  title,
  defaultOpen = false,
  className,
  children,
}: {
  id: string;
  title: string;
  defaultOpen?: boolean;
  className: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 text-left font-heading text-[18px] text-forest-900 lg:hidden"
      >
        {title}
        <ChevronDown
          size={18}
          aria-hidden
          className={`shrink-0 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <h2 className="hidden font-heading text-[18px] text-forest-900 lg:block">{title}</h2>
      <div id={id} className={`mt-3 ${open ? '' : 'hidden lg:block'}`}>
        {children}
      </div>
    </div>
  );
}

/** The RHF checkbox group is string[] — or `false` while nothing is ticked. */
const prefsOf = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
/** Local midnight, not `new Date('YYYY-MM-DD')` (UTC — a day early west of Greenwich). */
const fmtDate = (v?: string) =>
  v ? new Date(`${v}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

/** Sage: what the form holds right now, row by row. Collapsed by default on phones. */
export function SummaryPanel({ values }: { values: Partial<EnquiryValues> }) {
  const shown: Record<(typeof SUMMARY.rows)[number]['key'], string | undefined> = {
    company: values.company,
    name: values.name,
    occasion: values.occasion,
    quantity: QUANTITIES.find((q) => q.value === values.quantity)?.label,
    budget_range: values.budget_range,
    preferred_date: fmtDate(values.preferred_date),
    city: values.city,
    plant_preferences: prefsOf(values.plant_preferences)
      .map((k) => PLANT_PREFS.find((p) => p.key === k)?.label ?? k)
      .join(', '),
  };
  return (
    <Collapsible id="enquiry-summary" title={SUMMARY.title} className="rounded-2xl border border-sage-200 bg-sage-50 p-5">
      <p className="text-[13px] leading-relaxed text-stone-600">{SUMMARY.text}</p>
      <dl className="mt-4 space-y-3">
        {SUMMARY.rows.map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-start gap-3" data-summary-row={key}>
            <Icon size={18} aria-hidden className="mt-0.5 shrink-0 text-forest-700" />
            <div className="min-w-0">
              <dt className="text-[12px] text-stone-500">{label}</dt>
              <dd className="break-words text-[14px] font-medium text-forest-900">{shown[key]?.trim() || '—'}</dd>
            </div>
          </div>
        ))}
      </dl>
    </Collapsible>
  );
}

/** Cream: the team's number and email from Settings → Company Information. No fallback
 *  numbers — a contact renders only when the setting exists. Expanded by default on phones. */
export function HelpCard() {
  const { settings } = useSettings();
  const contact = settings?.contactDetails ?? {};
  // Phone as stored may be bare digits ("919996469046") or already spaced (as footer.tsx reads it).
  const digits = String(contact?.contact || settings?.contactPhone || '').replace(/\D/g, '');
  const national =
    digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits.length === 10 ? digits : null;
  const email: string = contact?.emailAddress || settings?.contactEmail || '';
  return (
    <Collapsible id="enquiry-help" title={HELP.title} defaultOpen className="rounded-2xl border border-kraft-200 bg-cream-50 p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-forest-700 ring-1 ring-gold">
          <Headset size={20} aria-hidden />
        </span>
        <p className="text-[13px] leading-relaxed text-stone-600">{HELP.text}</p>
      </div>
      {national && (
        <a
          href={`tel:+91${national}`}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-control border border-border-base bg-white px-4 text-sm font-semibold text-heading transition-colors hover:border-ds-btn hover:text-ds-btn"
        >
          <Phone size={16} aria-hidden />
          {HELP.call}
        </a>
      )}
      {(national || email) && (
        <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] text-stone-600">
          {national && <span>+91 {national.slice(0, 5)} {national.slice(5)}</span>}
          {email && (
            <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 font-medium text-forest-700 hover:text-forest-900">
              <Mail size={16} aria-hidden />
              {email}
            </a>
          )}
        </p>
      )}
    </Collapsible>
  );
}

/** Sage: the four reasons, each in a gold-ring disc. Collapsed by default on phones. */
export function WhyPanel() {
  return (
    <Collapsible id="enquiry-why" title={WHY.title} className="rounded-2xl border border-sage-200 bg-sage-50 p-5">
      <ul className="space-y-3">
        {WHY.items.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-forest-700 ring-1 ring-gold">
              <Icon size={18} aria-hidden />
            </span>
            <span className="pt-2 text-[13px] leading-snug text-forest-900">{text}</span>
          </li>
        ))}
      </ul>
    </Collapsible>
  );
}
