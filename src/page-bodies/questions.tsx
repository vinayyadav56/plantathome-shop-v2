'use client';

import Card from '@/components/ui/cards/card';
import Seo from '@/components/seo/seo';
import MyQuestions from '@/components/questions/my-questions';

const MyQuestionsPage = () => {
  return (
    <>
      <Seo noindex={true} nofollow={true} />
      <Card className="w-full">
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
