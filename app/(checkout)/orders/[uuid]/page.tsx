'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FadeUp } from '@/components/motion';
import { getOrder } from '@/lib/api/endpoints';
import { qk } from '@/lib/query-keys';
import { formatMoney } from '@/lib/money';

const STEPS = ['Confirmed', 'Packed', 'Out for delivery', 'Delivered'];

export default function OrderPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const { data: order, isLoading, isError } = useQuery({
    queryKey: qk.order(uuid),
    queryFn: () => getOrder(uuid),
    retry: 2,
  });

  if (isLoading) return <div className="container-wide py-16 text-forest-ink/50">Loading your order…</div>;
  if (isError || !order) return <div className="container-wide py-16 text-clay">We couldn’t load this order.</div>;

  return (
    <div className="container-wide max-w-2xl py-12">
      <FadeUp>
        <div className="mb-10 text-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-forest text-cream"
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </motion.div>
          <h1 className="font-pahserif text-[clamp(2.4rem,1.8rem+2vw,3.4rem)] font-semibold text-forest-ink">Order placed 🌱</h1>
          <p className="mt-2 text-forest-ink/60">
            Thank you! Order <span className="font-mono text-sm text-forest-ink">{order.uuid.slice(0, 8)}</span> · status{' '}
            <span className="font-medium capitalize text-forest">{order.status}</span>
          </p>
        </div>
      </FadeUp>

      {/* progress tracker */}
      <div className="mb-10 flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-1">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${i === 0 ? 'bg-forest text-cream' : 'bg-forest-soft text-forest/40'}`}>{i + 1}</div>
            <span className={`hidden text-[11px] font-medium sm:inline ${i === 0 ? 'text-forest-ink' : 'text-forest-ink/40'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 rounded ${i === 0 ? 'bg-forest' : 'bg-forest-soft'}`} />}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {order.sub_orders.map((sub, i) => (
          <FadeUp key={sub.uuid} delay={i * 0.06}>
            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-forest-accent">Nursery {i + 1}</p>
                <span className="rounded-full bg-forest-soft px-3 py-0.5 text-xs font-medium capitalize text-forest">{sub.status}</span>
              </div>
              <ul className="divide-y divide-forest/10">
                {sub.items.map((it) => (
                  <li key={it.uuid} className="flex items-center justify-between py-2.5">
                    <span className="text-forest-ink">{it.product?.name ?? 'Plant'} <span className="text-forest-ink/50">× {it.qty}</span></span>
                    <span className="font-medium text-forest-ink">{formatMoney(it.price)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeUp>
        ))}
      </div>

      {order.totals?.grand_total && (
        <div className="card mt-6 flex items-center justify-between p-5 text-lg font-semibold text-forest-ink">
          <span>Total paid</span>
          <span data-testid="order-total">{formatMoney(order.totals.grand_total)}</span>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/products" className="btn-cta px-6 py-3">Continue shopping</Link>
        <Link href="/track-order" className="pa-btn pa-btn-outline">Track this order</Link>
      </div>

      <p className="mt-6 text-center text-sm text-forest-ink/50">A confirmation with care instructions is on its way to your inbox.</p>
    </div>
  );
}
