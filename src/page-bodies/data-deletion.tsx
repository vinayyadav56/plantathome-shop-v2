'use client';

import LegalPage from '@/page-bodies/legal-page';
import { getLayoutWithFooter } from '@/components/layouts/layout-with-footer';

export default function DataDeletionPage() {
  return <LegalPage doc="dataDeletion" />;
}

DataDeletionPage.getLayout = getLayoutWithFooter;

/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <DataDeletionPage {...props} />;
  const withLayout = (DataDeletionPage as any).getLayout ? (DataDeletionPage as any).getLayout(page) : page;
  return withLayout;
}
