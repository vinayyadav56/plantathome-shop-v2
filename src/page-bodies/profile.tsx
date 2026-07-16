'use client';

import PrivateRoute from '@/lib/private-route';
import ProfileAddressGrid from '@/components/profile/profile-address';
import Card from '@/components/ui/cards/card';
import { useTranslation } from 'next-i18next';
import ProfileForm from '@/components/profile/profile-form';
import ProfileContact from '@/components/profile/profile-contact';
import ProfileContactDetails from '@/components/profile/profile-contact-details';
import Seo from '@/components/seo/seo';
import { useUser } from '@/framework/user';
import DashboardLayout from '@/layouts/_dashboard';
import ProfileUpdateEmail from "@/components/profile/profile-update-email";

const ProfilePage = () => {
  const { t } = useTranslation('common');
  const { me } : any = useUser();
  if (!me) return null;
  return (
    <>
      <Seo noindex={true} nofollow={true} />
      {/* uniform card stack — each section renders its own Card; force a single
          consistent gap (override the components' own bottom margins). */}
      <div className="flex w-full flex-col gap-6 [&_>*]:!mb-0">
        <ProfileForm user={me} />
        <ProfileUpdateEmail user={me} />
        <ProfileContact
          userId={me.id}
          profileId={me.profile?.id!}
          contact={me.profile?.contact!}
        />
        <ProfileContactDetails />
        <Card className="w-full">
          <ProfileAddressGrid
            userId={me.id}
            //@ts-ignore
            addresses={me.address}
            label={t('text-addresses')}
          />
        </Card>
      </div>
    </>
  );
};

ProfilePage.authenticationRequired = true;

ProfilePage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
export default ProfilePage;


/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <ProfilePage {...props} />;
  const withLayout = (ProfilePage as any).getLayout ? (ProfilePage as any).getLayout(page) : page;
  return <PrivateRoute>{withLayout}</PrivateRoute>;
}
