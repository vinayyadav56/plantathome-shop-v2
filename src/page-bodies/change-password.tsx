'use client';

import Card from '@/components/ui/cards/card';
import { useTranslation } from 'next-i18next';
import Seo from '@/components/seo/seo';
import ChangePasswordForm from '@/components/auth/change-password-form';

const ChangePasswordPage = () => {
  const { t } = useTranslation('common');

  return (
    <>
      <Seo noindex={true} nofollow={true} />
      <Card className="w-full">
        <h1 className="mb-5 font-pahserif text-xl font-medium text-forest-900 sm:mb-8 sm:text-xl">
          {t('change-password')}
        </h1>
        <ChangePasswordForm />
      </Card>
    </>
  );
};


export default ChangePasswordPage;


/* ── App Router body wrapper — chrome + auth live in app/(account)/layout.tsx ── */

export function PageBody(props: any) {
  return <ChangePasswordPage {...props} />;
}
