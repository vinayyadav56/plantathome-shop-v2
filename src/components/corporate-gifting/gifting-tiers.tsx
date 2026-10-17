'use client';

import { useState } from 'react';
import { useAtom } from 'jotai';
import { toast } from 'react-toastify';
import Button from '@/components/ui/button';
import { goToSignin } from '@/lib/go-to-signin';
import { authorizationAtom } from '@/store/authorization-atom';
import { useGiftingTemplates, useGiftingCheckout } from '@/framework/garden';
import { Check, Gift } from '@/components/ui/icon';

const fmt = (n: number) => '₹' + Number(n).toLocaleString('en-IN');

/**
 * The buyable gifting hampers (garden-package-templates, service=gifting) as compact text-led
 * cards — the templates have no image column. Shared by /corporate-gifting (a snap rail under
 * the enquiry form) and the Offers → Corporate tab (a grid): `className` is the list wrapper.
 * Renders a skeleton while loading and nothing when the API lists no hamper; the empty state
 * belongs to the page.
 */
export default function GiftingTiers({ className }: { className?: string }) {
  const { data, isLoading } = useGiftingTemplates();
  const tiers = data?.data ?? [];
  const [isAuthorize] = useAtom(authorizationAtom);
  const { mutate: checkout, isLoading: buying } = useGiftingCheckout();
  const [buyingId, setBuyingId] = useState<number | null>(null);

  const buy = (id: number) => {
    if (!isAuthorize) {
      goToSignin();
      return;
    }
    setBuyingId(id);
    checkout(id, {
      onSuccess: (res) => {
        const url = res?.data?.url;
        if (url) window.location.href = url;
        else toast.success('Order created — see it in My Packages.');
        setBuyingId(null);
      },
      onError: () => {
        toast.error('Could not start checkout. Please try the enquiry form.');
        setBuyingId(null);
      },
    });
  };

  if (isLoading) {
    return (
      <div className={className}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl border border-kraft-200 bg-white shadow-box" />
        ))}
      </div>
    );
  }
  if (tiers.length === 0) return null;

  return (
    <div className={className}>
      {tiers.map((t) => {
        const starting = buying && buyingId === t.id;
        return (
          <article key={t.id} className="flex flex-col rounded-2xl border border-kraft-200 bg-white p-5 shadow-box">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-forest-700 ring-1 ring-gold">
                <Gift size={20} aria-hidden />
              </span>
              {t.badge && (
                <span className="ml-auto rounded-full bg-sage-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-forest-800">
                  {t.badge}
                </span>
              )}
            </div>
            <h3 className="mt-3 font-heading text-[18px] text-forest-900">{t.name}</h3>
            {t.tagline ? <p className="mt-1 text-[13px] text-stone-600">{t.tagline}</p> : null}
            <p className="mt-3 text-[15px] font-semibold text-forest-900">
              From {fmt(t.suggested_price)}
              <span className="text-[13px] font-normal text-stone-500"> / gift</span>
            </p>
            <ul className="mt-3 flex-1 space-y-1.5 text-[13px] text-stone-600">
              {(t.items ?? []).map((it, j) => (
                <li key={j} className="flex gap-2">
                  <Check size={14} className="mt-0.5 shrink-0 text-forest-700" aria-hidden />
                  <span>{it.name}</span>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="formPrimary"
              size="small"
              className="mt-4 w-full"
              onClick={() => buy(t.id)}
              loading={starting}
              disabled={starting}
            >
              {isAuthorize ? 'Buy now' : 'Login to buy'}
            </Button>
          </article>
        );
      })}
    </div>
  );
}
