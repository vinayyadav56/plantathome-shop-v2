'use client';

import Card from '@/components/ui/cards/card';
import Seo from '@/components/seo/seo';
import MyQuestions from '@/components/questions/my-questions';

const MyQuestionsPage = () => {
  return (
    <>
      <Seo noindex={true} nofollow={true} />
      <Card className="w-full shadow-none sm:shadow">
        <MyQuestions />
      </Card>
    </>
  );
};



export default MyQuestionsPage;


/* ── App Router body wrapper — chrome + auth live in app/(account)/layout.tsx ── */

export function PageBody(props: any) {
  return <MyQuestionsPage {...props} />;
}
