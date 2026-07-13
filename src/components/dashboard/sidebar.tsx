'use client';
import Link from '@/components/ui/link';
import { siteSettings } from '@/config/site';
import { useTranslation } from 'next-i18next';
import { useRouter } from '@/compat/next-router';
import classNames from 'classnames';
import { useLogout, useUser } from '@/framework/user';
import { useSettings } from '@/framework/settings';
import { Routes } from '@/config/routes';
import { isStripeAvailable } from '@/lib/is-stripe-available';

type Props = { className?: string };

/* Thin line icons per account route (Lucide-style, matching the storefront). */
const I = (d: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0" aria-hidden>{d}</svg>
);
const NAV_ICON: Record<string, React.ReactNode> = {
  [Routes.profile]: I(<><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></>),
  [Routes.orders]: I(<><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18M16 10a4 4 0 0 1-8 0" /></>),
  [Routes.myPackages]: I(<><path d="M12 2 3 7v10l9 5 9-5V7Z" /><path d="m3 7 9 5 9-5M12 22V12" /></>),
  [Routes.downloads]: I(<><path d="M12 3v12M8 11l4 4 4-4" /><path d="M4 19h16" /></>),
  [Routes.wishlists]: I(<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" />),
  [Routes.questions]: I(<><circle cx="12" cy="12" r="9.5" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .8-1 1.7M12 17h.01" /></>),
  [Routes.refunds]: I(<><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>),
  [Routes.reports]: I(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M9 13h6M9 17h4" /></>),
  [Routes.help]: I(<><circle cx="12" cy="12" r="9.5" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.8.4-1.4.9-1.4 1.7M12 17h.01" /></>),
  [Routes.changePassword]: I(<><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>),
  [Routes.notifyLogs]: I(<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>),
  [Routes.cards]: I(<><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>),
};

const DashboardSidebar: React.FC<Props> = ({ className }) => {
  const { mutate: logout } = useLogout();
  const { settings } = useSettings();
  const { me }: any = useUser();
  const { t } = useTranslation();
  const { pathname } = useRouter();

  const navItems = (siteSettings.dashboardSidebarMenu ?? [])
    .slice(0, -1)
    .filter((item: any) => {
      if (item?.href === Routes.cards && !isStripeAvailable(settings)) return false;
      if (item?.href === Routes.notifyLogs && !settings?.enableEmailForDigitalProduct) return false;
      return true;
    });

  const w = me?.wallet ?? {};
  const walletStats = [
    { k: t('wallet-total'), v: w.total_points ?? 0, accent: true },
    { k: t('wallet-used'), v: w.points_used ?? 0 },
    { k: t('wallet-available'), v: w.available_points ?? 0 },
  ];

  return (
    <aside className={className}>
      {/* mobile: horizontal scroll tabs (wallet + promo are desktop-only) */}
      <div className="lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item: any, i: number) => (
            <Link
              key={i}
              href={item.href}
              className={classNames(
                'shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-semibold transition',
                pathname === item.href
                  ? 'border-transparent bg-ds-accent text-white'
                  : 'border-forest-900/10 bg-white text-forest-900 hover:bg-[var(--ds-accent-soft)]',
              )}
            >
              {t(item.label)}
            </Link>
          ))}
          <button
            onClick={() => logout()}
            className="shrink-0 whitespace-nowrap rounded-full border border-red-200 bg-white px-4 py-2 text-[13px] font-semibold text-red-500 transition hover:bg-red-50"
          >
            {t('profile-sidebar-logout')}
          </button>
        </div>
      </div>

      {/* desktop: wallet card + nav card + promo card */}
      <div className="hidden flex-col gap-5 lg:flex">
        {/* wallet points */}
        <div className="rounded-2xl border border-forest-900/10 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] text-forest-600" aria-hidden><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z" /><path d="M2 21c0-3 1.85-5.4 5.08-6" /></svg>
            <span className="text-[15px] font-bold text-forest-900">{t('wallet-points')}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {walletStats.map((s) => (
              <div key={s.k}>
                <div className={classNames('text-[22px] font-extrabold leading-none tabular-nums', s.accent ? 'text-forest-600' : 'text-forest-900')}>{s.v}</div>
                <div className="mt-1.5 text-[11px] font-medium text-stone-500">{s.k}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-sage-100 px-3.5 py-2.5 text-[12px] font-semibold text-forest-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>
            {t('earn-more-points')}
          </div>
        </div>

        {/* nav */}
        <div className="overflow-hidden rounded-2xl border border-forest-900/10 bg-white">
          <ul className="p-2.5">
            {navItems.map((item: any, i: number) => {
              const active = pathname === item.href;
              return (
                <li key={i}>
                  <Link
                    href={item.href}
                    className={classNames(
                      'flex items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] font-semibold transition',
                      active ? 'bg-ds-accent text-white' : 'text-forest-900 hover:bg-[var(--ds-accent-soft)]',
                    )}
                  >
                    <span className={active ? 'text-white' : 'text-forest-500'}>{NAV_ICON[item.href] ?? NAV_ICON[Routes.profile]}</span>
                    {t(item.label)}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-forest-900/10 p-2.5">
            <button
              onClick={() => logout()}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] font-semibold text-red-500 transition hover:bg-red-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0" aria-hidden><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></svg>
              {t('profile-sidebar-logout')}
            </button>
          </div>
        </div>

        {/* promo */}
        <div className="overflow-hidden rounded-2xl border border-forest-900/10 bg-sage-100/70">
          <div className="px-5 pt-5">
            <h3 className="font-pahserif text-[20px] font-semibold leading-tight text-forest-900">{t('promo-title')}</h3>
            <p className="mt-2 text-[13px] leading-snug text-stone-600">{t('promo-sub')}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=520&q=80&auto=format&fit=crop"
            alt=""
            className="mt-4 h-[150px] w-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
