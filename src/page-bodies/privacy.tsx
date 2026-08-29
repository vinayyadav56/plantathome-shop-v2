'use client';

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import LegalPage from '@/page-bodies/legal-page';
import { getLayoutWithFooter } from '@/components/layouts/layout-with-footer';

export default function PrivacyPage() {
  return <LegalPage doc="privacy" />;
}

PrivacyPage.getLayout = getLayoutWithFooter;

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale!, ['common'])),
    },
  };
};

/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <PrivacyPage {...props} />;
  const withLayout = (PrivacyPage as any).getLayout ? (PrivacyPage as any).getLayout(page) : page;
  return withLayout;
}
