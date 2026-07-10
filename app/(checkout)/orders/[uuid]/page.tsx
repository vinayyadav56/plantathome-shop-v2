'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getOrder } from '@/lib/api/endpoints';
import { qk } from '@/lib/query-keys';
import { formatMoney } from '@/lib/money';

export default function OrderPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const { data: order, isLoading, isError } = useQuery({
    queryKey: qk.order(uuid),
    queryFn: () => getOrder(uuid),
    retry: 2,
  });

  if (isLoading) return <div className="container-wrap py-16 text-forest-ink/50">Loading your order…</div>;
  if (isError || !order)
    return <div className="container-wrap py-16 text-clay">We couldn&apos;t load this order.</div>;

  return (
    <div className="container-wrap max-w-2xl py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-forest-soft text-forest">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="font-heading text-4xl font-semibold text-forest-ink">Order placed</h1>
        <p className="mt-1 text-forest-ink/60">
          Order <span className="font-mono text-sm">{order.uuid.slice(0, 8)}</span> · status{' '}
          <span className="font-medium capitalize text-forest">{order.status}</span>
        </p>
      </div>

      <div className="space-y-4">
        {order.sub_orders.map((sub, i) => (
          <div key={sub.uuid} className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-forest-accent">
                Nursery {i + 1}
              </p>
              <span className="rounded-pill bg-forest-soft px-3 py-0.5 text-xs font-medium capitalize text-forest">
                {sub.status}
              </span>
            </div>
            <ul className="divide-y divide-forest/10">
              {sub.items.map((it) => (
                <li key={it.uuid} className="flex items-center justify-between py-2.5">
                  <span className="text-forest-ink">
                    {it.product?.name ?? 'Plant'} <span className="text-forest-ink/50">× {it.qty}</span>
                  </span>
                  <span className="font-medium text-forest-ink">{formatMoney(it.price)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {order.totals?.grand_total && (
        <div className="card mt-6 flex items-center justify-between p-5 text-lg font-semibold text-forest-ink">
          <span>Total paid</span>
          <span data-testid="order-total">{formatMoney(order.totals.grand_total)}</span>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/products" className="btn-outline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
