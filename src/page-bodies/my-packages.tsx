'use client';

import React from 'react';
import { useMyGardenPackages, usePayGardenPackage, GardenPackage } from '@/framework/garden';


const STATUS_BADGE: Record<string, string> = {
  active: 'bg-sage-100 text-forest-700',
  awaiting_payment: 'bg-amber-100 text-amber-700',
  completed: 'bg-[#F8F7F2] text-stone-600',
  draft: 'bg-[#F8F7F2] text-stone-500',
  cancelled: 'bg-red-100 text-red-600',
};

const fmtINR = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

function PackageCard({ pkg }: { pkg: GardenPackage }) {
  const { mutate: pay, isLoading: paying } = usePayGardenPackage();
  const pct = pkg.total_visits > 0 ? Math.round((pkg.visits_used / pkg.total_visits) * 100) : 0;
  const completedVisits = (pkg.visits ?? []).filter((v) => v.status === 'completed');
  const upcoming = (pkg.visits ?? []).filter((v) => v.status === 'scheduled');

  return (
    <div className="rounded-2xl border border-kraft-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium text-forest-900">{pkg.name}</h3>
          {pkg.description && <p className="mt-1 text-sm text-stone-500">{pkg.description}</p>}
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_BADGE[pkg.status] || 'bg-[#F8F7F2] text-stone-600'}`}>
          {pkg.status.replace('_', ' ')}
        </span>
      </div>

      {/* Visits left (service packages only — gifting orders have no visits) */}
      {pkg.total_visits > 0 && (
      <div className="mt-5 rounded-xl bg-sage-50 p-4">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-3xl font-extrabold text-forest-700">{pkg.visits_left}</span>
            <span className="text-sm text-stone-600"> of {pkg.total_visits} gardener visits left</span>
          </div>
          <span className="text-sm font-medium text-stone-500">{pct}% used</span>
        </div>
        <div className="mt-3 h-2.5 w-full rounded-full bg-sage-100">
          <div className="h-full rounded-full bg-forest-700 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      )}

      {/* Meta */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div><div className="text-stone-400">Value</div><div className="font-semibold text-forest-900">{fmtINR(pkg.price)}</div></div>
        <div><div className="text-stone-400">Valid till</div><div className="font-semibold text-forest-900">{fmtDate(pkg.end_date)}</div></div>
        <div><div className="text-stone-400">Started</div><div className="font-semibold text-forest-900">{fmtDate(pkg.start_date)}</div></div>
      </div>

      {/* Pay CTA */}
      {pkg.payment_status !== 'paid' && pkg.status === 'awaiting_payment' && (
        <button onClick={() => pay(pkg.id)} disabled={paying}
          className="pa-btn pa-btn-primary mt-5 w-full">
          {paying ? 'Opening payment…' : `Pay ${fmtINR(pkg.price)} & activate`}
        </button>
      )}

      {/* Items */}
      {pkg.items && pkg.items.length > 0 && (
        <details className="group mt-5">
          <summary className="cursor-pointer text-sm font-semibold text-stone-600">What’s included ({pkg.items.length})</summary>
          <ul className="mt-2 space-y-1.5 text-sm text-stone-600">
            {pkg.items.map((it, j) => (
              <li key={j} className="flex gap-2"><span className="text-green-500">✓</span><span className="capitalize">{it.name}{it.qty && it.qty > 1 ? ` × ${it.qty}` : ''}</span></li>
            ))}
          </ul>
        </details>
      )}

      {/* Visit history */}
      {(completedVisits.length > 0 || upcoming.length > 0) && (
        <div className="mt-5 border-t border-kraft-200 pt-4">
          <h4 className="text-sm font-medium text-stone-600">Visit schedule</h4>
          <ul className="mt-2 space-y-2">
            {upcoming.map((v) => (
              <li key={v.id} className="flex items-center gap-3 text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="text-stone-600">Upcoming · {fmtDate(v.scheduled_date)}</span>
              </li>
            ))}
            {completedVisits.map((v) => (
              <li key={v.id} className="flex items-center gap-3 text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="text-stone-600">Completed · {fmtDate(v.completed_at || v.scheduled_date)}{v.gardener_name ? ` · ${v.gardener_name}` : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function MyPackagesPage() {
  const { data, isLoading } = useMyGardenPackages();
  const packages = data?.data ?? [];

  return (
    <div className="w-full">
      <h1 className="mb-6 font-pahserif text-2xl font-medium text-forest-900">My Garden Packages</h1>

      {isLoading ? (
        <div className="rounded-2xl border border-kraft-200 bg-white p-10 text-center text-stone-500">Loading your packages…</div>
      ) : packages.length === 0 ? (
        <div className="rounded-2xl border border-kraft-200 bg-white p-10 text-center">
          <div className="text-4xl">🌱</div>
          <h3 className="mt-3 text-lg font-medium text-forest-900">No packages yet</h3>
          <p className="mt-1 text-stone-500">Want a garden built and cared for at home? Get a free plan tailored to your space.</p>
          <a href="/garden-service" className="pa-btn pa-btn-primary mt-5">Explore garden service →</a>
        </div>
      ) : (
        <div className="space-y-6">
          {packages.map((p) => <PackageCard key={p.id} pkg={p} />)}
        </div>
      )}
    </div>
  );
}

/* ── App Router body wrapper — chrome + auth live in app/(account)/layout.tsx ── */

export function PageBody(props: any) {
  return <MyPackagesPage {...props} />;
}
