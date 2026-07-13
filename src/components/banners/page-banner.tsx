import Link from 'next/link';
import { HomeIconNew } from '@/components/icons/home-icon-new';
import { Routes } from '@/config/routes';
import { ArrowNext } from '@/components/icons';

type PageBannerProps = {
  title: string;
  breadcrumbTitle: string;
};

/* Brand page banner — warm kraft band + serif heading, matching the homepage
   design language (was the legacy slate Pickbazar banner). Used by help, terms,
   offers, refund policies, flash sales and the shop info pages. */
const PageBanner = ({ title, breadcrumbTitle }: PageBannerProps) => {
  return (
    <div className="flex w-full justify-center border-b border-kraft-200/70 bg-[#F0EDE4] py-16 md:min-h-[230px] lg:min-h-[260px]">
      <div className="relative flex w-full flex-col items-center justify-center px-5">
        {title ? (
          <h1 className="m-0 mb-3 text-center font-pahserif text-[30px] font-semibold leading-[1.08] tracking-[-0.01em] text-forest-900 md:mb-4 md:text-[36px] lg:text-[42px]">
            {title}
          </h1>
        ) : (
          ''
        )}
        <div className="flex items-center font-hanken">
          <ul className="flex w-full items-center overflow-hidden">
            {breadcrumbTitle ? (
              <li className="px-2.5 text-sm text-forest-800 transition duration-200 ease-in hover:text-forest-600 ltr:first:pl-0 ltr:last:pr-0 rtl:first:pr-0 rtl:last:pl-0">
                <Link href={Routes.home} className="inline-flex items-center">
                  <HomeIconNew className="ltr:mr-1.5 rtl:ml-1.5" />
                  {breadcrumbTitle}
                </Link>
              </li>
            ) : (
              ''
            )}
            {title ? (
              <>
                <li className="mt-[1px] text-base text-stone-400">
                  <ArrowNext className="h-4 w-4" />
                </li>
                <li className="px-2.5 text-sm text-stone-500 transition duration-200 ease-in ltr:first:pl-0 ltr:last:pr-0 rtl:first:pr-0 rtl:last:pl-0">
                  {title}
                </li>
              </>
            ) : (
              ''
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PageBanner;
