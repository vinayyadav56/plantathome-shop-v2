'use client';

import Refunds from '@/components/refunds/refund-view';
import Seo from '@/components/seo/seo';

export default function RefundsPage() {
  return (
    <>
      <Seo noindex={true} nofollow={true} />
      <Refunds />
    </>
  );
}





/* ── App Router body wrapper — chrome + auth live in app/(account)/layout.tsx ── */

export function PageBody(props: any) {
  return <RefundsPage {...props} />;
}
