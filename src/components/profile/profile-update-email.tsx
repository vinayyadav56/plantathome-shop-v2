import Button from '@/components/ui/button';
import Card from '@/components/ui/cards/card';
import Input from '@/components/ui/forms/input';
import { useTranslation } from 'next-i18next';
import pick from 'lodash/pick';
import { Form } from '@/components/ui/forms/form';
import { useUpdateEmail } from '@/framework/user';
import type { UpdateEmailUserInput, User } from '@/types';

const ProfileUpdateEmail = ({ user }: { user: User }) => {
  const { t } = useTranslation('common');
  const { mutate: updateEmail, isLoading } = useUpdateEmail();

  function onSubmit(values: UpdateEmailUserInput) {
    if (!user) {
      return;
    }
    updateEmail({
      email: values?.email,
    });
  }

  return (
    <Form<UpdateEmailUserInput>
      onSubmit={onSubmit}
      useFormProps={{
        ...(user && {
          defaultValues: pick(user, ['email']),
        }),
      }}
    >
      {({ register }) => (
        <Card className="w-full">
          <div className="mb-6 flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sage-100 text-forest-700">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3.5 7 8.5 6 8.5-6" /></svg>
            </span>
            <div>
              <h3 className="text-[16px] font-bold text-forest-900">{t('text-email')}</h3>
              <p className="text-[13px] text-stone-500">{t('update-email-subtitle')}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Input
              className="flex-1"
              {...register('email')}
              variant="outline"
              disabled={!!isLoading}
            />
            <Button
              variant="outline"
              className="!border-forest-700 !text-forest-700 hover:!bg-forest-700 hover:!text-white hover:!border-forest-700"
              loading={isLoading}
              disabled={isLoading}
            >
              {t('update-email-cta')}
            </Button>
          </div>
        </Card>
      )}
    </Form>
  );
};

export default ProfileUpdateEmail;
