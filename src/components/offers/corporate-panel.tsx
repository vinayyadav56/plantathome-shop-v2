import Link from 'next/link';
import { useState } from 'react';
import { useAtom } from 'jotai';
import { toast } from 'react-toastify';
import { goToSignin } from '@/lib/go-to-signin';
import { authorizationAtom } from '@/store/authorization-atom';
import { useGiftingTemplates, useGiftingCheckout } from '@/framework/garden';

const fmt = (n: number) => '₹' + Number(n).toLocaleString('en-IN');

export default function CorporatePanel() {
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

  return (
    <div className="w-full">
      <p className="max-w-2xl text-stone-600">
        Memorable, sustainable plant gifts for clients and teams — buy a
        ready-to-gift hamper below, or explore the full corporate experience for
        custom branding &amp; bulk enquiries.
      </p>

      {isLoading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-2xl border border-kraft-200 bg-white"
            />
          ))}
        </div>
      ) : tiers.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-kraft-200 bg-white p-10 text-center">
          <div className="text-4xl">🎁</div>
          <h3 className="mt-3 font-pahserif text-lg font-bold text-forest-900">
            Corporate gifting, made effortless
          </h3>
          <p className="mt-1 text-stone-500">
            Custom branded plant hampers for teams, clients &amp; festive
            occasions — get a tailored quote.
          </p>
          <Link
            href="/corporate-gifting"
            className="pa-btn pa-btn-primary mt-5 inline-block"
          >
            Explore corporate gifting →
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tiers.map((t, i) => (
              <div
                key={t.id}
                className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                  i === 2
                    ? 'border-gold-400 ring-1 ring-gold-400'
                    : 'border-kraft-200'
                }`}
              >
                {i === 2 && (
                  <div className="mb-3 inline-block self-start rounded-full bg-gold-400 px-3 py-1 text-xs font-bold text-forest-900">
                    PREMIUM
                  </div>
                )}
                <h3 className="font-pahserif text-xl font-bold text-forest-900">
                  {t.name}
                </h3>
                <p className="mt-1 text-sm text-stone-500">{t.tagline}</p>
                <div className="mt-4 text-3xl font-extrabold text-forest-700">
                  From {fmt(t.suggested_price)}
                  <span className="text-sm font-medium text-stone-400"> /gift</span>
                </div>
                <ul className="mt-5 flex-1 space-y-2 text-sm text-stone-600">
                  {(t.items ?? []).map((it, j) => (
                    <li key={j} className="flex gap-2">
                      <span className="text-forest-600">✓</span>
                      <span>{it.name}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => buy(t.id)}
                  disabled={buying && buyingId === t.id}
                  className="pa-btn pa-btn-primary mt-6 w-full"
                >
                  {buying && buyingId === t.id
                    ? 'Starting…'
                    : isAuthorize
                    ? 'Buy now'
                    : 'Login to buy'}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-kraft-200 bg-white p-6 text-center sm:p-8">
            <h3 className="font-pahserif text-xl font-bold text-forest-900">
              Need custom branding or bulk quantities?
            </h3>
            <p className="mx-auto mt-1 max-w-xl text-sm text-stone-500">
              Custom pots, tags &amp; packaging with your logo, split-shipped
              pan-India — send an enquiry and our gifting team will tailor a
              proposal.
            </p>
            <Link
              href="/corporate-gifting"
              className="pa-btn pa-btn-primary mt-5 inline-block"
            >
              Explore corporate gifting →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
