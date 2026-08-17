import { Routes } from '@/config/routes';
import Breadcrumb, { type Crumb } from '@/components/ui/breadcrumb';

type PageBannerProps = {
  title: string;
  breadcrumbTitle: string;
  /**
   * Optional intermediate crumbs between Home and the page itself, for pages with real depth —
   * the old hand-rolled pair could only ever say "Home / X", so /customer-refund-policies had no
   * way to show the Help section it lives under.
   */
  items?: Crumb[];
};

/* Brand page banner — warm kraft band + serif heading, matching the homepage
   design language (was the legacy slate Pickbazar banner). Used by help, terms,
   offers, refund policies, flash sales and the shop info pages.

   The trail inside renders through the ONE Breadcrumb component, not its own
   markup — this banner was one of four unrelated breadcrumb implementations. */
const PageBanner = ({ title, breadcrumbTitle, items }: PageBannerProps) => {
  const crumbs: Crumb[] = [
    { label: breadcrumbTitle || 'Home', href: Routes.home },
    ...(items ?? []),
    ...(title ? [{ label: title }] : []),
  ];

  return (
    <div className="flex w-full justify-center border-b border-kraft-200/70 bg-[#F0EDE4] py-16 md:min-h-[230px] lg:min-h-[260px]">
      <div className="relative flex w-full flex-col items-center justify-center px-5">
        {title ? (
          <h1 className="m-0 mb-3 text-center font-pahserif text-[30px] font-medium leading-[1.08] tracking-[-0.01em] text-forest-900 md:mb-4 md:text-[36px] lg:text-[42px]">
            {title}
          </h1>
        ) : (
          ''
        )}
        <Breadcrumb items={crumbs} className="font-hanken" />
      </div>
    </div>
  );
};

export default PageBanner;
