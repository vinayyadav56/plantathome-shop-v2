'use client';

import Breadcrumb from '@/components/ui/breadcrumb';
import { useState } from 'react';
import { useRouter } from '@/compat/next-router';
import { getLayout } from '@/components/layouts/layout';
import { Routes } from '@/config/routes';
import { ShoppingBag, ArrowRight } from '@/components/ui/icon';

export default function TrackOrderPage() {
  const router = useRouter();
  const [tracking, setTracking] = useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = tracking.trim();
    if (!t) return;
    router.push(Routes.order(t));
  }

  return (
    <div className="flex min-h-[70vh] w-full flex-col bg-[linear-gradient(180deg,#FFFFFF_0%,#F6FAF7_50%,#EFF4EC_100%)] px-4 py-6">
      <Breadcrumb
        className="mx-auto w-full max-w-7xl px-1 sm:px-4"
        items={[{ label: 'Home', href: Routes.home }, { label: 'Track Order' }]}
      />
      <div className="flex w-full flex-1 items-center justify-center py-10">
      <div className="w-full max-w-md rounded-2xl border border-kraft-200/80 bg-white p-8 shadow-[0_8px_30px_-12px_rgba(34,48,26,0.18)]">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-sage-100">
          <ShoppingBag size={20} style={{ color: '#2E5E3A' }} aria-hidden />
        </div>
        <h1 className="font-pahserif text-[30px] font-medium text-forest-900 md:text-[36px]">Track Your Order</h1>
        <p className="mt-1.5 text-sm text-stone-500">
          Enter your order tracking number to see its current status and delivery
          progress.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            type="text"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="e.g. 20260608960310"
            className="h-12 w-full rounded-xl border border-kraft-200 bg-white px-4 text-sm text-forest-900 placeholder:text-stone-400 focus:border-forest-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!tracking.trim()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-forest-900 text-[14px] font-semibold text-white transition hover:bg-forest-800 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            Track Order
            <ArrowRight size={16} aria-hidden />
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-stone-400">
          You can find your tracking number in your order confirmation email or SMS.
        </p>
      </div>
      </div>
    </div>
  );
}

TrackOrderPage.getLayout = getLayout;


/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <TrackOrderPage {...props} />;
  const withLayout = (TrackOrderPage as any).getLayout ? (TrackOrderPage as any).getLayout(page) : page;
  return withLayout;
}
