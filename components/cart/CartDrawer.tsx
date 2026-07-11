'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useDrawer } from '@/lib/store/drawer';
import { useSession } from '@/lib/store/session';
import { useCartSnaps } from '@/lib/store/cart-snapshots';
import { getCart, removeCartItem } from '@/lib/api/endpoints';
import { qk } from '@/lib/query-keys';
import { formatMoney, type Money } from '@/lib/money';

const FREE_DELIVERY_MINOR = 99900; // ₹999

export function CartDrawer() {
  const open = useDrawer((s) => s.open);
  const view = useDrawer((s) => s.view);
  const close = useDrawer((s) => s.close);
  const user = useSession((s) => s.user);
  const snaps = useCartSnaps((s) => s.snaps);
  const qc = useQueryClient();

  const isOpen = open && view === 'cart';

  const { data: cart, isLoading } = useQuery({ queryKey: qk.cart, queryFn: getCart, enabled: !!user && isOpen });
  const remove = useMutation({
    mutationFn: (itemUuid: string) => removeCartItem(itemUuid),
    onSuccess: (updated) => qc.setQueryData(qk.cart, updated),
  });

  const items = cart?.items ?? [];
  const subtotalMinor = cart?.grand_total_minor ?? 0;
  const remaining = Math.max(0, FREE_DELIVERY_MINOR - subtotalMinor);
  const pct = Math.min(100, Math.round((subtotalMinor / FREE_DELIVERY_MINOR) * 100));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-forest-ink/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            className="fixed right-0 top-0 z-[81] flex h-full w-full max-w-md flex-col bg-cream shadow-lift"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
            role="dialog"
            aria-label="Shopping cart"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-forest/10 px-5 py-4">
              <h2 className="flex items-center gap-2 font-heading text-2xl font-semibold text-forest-ink">
                Your cart <span className="text-base font-normal text-forest-ink/50">({items.length})</span>
              </h2>
              <button onClick={close} aria-label="Close cart" className="text-forest-ink/60 hover:text-forest-ink">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
              </button>
            </div>

            {!user ? (
              <Empty title="Sign in to see your cart" cta={{ href: '/login', label: 'Sign in' }} onClose={close} />
            ) : isLoading ? (
              <div className="flex-1 p-5 text-forest-ink/50">Loading…</div>
            ) : items.length === 0 ? (
              <Empty title="Your cart is empty" cta={{ href: '/plants', label: 'Browse plants' }} onClose={close} />
            ) : (
              <>
                {/* Free-delivery progress */}
                <div className="border-b border-forest/10 px-5 py-3">
                  {remaining > 0 ? (
                    <p className="text-sm text-forest-ink/70">
                      Add <span className="font-semibold text-forest">{formatMoney({ amount_minor: remaining, currency: 'INR' })}</span> more for FREE delivery
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-forest-accent">You’ve unlocked FREE delivery! 🎉</p>
                  )}
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-forest-soft">
                    <div className="h-full rounded-full bg-cta transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {/* Items */}
                <ul className="flex-1 divide-y divide-forest/10 overflow-y-auto px-5">
                  {items.map((it) => {
                    const snap = snaps[it.variant_uuid];
                    return (
                      <li key={it.uuid} className="flex gap-3 py-4">
                        <div className="pa-card-art relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl">
                          {snap?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={snap.image} alt={snap.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-cormorant text-forest-accent/50">🌿</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-forest-ink">{snap?.name ?? 'Plant'}</p>
                          {snap?.size && <p className="text-xs text-forest-ink/50">Size {snap.size}</p>}
                          <p className="mt-1 text-sm text-forest-ink/60">Qty {it.qty}</p>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <button onClick={() => remove.mutate(it.uuid)} aria-label="Remove" className="text-forest-ink/40 hover:text-clay">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                          </button>
                          <span className="font-semibold text-forest-ink">{formatMoney(it.price as Money)}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Footer */}
                <div className="border-t border-forest/10 bg-white px-5 py-4">
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="text-forest-ink/70">Subtotal</span>
                    <span className="text-lg font-bold text-forest-ink">{formatMoney({ amount_minor: subtotalMinor, currency: 'INR' })}</span>
                  </div>
                  <Link href="/cart" onClick={close} className="btn-cta w-full py-3.5" data-testid="drawer-checkout">
                    Proceed to checkout
                  </Link>
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-forest-ink/50">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" /></svg>
                    Secure checkout · 7-day easy returns
                  </p>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Empty({ title, cta, onClose }: { title: string; cta: { href: string; label: string }; onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest-soft text-3xl">🌱</div>
      <p className="font-heading text-2xl text-forest-ink">{title}</p>
      <Link href={cta.href} onClick={onClose} className="btn-cta px-6 py-2.5">{cta.label}</Link>
    </div>
  );
}
