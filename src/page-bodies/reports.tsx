'use client';

import Card from '@/components/ui/cards/card';
import Seo from '@/components/seo/seo';
import MyReports from '@/components/reports/report-view';

const MyReportsPage = () => {
  return (
    <>
      <Seo noindex={true} nofollow={true} />
      <Card className="w-full self-stretch shadow-none sm:shadow">
        <MyReports />
      </Card>
    </>
  );
};



export default MyReportsPage;


/* ── App Router body wrapper — chrome + auth live in app/(account)/layout.tsx ── */

export function PageBody(props: any) {
  return <MyReportsPage {...props} />;
}
