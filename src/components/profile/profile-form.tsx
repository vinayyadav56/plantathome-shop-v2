import { useState } from 'react';
import Button from '@/components/ui/button';
import Card from '@/components/ui/cards/card';
import FileInput from '@/components/ui/forms/file-input';
import UserAvatar from '@/components/ui/user-avatar';
import Input from '@/components/ui/forms/input';
import TextArea from '@/components/ui/forms/text-area';
import { useTranslation } from 'next-i18next';
import { useWatch } from 'react-hook-form';
import { Form } from '@/components/ui/forms/form';
import { useUpdateUser } from '@/framework/user';
import type { UpdateUserInput, User } from '@/types';
import * as yup from 'yup';
import { Pencil } from '@/components/ui/icon';

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

/** The form's values for a user — used for the initial values AND for Cancel.
 *  Every field gets a value: RHF's reset() leaves a field it isn't given
 *  untouched in the DOM, so an empty bio would otherwise survive Cancel. */
function toValues(user: User) {
  return {
    ...splitName(user),
    profile: { bio: user?.profile?.bio ?? '', avatar: user?.profile?.avatar },
  };
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
  // View mode until Edit (owner brief): the card reads as information, and a
  // stray tap can't change anything. Save/Cancel exist only while editing.
  const [editing, setEditing] = useState(false);

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
    } as any, { onSuccess: () => setEditing(false) });
  }

  return (
    <Form<ProfileFormValues>
      className="h-full"
      onSubmit={onSubmit}
      validationSchema={profileFormSchema}
      useFormProps={{
        ...(user && { defaultValues: toValues(user) }),
      }}
    >
      {({ register, control, reset, formState: { errors } }) => (
        <Card className="h-full w-full">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-[18px] font-semibold leading-snug text-forest-900">
                {t('profile-info-title')}
              </h2>
              <p className="mt-1 text-[13.5px] text-stone-500">{t('profile-info-subtitle')}</p>
            </div>
            {!editing && (
              <Button
                type="button"
                variant="formSecondary"
                size="small"
                className="gap-1.5"
                onClick={() => setEditing(true)}
              >
                <Pencil size={16} aria-hidden />
                {t('text-edit')}
              </Button>
            )}
          </div>

          {/* min-w-0: a fieldset's UA min-inline-size would otherwise let wide
              content push the card past the viewport. While not editing the
              fields read as information: a soft brand tint instead of the
              generic disabled grey, and no resize grip on the bio. */}
          <fieldset
            disabled={!editing}
            className="min-w-0 [&_input:disabled]:bg-sage-50 [&_textarea:disabled]:resize-none [&_textarea:disabled]:bg-sage-50"
          >
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-2.5 text-[13px] font-semibold text-forest-900">
                  {t('profile-picture')}
                </p>
                {/* The uploader exists only while editing — it mounts fresh from
                    the field each time, so Cancel/Save need no re-seeding, and
                    nothing can be dropped onto it in view mode. */}
                {editing ? (
                  <div className="pah-avatar-uploader">
                    <FileInput control={control} name="profile.avatar" />
                  </div>
                ) : (
                  <UserAvatar user={user} className="h-16 w-16 text-[20px]" />
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <div className="relative">
                <TextArea
                  label={t('bio-optional')}
                  //@ts-ignore
                  {...register('profile.bio')}
                  maxLength={BIO_MAX}
                  variant="outline"
                  error={t((errors as any)?.profile?.bio?.message!)}
                />
                <BioCounter control={control} />
              </div>
            </div>
          </fieldset>

          {editing && (
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="formSecondary"
                size="small"
                disabled={isLoading}
                onClick={() => {
                  reset(toValues(user));
                  setEditing(false);
                }}
              >
                {t('account-cancel')}
              </Button>
              <Button variant="formPrimary" size="small" loading={isLoading} disabled={isLoading}>
                {t('account-save-changes')}
              </Button>
            </div>
          )}
        </Card>
      )}
    </Form>
  );
};

export default ProfileForm;
