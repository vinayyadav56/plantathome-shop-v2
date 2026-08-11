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
import { Bell, CircleHelp, CreditCard, Download, FileText, Heart, Sprout, Lock, LogOut, Package, Plus, RotateCcw, ShoppingBag, User } from '@/components/ui/icon';

type Props = { className?: string };

/* Line icons per account route, from the shared Lucide funnel. */
const NAV_ICON: Record<string, React.ReactNode> = {
  [Routes.profile]: <User size={18} className="shrink-0" aria-hidden />,
  [Routes.orders]: <ShoppingBag size={18} className="shrink-0" aria-hidden />,
  [Routes.myPackages]: <Package size={18} className="shrink-0" aria-hidden />,
  [Routes.downloads]: <Download size={18} className="shrink-0" aria-hidden />,
  [Routes.wishlists]: <Heart size={18} className="shrink-0" aria-hidden />,
  [Routes.questions]: <CircleHelp size={18} className="shrink-0" aria-hidden />,
  [Routes.refunds]: <RotateCcw size={18} className="shrink-0" aria-hidden />,
  [Routes.reports]: <FileText size={18} className="shrink-0" aria-hidden />,
  [Routes.help]: <CircleHelp size={18} className="shrink-0" aria-hidden />,
  [Routes.changePassword]: <Lock size={18} className="shrink-0" aria-hidden />,
  [Routes.notifyLogs]: <Bell size={18} className="shrink-0" aria-hidden />,
  [Routes.cards]: <CreditCard size={18} className="shrink-0" aria-hidden />,
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
            <Sprout size={18} className="text-forest-600" aria-hidden />
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
            <Plus size={16} className="shrink-0" aria-hidden />
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
              <LogOut size={18} className="shrink-0" aria-hidden />
              {t('profile-sidebar-logout')}
            </button>
          </div>
        </div>

        {/* promo */}
        <div className="overflow-hidden rounded-2xl border border-forest-900/10 bg-sage-100/70">
          <div className="px-5 pt-5">
            <h3 className="font-pahserif text-[20px] font-medium leading-tight text-forest-900">{t('promo-title')}</h3>
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
