'use client';

import { privacyPolicy } from '@/framework/static/privacy';
import { Link, Element } from 'react-scroll';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { GetStaticProps } from 'next';
import Seo from '@/components/seo/seo';
import PageBanner from '@/components/banners/page-banner';
import { getLayoutWithFooter } from '@/components/layouts/layout-with-footer';

function makeTitleToDOMId(title: string) {
  return title.toLowerCase().split(' ').join('_');
}

export default function PrivacyPage() {
  const { t } = useTranslation('policy');
  const { title, date, content } = privacyPolicy;

  return (
    <>
      <Seo title="Privacy" url="privacy" />
      {/* Same full-bleed banner as /terms — the two policy pages are siblings and read as one
          family, but this one had a bare header while terms carried the kraft banner + trail. */}
      <PageBanner title={t(title)} breadcrumbTitle="Home" />
      <section className="mx-auto w-full max-w-7xl g-light-a px-5 py-8 lg:py-10 lg:px-8 xl:py-14 xl:px-16 2xl:px-20">
        <header className="mb-10">
          <p className="px-0.5 text-sm text-body-dark md:text-base 2xl:text-lg">
            {date}
          </p>
        </header>
        {/* End of page header */}

        <div className="flex flex-col md:flex-row">
          <nav className="mb-8 md:mb-0 md:w-72 xl:w-3/12">
            <ol className="sticky z-10 md:top-16 lg:top-22">
              {content?.map((item: any) => (
                <li key={item.title}>
                  <Link
                    spy={true}
                    offset={-120}
                    smooth={true}
                    duration={500}
                    to={makeTitleToDOMId(item.title)}
                    activeClass="text-sm lg:text-base text-forest-900 font-semibold"
                    className="inline-flex cursor-pointer py-3 uppercase text-stone-600"
                  >
                    {t(item.title)}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
          {/* End of section scroll spy menu */}

          <div className="md:w-9/12 md:pb-10 ltr:md:pl-8 rtl:md:pr-8">
            {content?.map((item: any) => (
              <Element
                key={item.title}
                name={makeTitleToDOMId(item.title)}
                className="mb-10"
              >
                <h2 className="mb-4 font-cormorant text-xl font-medium text-forest-900 md:text-2xl lg:text-3xl">
                  {t(item.title)}
                </h2>
                <div
                  className="leading-loose text-body-dark"
                  dangerouslySetInnerHTML={{ __html: t(item.description) }}
                />
              </Element>
            ))}
          </div>
          {/* End of content */}
        </div>
      </section>
    </>
  );
}

PrivacyPage.getLayout = getLayoutWithFooter;

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common', 'policy'])),
    },
  };
};


/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <PrivacyPage {...props} />;
  const withLayout = (PrivacyPage as any).getLayout ? (PrivacyPage as any).getLayout(page) : page;
  return withLayout;
}
