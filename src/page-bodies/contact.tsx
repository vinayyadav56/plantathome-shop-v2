'use client';

import Breadcrumb from '@/components/ui/breadcrumb';
import { useTranslation } from 'next-i18next';
import SuperAdminContactForm from '@/components/settings/super-admin-contact-form';
import { getLayout } from '@/components/layouts/layout';
// import { formatAddress } from '@/lib/format-address';
import { getIcon } from '@/lib/get-icon';
// import isEmpty from 'lodash/isEmpty';
import * as socialIcons from '@/components/icons/social';
import Seo from '@/components/seo/seo';
import { Routes } from '@/config/routes';
import { useSettings } from '@/framework/settings';
import Link from '@/components/ui/link';
import { isObject } from 'lodash';
import { getLayoutWithFooter } from '@/components/layouts/layout-with-footer';

export const ContactPage = () => {
  const { t } = useTranslation('common');
  const { settings }: any = useSettings();

  return (
    <>
      <Seo title={'Contact'} url={'contact'} />
      <Breadcrumb
        className="mx-auto w-full max-w-7xl px-5 pt-4 sm:px-8"
        items={[{ label: 'Home', href: Routes.home }, { label: 'Contact' }]}
      />
      <div className="w-full g-light-a">
        <div className="mx-auto flex w-full max-w-7xl flex-col px-5 py-10 pb-20 md:flex-row md:pb-10 xl:py-14 xl:px-8 xl:pb-14 2xl:px-14">
          {/* sidebar */}
          <div className="order-2 w-full shrink-0 rounded-xl border border-forest-900/10 bg-white p-5 md:order-1 md:w-72 lg:w-96">
            <div className="mb-8 w-full overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero-emerald.jpg"
                alt={t('nav-menu-contact')}
                className="h-44 w-full object-cover"
              />
            </div>

            <div className="mb-8 flex flex-col">
              <span className="mb-3 font-semibold text-forest-900">
                {t('text-address')}
              </span>
              <span className="text-sm text-body">
                {settings?.contactDetails?.location?.formattedAddress || (settings as any)?.contactAddress ? (
                  <Link
                    title={settings?.contactDetails?.location?.formattedAddress || (settings as any)?.contactAddress}
                    target="_blank"
                    href={`https://www.google.com/maps/place/${settings?.contactDetails?.location?.formattedAddress || (settings as any)?.contactAddress}`}
                  >
                    {settings?.contactDetails?.location?.formattedAddress || (settings as any)?.contactAddress}
                  </Link>
                ) : (
                  t('common:text-no-address')
                )}
              </span>
            </div>

            <div className="mb-8 flex flex-col">
              <span className="mb-3 font-semibold text-forest-900">
                {t('text-phone')}
              </span>
              <span className="text-sm text-body">
                {settings?.contactDetails?.contact || (settings as any)?.contactPhone
                  ? (settings?.contactDetails?.contact || (settings as any)?.contactPhone)
                  : t('text-no-contact')}
              </span>
            </div>

            <div className="mb-8 flex flex-col">
              <span className="mb-3 font-semibold text-forest-900">
                Email Address
              </span>
              <span className="text-sm text-body">
                {settings?.contactDetails?.emailAddress || (settings as any)?.contactEmail
                  ? (settings?.contactDetails?.emailAddress || (settings as any)?.contactEmail)
                  : 'No Email Address'}
              </span>
            </div>
            {settings?.contactDetails?.website && (
              <div className="mb-8 flex flex-col">
                <span className="mb-3 font-semibold text-forest-900">
                  {t('text-website')}
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-body">
                    {settings?.contactDetails?.website}
                  </span>
                  <Link
                    href={settings?.contactDetails?.website ?? Routes?.home}
                    target="_blank"
                    // rel="noreferrer"
                    className="text-sm font-semibold text-[#175840] hover:text-[#1B6B50] focus:text-[#1B6B50] focus:outline-none"
                  >
                    {t('text-visit-site')}
                  </Link>
                </div>
              </div>
            )}

            <div className="mb-8 flex flex-col">
              <span className="mb-4 font-semibold text-forest-900">
                {t('text-follow-us')}
              </span>
              <div className="flex items-center justify-start">
                {settings?.contactDetails?.socials?.map(
                  (item: any, index: number) =>
                    item?.url ? (
                      <Link
                        key={index}
                        href={item?.url}
                        target="_blank"
                        title={item?.url}
                        // rel="noreferrer"
                        className={`text-muted transition-colors duration-300 focus:outline-none ltr:mr-8 ltr:last:mr-0 rtl:ml-8 rtl:last:ml-0 hover:${item.hoverClass}`}
                      >
                        {getIcon({
                          iconList: socialIcons,
                          iconName: isObject(item?.icon)
                            ? item?.icon?.value
                            : item?.icon,
                          className: 'w-4 h-4',
                        })}
                      </Link>
                    ) : (
                      ''
                    )
                )}
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="order-1 mb-8 w-full rounded-xl border border-forest-900/10 bg-white p-5 md:order-2 md:mb-0 md:p-8 ltr:md:ml-7 rtl:md:mr-7 ltr:lg:ml-9 rtl:lg:mr-9">
            <h1 className="mb-7 font-pahserif text-2xl font-medium text-forest-900 md:text-3xl">
              {t('text-questions-comments')}
            </h1>
            <SuperAdminContactForm />
          </div>
        </div>
      </div>
    </>
  );
};
ContactPage.getLayout = getLayoutWithFooter;
export default ContactPage;


/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <ContactPage {...props} />;
  const withLayout = (ContactPage as any).getLayout ? (ContactPage as any).getLayout(page) : page;
  return withLayout;
}
