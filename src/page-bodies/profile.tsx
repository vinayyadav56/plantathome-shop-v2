'use client';

import ProfileAddressGrid from '@/components/profile/profile-address';
import Card from '@/components/ui/cards/card';
import { useTranslation } from 'next-i18next';
import ProfileForm from '@/components/profile/profile-form';
import ProfileContact from '@/components/profile/profile-contact';
import ProfileContactDetails from '@/components/profile/profile-contact-details';
import Seo from '@/components/seo/seo';
import { useUser } from '@/framework/user';
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

export default ProfilePage;


/* ── App Router body wrapper — chrome + auth live in app/(account)/layout.tsx ── */

export function PageBody(props: any) {
  return <ProfilePage {...props} />;
}
