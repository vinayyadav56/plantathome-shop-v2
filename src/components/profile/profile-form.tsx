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
import * as yup from 'yup';

const BIO_MAX = 180;

type ProfileFormValues = UpdateUserInput & {
  first_name: string;
  last_name?: string;
};

const profileFormSchema = yup.object().shape({
  first_name: yup.string().trim().required('error-name-required').max(255),
  last_name: yup.string().max(255),
  profile: yup.object().shape({
    bio: yup.string().max(BIO_MAX),
  }),
});

/** First/last prefill: prefer API-provided first_name/last_name; otherwise
 *  split the legacy `name` on the FIRST space only. */
function splitName(user: User): { first_name: string; last_name: string } {
  const u = user as any;
  if (u?.first_name) {
    return { first_name: u.first_name, last_name: u.last_name ?? '' };
  }
  const name = (user?.name ?? '').trim();
  const i = name.indexOf(' ');
  return i < 0
    ? { first_name: name, last_name: '' }
    : { first_name: name.slice(0, i), last_name: name.slice(i + 1) };
}

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

  function onSubmit(values: ProfileFormValues) {
    if (!user) return false;
    // avatar is an array when a new file is uploaded; an object when unchanged
    const rawAvatar = values?.profile?.avatar;
    const avatar = Array.isArray(rawAvatar) ? rawAvatar[0] : rawAvatar;
    const first = values.first_name.trim();
    const last = (values.last_name ?? '').trim();
    updateProfile({
      id: user.id,
      // Joined name kept in sync alongside the split fields (old-API belt and braces).
      name: [first, last].filter(Boolean).join(' '),
      first_name: first,
      last_name: last,
      profile: {
        id: user?.profile?.id,
        bio: values?.profile?.bio ?? '',
        //@ts-ignore
        avatar,
      },
    } as any);
  }

  return (
    <Form<ProfileFormValues>
      onSubmit={onSubmit}
      validationSchema={profileFormSchema}
      useFormProps={{
        ...(user && {
          defaultValues: {
            ...pick(user, ['profile.bio', 'profile.avatar']),
            ...splitName(user),
          },
        }),
      }}
    >
      {({ register, control, formState: { errors } }) => (
        <Card className="w-full">
          {/* header */}
          <div className="mb-7">
            <h2 className="font-pahserif text-[24px] font-medium text-forest-900">
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
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="First name"
                  {...register('first_name')}
                  autoComplete="given-name"
                  variant="outline"
                  error={t((errors as any).first_name?.message!)}
                />
                <Input
                  label="Last name (optional)"
                  {...register('last_name')}
                  autoComplete="family-name"
                  variant="outline"
                  error={t((errors as any).last_name?.message!)}
                />
              </div>
              <div className="relative mb-2">
                <TextArea
                  label={t('text-bio')}
                  //@ts-ignore
                  {...register('profile.bio')}
                  maxLength={BIO_MAX}
                  variant="outline"
                  error={t((errors as any)?.profile?.bio?.message!)}
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
