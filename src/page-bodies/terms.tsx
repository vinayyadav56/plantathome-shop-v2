'use client';

import LegalPage from '@/page-bodies/legal-page';
import { getLayoutWithFooter } from '@/components/layouts/layout-with-footer';

// Terms content now comes from settings.legalPages.terms (admin-editable) with
// a built-in default — the old terms-and-conditions API feed rendered an empty
// NotFound state on any environment without seeded rows.
export default function TermsPage() {
  return <LegalPage doc="terms" />;
}

TermsPage.getLayout = getLayoutWithFooter;

/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <TermsPage {...props} />;
  const withLayout = (TermsPage as any).getLayout ? (TermsPage as any).getLayout(page) : page;
  return withLayout;
}
