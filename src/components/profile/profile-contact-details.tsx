import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import Button from '@/components/ui/button';
import Card from '@/components/ui/cards/card';
import Input from '@/components/ui/forms/input';
import {
  useContacts,
  useUpdateContacts,
  useSendEmailOtp,
  useVerifyEmailOtp,
  type ContactEmail,
} from '@/framework/contact';

/** Small pill: verified (forest) vs unverified (amber). */
function StatusBadge({ verified }: { verified: boolean }) {
  const { t } = useTranslation('common');
  if (verified) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-forest-600/10 px-2.5 py-1 text-xs font-semibold text-forest-700">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden><path d="m5 12 4 4L19 6" /></svg>
        {t('text-verified')}
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
      {t('text-unverified')}
    </span>
  );
}

const ProfileContactDetails = () => {
  const { t } = useTranslation('common');
  const { data, isLoading } = useContacts();
  const contacts = data?.data;

  const { mutate: saveContacts, isLoading: saving } = useUpdateContacts();
  const { mutate: sendOtp, isLoading: sending } = useSendEmailOtp();
  const { mutate: verifyOtp, isLoading: verifying } = useVerifyEmailOtp();

  // ── phones ──
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');

  useEffect(() => {
    if (!contacts) return;
    const phones = contacts.phones ?? [];
    const primary = phones.find((p) => p.primary) ?? phones[0];
    const secondary = phones.find((p) => p !== primary);
    setPhone1(primary?.number ?? '');
    setPhone2(secondary?.number ?? '');
  }, [contacts]);

  function onSavePhones() {
    saveContacts({
      contact: phone1.trim() || null,
      contact_2: phone2.trim() || null,
    });
  }

  // ── email verification flow ──
  // `otpEmail` is the address a code was just sent to; while set we show a code box.
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const primaryEmail = contacts?.emails?.find((e) => e.primary);
  const secondaryEmail = contacts?.emails?.find((e) => !e.primary);

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
        },
      },
    );
  }

  // NB: these are render helpers invoked as `{renderX(...)}`, NOT `<X/>` components —
  // rendering them as JSX elements would remount the subtree on every parent
  // re-render (each keystroke) and drop focus from the code input.

  /** Shared code-entry row shown once a code has been sent to `email`. */
  function renderOtpBox(email: string) {
    if (otpEmail !== email) return null;
    return (
      <div className="mt-3 rounded-lg border border-border-200 bg-gray-50 p-3">
        <p className="mb-2 text-[13px] text-stone-500">
          {t('contact-otp-sent-helper', { email })}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            name="email-otp-code"
            className="flex-1"
            variant="outline"
            inputMode="numeric"
            maxLength={6}
            placeholder="______"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={submitCode}
              loading={verifying}
              disabled={verifying || code.trim().length < 4}
            >
              {t('text-verify')}
            </Button>
            <Button
              type="button"
              variant="outline"
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

  /** One email row: address + status + the verify affordance. */
  function renderEmailRow(item: ContactEmail) {
    return (
      <div className="rounded-lg border border-border-200 p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-heading">{item.email}</p>
            <p className="text-[12px] text-stone-400">
              {item.primary ? t('text-primary-email') : t('text-secondary-email')}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge verified={item.verified} />
            {!item.verified && otpEmail !== item.email && (
              <Button
                type="button"
                size="small"
                variant="outline"
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
      <div className="mb-6 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sage-100 text-forest-700">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" /></svg>
        </span>
        <div>
          <h3 className="text-[16px] font-bold text-forest-900">{t('text-contact-details')}</h3>
          <p className="text-[13px] text-stone-500">{t('contact-details-subtitle')}</p>
        </div>
      </div>

      {/* ── phones ── */}
      <div className="mb-8">
        <label className="mb-3 block text-[13px] font-semibold text-forest-900">
          {t('text-phone-numbers')}
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            name="contact"
            className="flex-1"
            variant="outline"
            type="tel"
            placeholder={t('text-phone-primary-placeholder')}
            value={phone1}
            onChange={(e) => setPhone1(e.target.value)}
            disabled={isLoading || saving}
          />
          <Input
            name="contact_2"
            className="flex-1"
            variant="outline"
            type="tel"
            placeholder={t('text-phone-secondary-placeholder')}
            value={phone2}
            onChange={(e) => setPhone2(e.target.value)}
            disabled={isLoading || saving}
          />
        </div>
        <div className="mt-4 flex">
          <Button
            type="button"
            className="ltr:ml-auto rtl:mr-auto"
            onClick={onSavePhones}
            loading={saving}
            disabled={saving || isLoading}
          >
            {t('save-changes')}
          </Button>
        </div>
      </div>

      {/* ── emails ── */}
      <div>
        <label className="mb-3 block text-[13px] font-semibold text-forest-900">
          {t('text-email-addresses')}
        </label>
        <div className="flex flex-col gap-3">
          {primaryEmail && renderEmailRow(primaryEmail)}
          {secondaryEmail ? (
            renderEmailRow(secondaryEmail)
          ) : (
            <div className="rounded-lg border border-dashed border-border-200 p-3.5">
              <p className="mb-2 text-[13px] text-stone-500">{t('add-secondary-email-helper')}</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  name="secondary-email"
                  className="flex-1"
                  variant="outline"
                  type="email"
                  placeholder={t('text-secondary-email')}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={otpEmail === newEmail && !!otpEmail}
                />
                {otpEmail !== newEmail || !otpEmail ? (
                  <Button
                    type="button"
                    variant="outline"
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
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProfileContactDetails;
