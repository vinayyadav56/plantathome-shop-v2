'use client';

import ProfileAddressGrid from '@/components/profile/profile-address';
import Card from '@/components/ui/cards/card';
import { useTranslation } from 'next-i18next';
import ProfileForm from '@/components/profile/profile-form';
import ProfileContact from '@/components/profile/profile-contact';
import ProfileEmail from '@/components/profile/profile-email';
import Seo from '@/components/seo/seo';
import { useUser } from '@/framework/user';
import { Gift, ShieldCheck, Wallet } from '@/components/ui/icon';

/** "2025-07-14T…" → "July 2025"; null when the API sends nothing usable. */
function memberSince(createdAt?: string): string | null {
  const d = createdAt ? new Date(createdAt) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(d);
}

/**
 * My Account → Profile (owner brief 2026-10-03): one calm grid of real data.
 * Wallet + member benefits first, then the profile card beside email/contact,
 * then addresses full width. Below 1280px it is one column in that same order.
 * Deliberately absent (no backend for them): 2FA, membership tiers, a WhatsApp
 * opt-in toggle, a phone "verified" flag.
 */
const ProfilePage = () => {
  const { t } = useTranslation('common');
  const { me } = useUser();
  if (!me) return null;

  const w = me.wallet ?? {};
  const stats = [
    { label: t('wallet-total'), value: w.total_points ?? 0 },
    { label: t('wallet-used'), value: w.points_used ?? 0 },
    { label: t('wallet-available'), value: w.available_points ?? 0 },
  ];
  const since = memberSince(me.created_at);

  return (
    <>
      <Seo noindex={true} nofollow={true} />
      <h1 className="sr-only">{t('profile-sidebar-profile')}</h1>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] xl:gap-6">
        {/* wallet */}
        <Card className="w-full">
          <div className="flex items-center gap-2.5">
            <Wallet size={20} aria-hidden className="text-forest-700" />
            <h2 className="text-[18px] font-semibold text-forest-900">{t('wallet-points')}</h2>
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col-reverse">
                <dt className="mt-1.5 text-[13px] text-stone-500">{s.label}</dt>
                <dd className="text-[26px] font-bold leading-none tabular-nums text-forest-900">{s.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 flex items-center gap-2.5 rounded-control bg-sage-100 px-4 py-3 text-[13.5px] font-medium text-forest-800">
            <Gift size={18} aria-hidden className="shrink-0 text-forest-700" />
            {t('earn-more-points')}
          </p>
        </Card>

        {/* member benefits — no tier badge: there is no tier data */}
        <Card className="w-full">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={20} aria-hidden className="text-forest-700" />
            <h2 className="text-[18px] font-semibold text-forest-900">{t('member-benefits')}</h2>
          </div>
          <p className="mt-5 text-[16px] font-semibold text-forest-900">{t('member-benefits-title')}</p>
          {since && <p className="mt-0.5 text-[13px] text-stone-500">{t('member-since', { date: since })}</p>}
          <p className="mt-3 text-[14px] leading-relaxed text-stone-600">{t('member-benefits-copy')}</p>
        </Card>

        <div className="min-w-0 md:col-span-2 xl:col-span-1">
          <ProfileForm user={me} />
        </div>
        <div className="flex min-w-0 flex-col gap-5 md:col-span-2 xl:col-span-1 xl:gap-6">
          <ProfileEmail user={me} />
          <ProfileContact user={me} />
        </div>

        {/* scroll-mt: the sticky header (~105px on desktop) would cover the
            section when the sidebar's "My Addresses" jump link lands here. */}
        <Card id="addresses" className="w-full scroll-mt-32 md:col-span-2">
          <ProfileAddressGrid userId={me.id} addresses={me.address} label={t('text-addresses')} />
        </Card>
      </div>
    </>
  );
};

export default ProfilePage;


/* ── App Router body wrapper — chrome + auth live in app/(account)/layout.tsx ── */

export function PageBody(props: any) {
  return <ProfilePage {...props} />;
}
