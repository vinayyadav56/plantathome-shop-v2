'use client';
import { useEffect, useRef } from 'react';
import Link from '@/components/ui/link';
import { siteSettings } from '@/config/site';
import { useTranslation } from 'next-i18next';
import { useRouter } from '@/compat/next-router';
import classNames from 'classnames';
import { useLogout, useUser } from '@/framework/user';
import { useSettings } from '@/framework/settings';
import { Routes } from '@/config/routes';
import { isStripeAvailable } from '@/lib/is-stripe-available';
import UserAvatar from '@/components/ui/user-avatar';
import {
  ArrowRight,
  Bell,
  CircleHelp,
  CreditCard,
  Download,
  FileText,
  Heart,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  RotateCcw,
  Settings,
  ShoppingBag,
  User,
} from '@/components/ui/icon';

type Props = { className?: string };

const ICON = { size: 20, className: 'shrink-0', 'aria-hidden': true } as const;

/* One Tabler line icon per account route. */
const NAV_ICON: Record<string, React.ReactNode> = {
  [Routes.profile]: <User {...ICON} />,
  [Routes.orders]: <ShoppingBag {...ICON} />,
  [Routes.myPackages]: <Package {...ICON} />,
  [Routes.wishlists]: <Heart {...ICON} />,
  [Routes.questions]: <MessageCircle {...ICON} />,
  [Routes.downloads]: <Download {...ICON} />,
  [Routes.refunds]: <RotateCcw {...ICON} />,
  [Routes.reports]: <FileText {...ICON} />,
  [`${Routes.profile}#addresses`]: <MapPin {...ICON} />,
  [Routes.notifyLogs]: <Bell {...ICON} />,
  [Routes.cards]: <CreditCard {...ICON} />,
  [Routes.help]: <CircleHelp {...ICON} />,
  [Routes.changePassword]: <Settings {...ICON} />,
};

/**
 * Account sidebar (owner brief 2026-10-03): one white card — who you are, then
 * where you can go. A single nav list serves every width: a horizontal chip
 * strip below lg, a 44px-row column from lg. No wallet (it lives on /profile
 * now) and no decorative photo.
 */
const DashboardSidebar: React.FC<Props> = ({ className }) => {
  const { mutate: logout } = useLogout();
  const { settings } = useSettings();
  const { me }: any = useUser();
  const { t } = useTranslation();
  const { pathname } = useRouter();
  const scrollerRef = useRef<HTMLUListElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);

  const navItems = (siteSettings.dashboardSidebarMenu ?? [])
    .slice(0, -1)
    .filter((item: any) => {
      if (item?.href === Routes.cards && !isStripeAvailable(settings)) return false;
      if (item?.href === Routes.notifyLogs && !settings?.enableEmailForDigitalProduct) return false;
      return true;
    });

  // A jump link (#addresses) is never "the page you're on", so My Profile and
  // My Addresses can't both light up. Child routes (/notification/123) count.
  const isActive = (href: string) =>
    !href.includes('#') && (pathname === href || pathname.startsWith(`${href}/`));

  // Below lg the list is a horizontal strip: bring the active chip into view.
  // scrollLeft only — scrollIntoView would also scroll the page vertically.
  useEffect(() => {
    const strip = scrollerRef.current;
    const active = activeRef.current;
    if (strip && active && strip.scrollWidth > strip.clientWidth) {
      strip.scrollLeft = active.offsetLeft - 12;
    }
  }, [pathname]);

  const name = me?.name || [me?.first_name, me?.last_name].filter(Boolean).join(' ');
  const subline = me?.email ?? me?.profile?.contact ?? '';

  const item =
    'flex items-center gap-3 whitespace-nowrap font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-btn focus-visible:ring-offset-2 ' +
    'h-10 rounded-full border px-4 text-[13.5px] lg:h-11 lg:w-full lg:rounded-control lg:border-0 lg:px-3 lg:text-[15px]';

  return (
    <aside className={className}>
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-kraft-200 bg-white shadow-box">
          {/* who you are */}
          <div className="flex items-center gap-3 p-4 lg:px-5 lg:pt-5">
            <UserAvatar user={me} className="h-12 w-12 text-[15px]" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-forest-900">{name}</p>
              {subline && <p className="truncate text-[13px] text-stone-500">{subline}</p>}
            </div>
          </div>

          {/* where you can go */}
          <nav aria-label={t('account-nav-label')} className="border-t border-kraft-200">
            <ul
              ref={scrollerRef}
              className="relative flex gap-2 overflow-x-auto p-3 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-col lg:gap-0.5 lg:overflow-visible [&::-webkit-scrollbar]:hidden"
            >
              {navItems.map((nav: any) => {
                const active = isActive(nav.href);
                return (
                  <li key={nav.href} ref={active ? activeRef : undefined} className="shrink-0">
                    <Link
                      href={nav.href}
                      aria-current={active ? 'page' : undefined}
                      className={classNames(
                        item,
                        active
                          ? 'border-transparent bg-ds-btn text-white'
                          : 'border-kraft-200 bg-white text-forest-900 hover:bg-sage-50',
                      )}
                    >
                      <span className={classNames('hidden lg:inline-flex', active ? 'text-white' : 'text-forest-600')}>
                        {NAV_ICON[nav.href] ?? NAV_ICON[Routes.profile]}
                      </span>
                      {t(nav.label)}
                    </Link>
                  </li>
                );
              })}
              <li className="shrink-0 lg:mt-2 lg:border-t lg:border-kraft-200 lg:pt-2">
                <button
                  type="button"
                  onClick={() => logout()}
                  className={classNames(item, 'border-red-200 bg-white text-red-600 hover:bg-red-50')}
                >
                  <span className="hidden lg:inline-flex">
                    <LogOut {...ICON} />
                  </span>
                  {t('profile-sidebar-logout')}
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* a quiet nudge back to the shop — text only, no decorative photo */}
        <div className="hidden rounded-2xl border border-kraft-200 bg-white p-5 shadow-box lg:block">
          <p className="text-[16px] font-semibold leading-snug text-forest-900">{t('promo-title')}</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-stone-600">{t('promo-sub')}</p>
          <Link
            href="/plants"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-control bg-ds-btn px-4 text-[13.5px] font-semibold text-white transition-colors duration-200 hover:bg-ds-btn-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-btn focus-visible:ring-offset-2"
          >
            {t('promo-cta')}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
