import { useTranslation } from 'next-i18next';
import MobileOtpInput from 'react-otp-input';
import Button from '@/components/ui/button';
import Input from '@/components/ui/forms/input';
import Label from '@/components/ui/forms/label';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { Form } from '@/components/ui/forms/form';
import { Controller } from 'react-hook-form';
import * as yup from 'yup';

interface OtpRegisterFormProps {
  onSubmit: (formData: any) => void;
  loading: boolean;
}

type OtpRegisterFormValues = {
  email: string;
  first_name: string;
  last_name?: string;
  code: string;
};

const otpLoginFormSchemaForNewUser = yup.object().shape({
  email: yup
    .string()
    .email('error-email-format')
    .required('error-email-required'),
  first_name: yup.string().required('error-name-required'),
  last_name: yup.string(),
  code: yup.string().required('error-code-required'),
});

export default function OtpRegisterForm({
  onSubmit,
  loading,
}: OtpRegisterFormProps) {
  const { t } = useTranslation('common');
  const { closeModal } = useModalAction();

  return (
    <div className="p-5 space-y-5 border border-gray-200 rounded">
      <Form<OtpRegisterFormValues>
        onSubmit={({ email, first_name, last_name, code }) => {
          const trimmedFirst = first_name.trim();
          const trimmedLast = (last_name ?? '').trim();
          // Joined `name` still sent — old-API belt and braces.
          onSubmit({
            email,
            code,
            name: [trimmedFirst, trimmedLast].filter(Boolean).join(' '),
            first_name: trimmedFirst,
            last_name: trimmedLast || undefined,
          });
        }}
        validationSchema={otpLoginFormSchemaForNewUser}
      >
        {({ register, control, formState: { errors } }) => (
          <>
            <Input
              label={t('text-email')}
              {...register('email')}
              type="email"
              variant="outline"
              className="mb-5"
              error={t(errors.email?.message!)}
            />
            <div className="mb-5 grid grid-cols-2 gap-4">
              <Input
                label="First name"
                {...register('first_name')}
                autoComplete="given-name"
                variant="outline"
                error={t(errors.first_name?.message!)}
              />
              <Input
                label="Last name (optional)"
                {...register('last_name')}
                autoComplete="family-name"
                variant="outline"
                error={t(errors.last_name?.message!)}
              />
            </div>

            <div className="mb-5">
              <Label>{t('text-otp-code')}</Label>
              <Controller
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <MobileOtpInput
                    value={value}
                    onChange={onChange}
                    numInputs={6}
                    renderSeparator={<span className="hidden sm:inline-block">-</span>}
                    containerStyle="flex items-center justify-between -mx-2"
                    inputStyle="flex items-center justify-center !w-full mx-2 sm:!w-9 !px-0 appearance-none transition duration-300 ease-in-out text-heading text-sm focus:outline-0 focus:ring-0 border border-border-base rounded focus:border-accent h-12"
                    // disabledStyle="!bg-gray-100"
                    renderInput={(props) => <input {...props} />}
                  />
                )}
                name="code"
                defaultValue=""
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <Button
                variant="outline"
                className="hover:border-red-500 hover:bg-red-500"
                onClick={closeModal}
              >
                {t('text-cancel')}
              </Button>

              <Button loading={loading} disabled={loading}>
                {t('text-verify-code')}
              </Button>
            </div>
          </>
        )}
      </Form>
    </div>
  );
}
