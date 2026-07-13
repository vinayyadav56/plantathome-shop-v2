import Button from '@/components/ui/button';
import Card from '@/components/ui/cards/card';
import FileInput from '@/components/ui/forms/file-input';
import Input from '@/components/ui/forms/input';
import TextArea from '@/components/ui/forms/text-area';
import { useTranslation } from 'next-i18next';
import pick from 'lodash/pick';
import { useWatch } from 'react-hook-form';
import { Form } from '@/components/ui/forms/form';
import { useUpdateUser } from '@/framework/user';
import type { UpdateUserInput, User } from '@/types';

const BIO_MAX = 180;

/** Live bio character counter — reads the field via the form control. */
function BioCounter({ control }: { control: any }) {
  const bio = useWatch({ control, name: 'profile.bio' }) as string | undefined;
  return (
    <span className="pointer-events-none absolute bottom-2.5 text-[11px] font-medium text-stone-400 ltr:right-3 rtl:left-3 tabular-nums">
      {(bio?.length ?? 0)}/{BIO_MAX}
    </span>
  );
}

const ProfileForm = ({ user }: { user: User }) => {
  const { t } = useTranslation('common');
  const { mutate: updateProfile, isLoading } = useUpdateUser();

  function onSubmit(values: UpdateUserInput) {
    if (!user) return false;
    // avatar is an array when a new file is uploaded; an object when unchanged
    const rawAvatar = values?.profile?.avatar;
    const avatar = Array.isArray(rawAvatar) ? rawAvatar[0] : rawAvatar;
    updateProfile({
      id: user.id,
      name: values.name,
      profile: {
        id: user?.profile?.id,
        bio: values?.profile?.bio ?? '',
        //@ts-ignore
        avatar,
      },
    });
  }

  return (
    <Form<UpdateUserInput>
      onSubmit={onSubmit}
      useFormProps={{
        ...(user && {
          defaultValues: pick(user, ['name', 'profile.bio', 'profile.avatar']),
        }),
      }}
    >
      {({ register, control }) => (
        <Card className="relative w-full overflow-hidden">
          {/* decorative plant illustration, top-right */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="pointer-events-none absolute -top-3 h-28 w-28 text-forest-500/15 ltr:-right-3 rtl:-left-3">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.4 5.08-6" />
          </svg>

          {/* header */}
          <div className="mb-7">
            <h2 className="font-pahserif text-[24px] font-semibold text-forest-900">
              {t('profile-info-title')}
            </h2>
            <p className="mt-1 text-[13.5px] text-stone-500">{t('profile-info-subtitle')}</p>
          </div>

          <div className="flex flex-col gap-7 sm:flex-row sm:gap-9">
            {/* profile picture */}
            <div className="shrink-0">
              <label className="mb-2.5 block text-[13px] font-semibold text-forest-900">
                {t('profile-picture')}
              </label>
              <div className="pah-avatar-uploader">
                <FileInput control={control} name="profile.avatar" />
              </div>
              <p className="mt-2 text-center text-[11px] text-stone-400">{t('photo-hint')}</p>
            </div>

            {/* fields */}
            <div className="min-w-0 flex-1">
              <Input
                label={t('text-name')}
                {...register('name')}
                variant="outline"
                className="mb-6"
              />
              <div className="relative mb-2">
                <TextArea
                  label={t('text-bio')}
                  //@ts-ignore
                  {...register('profile.bio')}
                  maxLength={BIO_MAX}
                  variant="outline"
                />
                <BioCounter control={control} />
              </div>
            </div>
          </div>

          <div className="mt-7 flex">
            <Button
              className="ltr:ml-auto rtl:mr-auto"
              loading={isLoading}
              disabled={isLoading}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 ltr:mr-2 rtl:ml-2" aria-hidden><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>
              {t('save-changes')}
            </Button>
          </div>
        </Card>
      )}
    </Form>
  );
};

export default ProfileForm;
