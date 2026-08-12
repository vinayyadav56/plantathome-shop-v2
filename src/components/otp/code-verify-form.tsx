import MobileOtpInput from 'react-otp-input';
import Button from '@/components/ui/button';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { Form } from '@/components/ui/forms/form';
import { Controller } from 'react-hook-form';
import * as yup from 'yup';
import { useTranslation } from 'next-i18next';
import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { initialOtpState, optAtom } from '@/components/otp/atom';

type OptCodeFormProps = {
  code: string;
};

interface OtpLoginFormForAllUserProps {
  onSubmit: (formData: any) => void;
  isLoading: boolean;
  /** Re-send the code on the SAME channel (wired by the parent). */
  onResend?: () => void;
  isResending?: boolean;
}

const otpLoginFormSchemaForExistingUser = yup.object().shape({
  code: yup
    .string()
    .required('error-code-required')
    .matches(/^[0-9]{6}$/, 'Enter the 6-digit code'),
});

/** "+919876543210" → "+91 98765 •••10" — enough to recognise, not enough to leak. */
function maskPhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 6) return phone || '';
  const last2 = digits.slice(-2);
  const cc = digits.length > 10 ? digits.slice(0, digits.length - 10) : '';
  const local = digits.slice(-10);
  return `${cc ? `+${cc} ` : ''}${local.slice(0, 5)} •••${last2}`;
}

export default function OtpCodeForm({
  onSubmit,
  isLoading,
  onResend,
  isResending,
}: OtpLoginFormForAllUserProps) {
  const { t } = useTranslation('common');
  const { closeModal } = useModalAction();
  const [otpState, setOtpState] = useAtom(optAtom);
  const [secondsLeft, setSecondsLeft] = useState(otpState.resendAfter);

  // Resend countdown — seeded from the SERVER's cooldown, never a magic number.
  useEffect(() => {
    setSecondsLeft(otpState.resendAfter);
  }, [otpState.resendAfter, otpState.otpId]);
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [secondsLeft]);

  const channelLabel = otpState.channel === 'whatsapp' ? 'WhatsApp' : 'SMS';

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-sm text-body">
          We sent a 6-digit code on {channelLabel} to
        </p>
        <p className="mt-1 font-semibold text-heading" dir="ltr">
          {maskPhone(otpState.phoneNumber)}
        </p>
      </div>

      <Form<OptCodeFormProps>
        onSubmit={onSubmit}
        validationSchema={otpLoginFormSchemaForExistingUser}
      >
        {({ control, formState: { errors }, handleSubmit }) => (
          <>
            <div className="mb-5">
              <Controller
                control={control}
                render={({ field: { onChange, value } }) => (
                  <OtpDigits
                    value={value}
                    onChange={onChange}
                    // Auto-submit the moment the 6th digit lands (typed OR
                    // pasted) — the extra tap is pure friction on mobile.
                    onComplete={() => handleSubmit(onSubmit)()}
                    invalid={Boolean(errors.code?.message)}
                    disabled={isLoading}
                  />
                )}
                name="code"
                defaultValue=""
              />
              {errors.code?.message && (
                <p className="mt-3 text-center text-xs text-red-500" role="alert">
                  {t(errors.code.message)}
                </p>
              )}
            </div>

            <Button
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              {t('text-verify-code')}
            </Button>

            <div className="flex items-center justify-between pt-1 text-sm">
              <button
                type="button"
                className="font-semibold text-accent transition-colors hover:text-accent-hover disabled:cursor-not-allowed disabled:text-body/50"
                disabled={secondsLeft > 0 || isResending || !onResend}
                onClick={() => {
                  onResend?.();
                  setSecondsLeft(otpState.resendAfter);
                }}
              >
                {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Resend code'}
              </button>
              <button
                type="button"
                className="text-body underline transition-colors hover:text-heading hover:no-underline"
                onClick={() => setOtpState({ ...initialOtpState })}
              >
                Change number
              </button>
            </div>

            <button
              type="button"
              onClick={closeModal}
              className="w-full pt-1 text-center text-xs text-body/70 hover:text-body"
            >
              {t('text-cancel')}
            </button>
          </>
        )}
      </Form>
    </div>
  );
}

/**
 * The 6-digit field. Auto-focuses, accepts a pasted code, and fires
 * `onComplete` once — a re-fire on every keystroke after six digits would
 * submit an already-submitted code and burn an attempt.
 */
function OtpDigits({
  value,
  onChange,
  onComplete,
  invalid,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete: () => void;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const firedFor = useRef<string | null>(null);

  useEffect(() => {
    if (value?.length === 6 && firedFor.current !== value) {
      firedFor.current = value;
      onComplete();
    }
    if (value?.length !== 6) {
      firedFor.current = null;
    }
  }, [value, onComplete]);

  return (
    <MobileOtpInput
      value={value}
      onChange={onChange}
      numInputs={6}
      shouldAutoFocus
      containerStyle="flex items-center justify-center gap-2 sm:gap-3"
      inputStyle={`!w-11 sm:!w-12 !h-12 sm:!h-14 !px-0 text-center appearance-none transition duration-200 ease-in-out text-heading text-lg font-semibold focus:outline-0 focus:ring-0 border rounded-lg focus:border-accent ${
        invalid ? 'border-red-400' : 'border-border-base'
      }`}
      renderInput={(props) => (
        <input
          {...props}
          disabled={disabled}
          // Lets iOS/Android surface the code straight from the notification.
          autoComplete="one-time-code"
          inputMode="numeric"
          aria-label="Verification code digit"
        />
      )}
    />
  );
}
