'use client';

import PrivateRoute from '@/lib/private-route';
import Card from '@/components/ui/cards/card';
import { useTranslation } from 'next-i18next';
import Seo from '@/components/seo/seo';
import ChangePasswordForm from '@/components/auth/change-password-form';
import DashboardLayout from '@/layouts/_dashboard';

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
ChangePasswordPage.authenticationRequired = true;

ChangePasswordPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default ChangePasswordPage;


/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <ChangePasswordPage {...props} />;
  const withLayout = (ChangePasswordPage as any).getLayout ? (ChangePasswordPage as any).getLayout(page) : page;
  return <PrivateRoute>{withLayout}</PrivateRoute>;
}
