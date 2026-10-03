import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import Button from '@/components/ui/button';
import Card from '@/components/ui/cards/card';
import Input from '@/components/ui/forms/input';
import { useSendEmailOtp, useVerifyEmailOtp, type ContactEmail } from '@/framework/contact';
import { useUpdateEmail } from '@/framework/user';
import { Check, Mail, Plus, TriangleAlert } from '@/components/ui/icon';
import type { User } from '@/types';

/** Small pill: verified (forest) vs unverified (amber) — the REAL flag from the API. */
function StatusBadge({ verified }: { verified: boolean }) {
  const { t } = useTranslation('common');
  if (verified) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-forest-600/10 px-2.5 py-1 text-xs font-semibold text-forest-700">
        <Check size={12} aria-hidden />
        {t('text-verified')}
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <TriangleAlert size={12} aria-hidden />
      {t('text-unverified')}
    </span>
  );
}

/**
 * Email Address (owner brief 2026-10-03). The primary email is shown, not
 * edited: the API refuses to change an email once set ("already set and cannot
 * be changed"), so the old always-visible "Update Email" box could only ever
 * fail. What CAN happen here: verify an unverified address by emailed code, add
 * an email if the account has none (phone sign-ups), and add a verified backup
 * email. Read from /me — no extra request, no loading flash.
 */
const ProfileEmail = ({ user }: { user: User }) => {
  const { t } = useTranslation('common');
  const { mutate: sendOtp, isLoading: sending } = useSendEmailOtp();
  const { mutate: verifyOtp, isLoading: verifying } = useVerifyEmailOtp();
  const { mutate: addEmail, isLoading: adding } = useUpdateEmail();

  const emails = [
    user?.email && { email: user.email, primary: true, verified: Boolean(user.email_verified) },
    user?.profile?.email_2 && {
      email: user.profile.email_2,
      primary: false,
      verified: Boolean(user.profile.email_2_verified_at),
    },
  ].filter(Boolean) as ContactEmail[];
  const primaryEmail = emails.find((e) => e.primary);
  const secondaryEmail = emails.find((e) => !e.primary);

  // `otpEmail` is the address a code was just sent to; while set we show a code box.
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [addingSecondary, setAddingSecondary] = useState(false);

  function startVerify(email: string) {
    const value = email.trim();
    if (!value) return;
    sendOtp(
      { email: value },
      {
        onSuccess: () => {
          setOtpEmail(value);
          setCode('');
        },
      },
    );
  }

  function submitCode() {
    if (!otpEmail || !code.trim()) return;
    verifyOtp(
      { email: otpEmail, code: code.trim() },
      {
        onSuccess: () => {
          setOtpEmail(null);
          setCode('');
          setNewEmail('');
          setAddingSecondary(false);
        },
      },
    );
  }

  // NB: render helpers invoked as `{renderX(...)}`, NOT `<X/>` components —
  // rendering them as JSX elements would remount the subtree on every parent
  // re-render (each keystroke) and drop focus from the code input.

  /** Code-entry row shown once a code has been sent to `email`. */
  function renderOtpBox(email: string) {
    if (otpEmail !== email) return null;
    return (
      <div className="mt-3 rounded-control border border-kraft-200 bg-sage-50 p-3">
        <p className="mb-2 text-[13px] text-stone-600">{t('contact-otp-sent-helper', { email })}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            name="email-otp-code"
            aria-label={t('text-verification-code')}
            className="flex-1"
            variant="outline"
            inputClassName="!h-11"
            inputMode="numeric"
            maxLength={6}
            placeholder="______"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="formPrimary"
              size="small"
              onClick={submitCode}
              loading={verifying}
              disabled={verifying || code.trim().length < 4}
            >
              {t('text-verify')}
            </Button>
            <Button
              type="button"
              variant="formSecondary"
              size="small"
              onClick={() => startVerify(email)}
              disabled={sending}
            >
              {t('text-resend')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /** One email row: address + real status + the verify affordance. */
  function renderEmailRow(item: ContactEmail) {
    return (
      <div className="rounded-control border border-kraft-200 bg-white px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium text-forest-900" title={item.email}>
              {item.email}
            </p>
            <p className="text-[12.5px] text-stone-500">
              {item.primary ? t('text-primary-email') : t('text-secondary-email')}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge verified={item.verified} />
            {!item.verified && otpEmail !== item.email && (
              <Button
                type="button"
                variant="formSecondary"
                size="small"
                onClick={() => startVerify(item.email)}
                disabled={sending}
              >
                {t('text-verify')}
              </Button>
            )}
          </div>
        </div>
        {renderOtpBox(item.email)}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sage-100 text-forest-700">
          <Mail size={18} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-[18px] font-semibold leading-snug text-forest-900">
            {t('text-email-address')}
          </h2>
          <p className="mt-0.5 text-[13.5px] text-stone-500">{t('email-card-subtitle')}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {primaryEmail ? (
          renderEmailRow(primaryEmail)
        ) : (
          // Phone sign-ups have no email yet — the one case the API lets us set it.
          <form
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (newEmail.trim()) addEmail({ email: newEmail.trim() });
            }}
          >
            <Input
              name="email"
              type="email"
              required
              label={t('text-add-email')}
              className="flex-1"
              variant="outline"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <Button variant="formPrimary" size="small" loading={adding} disabled={adding || !newEmail.trim()}>
              {t('text-add-email')}
            </Button>
          </form>
        )}

        {primaryEmail &&
          (secondaryEmail ? (
            renderEmailRow(secondaryEmail)
          ) : addingSecondary ? (
            <div className="rounded-control border border-dashed border-kraft-300 p-3">
              <p className="mb-2 text-[13px] text-stone-600">{t('add-secondary-email-helper')}</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  name="secondary-email"
                  aria-label={t('text-secondary-email')}
                  className="flex-1"
                  variant="outline"
                  inputClassName="!h-11"
                  type="email"
                  placeholder={t('text-secondary-email')}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={otpEmail === newEmail.trim() && !!otpEmail}
                />
                {otpEmail !== newEmail.trim() || !otpEmail ? (
                  <Button
                    type="button"
                    variant="formSecondary"
                    size="small"
                    onClick={() => startVerify(newEmail)}
                    loading={sending}
                    disabled={sending || !newEmail.trim()}
                  >
                    {t('text-send-code')}
                  </Button>
                ) : null}
              </div>
              {newEmail.trim() && renderOtpBox(newEmail.trim())}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingSecondary(true)}
              className="inline-flex w-fit items-center gap-1.5 rounded-control px-1 py-1 text-[13.5px] font-semibold text-forest-700 transition-colors duration-200 hover:text-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-btn"
            >
              <Plus size={16} aria-hidden />
              {t('email-add-secondary')}
            </button>
          ))}
      </div>
    </Card>
  );
};

export default ProfileEmail;
