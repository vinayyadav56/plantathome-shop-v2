'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from '@/components/ui/button';
import { isMobileIdentifier } from '@/components/auth/login-form';
import { useSubmitCorporateLead } from '@/framework/garden';
import { ArrowRight, CircleCheck, Lock } from '@/components/ui/icon';
import EnquiryFields from './enquiry-fields';
import { HelpCard, SummaryPanel, WhyPanel } from './sidebar-panels';
import { FORM, SUCCESS } from './content';

/** Today as YYYY-MM-DD in the browser's zone — the same shape a date input holds. */
export const todayISO = () => new Date().toLocaleDateString('en-CA');

const schema = yup.object({
  company: yup.string().trim().required('Enter your company name').max(191, 'Company name is too long'),
  name: yup.string().trim().required('Enter the contact person’s name'),
  email: yup.string().trim().email('Enter a valid email address').required('Enter your business email'),
  // PhoneInput emits digits with the dial code ('919876543210'); last 10, as register-form does.
  phone: yup
    .string()
    .required('Enter your mobile number')
    .test('valid-mobile', 'Enter a valid 10-digit mobile number', (v) =>
      isMobileIdentifier((v ?? '').replace(/\D/g, '').slice(-10)),
    ),
  occasion: yup.string().required('Select the gifting occasion'),
  quantity: yup.string().required('Select an approximate quantity'),
  budget_range: yup.string(),
  preferred_date: yup.string().test('not-past', 'Choose today or a later date', (v) => !v || v >= todayISO()),
  city: yup.string().trim().required('Enter your delivery city or PIN code'),
  // The checkbox group arrives as string[] — or `false` while nothing is ticked.
  plant_preferences: yup
    .array(yup.string().defined())
    .transform((v) => (Array.isArray(v) ? v : []))
    .default([]),
  message: yup.string().max(FORM.messageMax, `Keep it under ${FORM.messageMax} characters`),
});

export type EnquiryValues = yup.InferType<typeof schema>;

const EMPTY: EnquiryValues = {
  company: '',
  name: '',
  email: '',
  phone: '',
  occasion: '',
  quantity: '',
  budget_range: '',
  preferred_date: '',
  city: '',
  plant_preferences: [],
  message: '',
};

function SuccessPanel({ message, onReset }: { message: string; onReset: () => void }) {
  // The form (and the focused Submit button) unmounts on success; move focus here so keyboard
  // and screen-reader users land on the confirmation instead of <body>.
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      className="mt-6 rounded-2xl border border-sage-200 bg-sage-50 p-6 text-center outline-none sm:p-8"
    >
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-forest-700 ring-1 ring-gold">
        <CircleCheck size={24} aria-hidden />
      </span>
      <h3 className="mt-4 font-heading text-[22px] text-forest-900">{SUCCESS.title}</h3>
      <p className="mt-2 text-[14px] text-stone-600">{message}</p>
      <Button type="button" variant="formSecondary" className="mt-5" onClick={onReset}>
        {SUCCESS.again}
      </Button>
    </div>
  );
}

/**
 * The white enquiry card: ONE form (steps 1–4) with the sage summary, cream help card and sage
 * why-list beside it from lg and under it below. DOM order = phone order, so no `order-*`.
 * Submits to `POST corporate-leads`; a 422 lands under its field, anything else in the banner,
 * and the typed values survive every error. The summary keeps showing what was sent until
 * "Send another request".
 */
export default function EnquirySection() {
  const form = useForm<EnquiryValues>({ resolver: yupResolver(schema), mode: 'onTouched', defaultValues: EMPTY });
  const { mutate, isLoading } = useSubmitCorporateLead();
  const [done, setDone] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  // The summary re-renders with every keystroke (useWatch, not watch(): compiler-safe).
  const values = useWatch({ control: form.control });

  const onSubmit = (v: EnquiryValues) => {
    if (isLoading) return;
    setServerError(null);
    const prefs = v.plant_preferences;
    mutate(
      {
        company: v.company,
        name: v.name,
        email: v.email,
        phone: '+91' + v.phone.replace(/\D/g, '').slice(-10),
        occasion: v.occasion,
        quantity: v.quantity,
        budget_range: v.budget_range || undefined,
        city: v.city,
        message: v.message?.trim() || undefined,
        meta: { preferred_date: v.preferred_date || undefined, plant_preferences: prefs.length ? prefs : undefined },
      },
      {
        onSuccess: (res) => setDone(res?.message || SUCCESS.text),
        onError: (error: unknown) => {
          const res = (
            error as {
              response?: { status?: number; data?: { message?: string; errors?: Record<string, string[] | string> } };
            } | null
          )?.response;
          // 422 = field errors ({ errors: { email: [...], 'meta.preferred_date': [...] } }).
          const fields = res?.status === 422 ? (res.data?.errors ?? {}) : {};
          Object.entries(fields).forEach(([key, msg]) =>
            form.setError(key.replace('meta.', '') as keyof EnquiryValues, {
              type: 'server',
              message: Array.isArray(msg) ? msg[0] : String(msg),
            }),
          );
          setServerError(
            res?.status === 422
              ? res.data?.message || 'Please check the highlighted fields.'
              : !res
                ? 'Couldn’t reach the server. Check your connection and try again.'
                : res.status === 429
                  ? 'Too many requests. Wait a minute, then try again.'
                  : 'Something went wrong on our side. Please try again.',
          );
        },
      },
    );
  };

  return (
    <section id="enquiry" aria-labelledby="enquiry-title" className="scroll-mt-24 rounded-2xl bg-white p-5 shadow-box sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,68fr)_minmax(0,32fr)]">
        <div>
          <h2 id="enquiry-title" className="font-heading text-[28px] leading-tight text-forest-900">
            {FORM.title}
          </h2>
          <p className="mt-2 hidden text-[15px] text-stone-600 lg:block">{FORM.subDesktop}</p>
          <p className="mt-2 text-[15px] text-stone-600 lg:hidden">{FORM.subMobile}</p>

          {done ? (
            <SuccessPanel
              message={done}
              onReset={() => {
                form.reset(EMPTY);
                setDone(null);
              }}
            />
          ) : (
            <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="mt-6">
              <EnquiryFields form={form} />
              {serverError && (
                <p role="alert" className="mt-4 text-[13px] leading-snug text-red-600">
                  {serverError}
                </p>
              )}
              <Button type="submit" variant="formPrimary" className="mt-6 w-full" loading={isLoading} disabled={isLoading}>
                {FORM.submit}
                <ArrowRight size={18} aria-hidden className="ml-2" />
              </Button>
              <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-[12px] text-stone-500">
                <Lock size={14} aria-hidden className="mt-px shrink-0" />
                {FORM.privacy}
              </p>
            </form>
          )}
        </div>

        <aside className="space-y-4">
          <SummaryPanel values={values} />
          <HelpCard />
          <WhyPanel />
        </aside>
      </div>
    </section>
  );
}
