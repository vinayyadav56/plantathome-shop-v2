'use client';

import ProfileAddressGrid from '@/components/profile/profile-address';
import Card from '@/components/ui/cards/card';
import Collapsible from '@/components/ui/collapsible';
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
      {/* Desktop: two columns (annotation 2026-10-03 — "divide this page into
          two columns on desktop"). Mobile: the primary Profile card stays open;
          the secondary sections fold behind Collapsible headers. */}
      <div className="flex w-full flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-6">
          <ProfileForm user={me} />
          <Collapsible title={t('text-contact-number')}>
            <ProfileContact
              userId={me.id}
              profileId={me.profile?.id!}
              contact={me.profile?.contact!}
            />
          </Collapsible>
        </div>
        <div className="flex flex-col gap-6">
          <Collapsible title={t('text-email')}>
            <ProfileUpdateEmail user={me} />
          </Collapsible>
          <Collapsible title={t('text-contact-details')}>
            <ProfileContactDetails />
          </Collapsible>
        </div>
        <Card className="w-full lg:col-span-2">
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
