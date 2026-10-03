import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import Button from '@/components/ui/button';
import Card from '@/components/ui/cards/card';
import Input from '@/components/ui/forms/input';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { useUpdateContacts } from '@/framework/contact';
import { Phone } from '@/components/ui/icon';
import type { User } from '@/types';

/** "+919996469046" / "9996469046" → "+91 99964 69046"; anything else as stored. */
function formatPhone(raw?: string | null) {
  const digits = (raw ?? '').replace(/\D/g, '');
  const local = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return local.length === 10 ? `+91 ${local.slice(0, 5)} ${local.slice(5)}` : (raw ?? '');
}

/**
 * Contact Details (owner brief 2026-10-03). The PRIMARY phone — the number used
 * for OTP sign-in and order updates — is shown read-only and only changes
 * through the existing OTP-verified modal. It used to be editable a second
 * time, without OTP, in the old "Contact details" card (PUT /me/contacts),
 * which could silently replace a verified number. Only the optional secondary
 * phone is edited here. No "Verified" pill: there is no phone-verified flag, so
 * the old pill only meant "has a number".
 */
const ProfileContact = ({ user }: { user: User }) => {
  const { t } = useTranslation('common');
  const { openModal } = useModalAction();
  const { mutate: saveContacts, isLoading } = useUpdateContacts();
  const profile = user?.profile ?? {};
  const contact = profile.contact ?? '';
  const saved2 = profile.contact_2 ?? '';
  // null = untouched, so the field always shows the latest saved number
  // without an effect to re-sync it after a refetch.
  const [draft, setDraft] = useState<string | null>(null);
  const phone2 = draft ?? saved2;

  function onChangePrimary() {
    openModal('ADD_OR_UPDATE_PROFILE_CONTACT', {
      customerId: user.id,
      profileId: profile.id,
      contact,
    });
  }

  function onSaveSecondary(e: React.FormEvent) {
    e.preventDefault();
    // PUT /me/contacts writes BOTH fields and nulls whatever is missing — send
    // the primary back unchanged or it would be erased.
    saveContacts(
      { contact: contact || null, contact_2: phone2.trim() || null },
      { onSuccess: () => setDraft(null) },
    );
  }

  return (
    <Card className="w-full">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sage-100 text-forest-700">
          <Phone size={18} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-[18px] font-semibold leading-snug text-forest-900">
            {t('text-contact-details')}
          </h2>
          <p className="mt-0.5 text-[13.5px] text-stone-500">{t('contact-card-subtitle')}</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[13px] font-semibold text-forest-900">{t('contact-primary-phone')}</p>
        <div className="mt-2 flex min-h-[48px] items-center justify-between gap-3 rounded-control border border-kraft-200 bg-white px-4 py-2">
          <span className="truncate text-[15px] font-medium tabular-nums text-forest-900">
            {contact ? formatPhone(contact) : <span className="font-normal text-stone-400">—</span>}
          </span>
          <button
            type="button"
            onClick={onChangePrimary}
            className="shrink-0 rounded-control px-2 py-1 text-[13.5px] font-semibold text-forest-700 transition-colors duration-200 hover:bg-sage-50 hover:text-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-btn"
          >
            {contact ? t('text-update') : t('text-add')}
          </button>
        </div>
        <p className="mt-1.5 text-[12.5px] text-stone-500">{t('contact-updates-note')}</p>
      </div>

      <form onSubmit={onSaveSecondary} className="mt-5">
        <Input
          name="contact_2"
          type="tel"
          inputMode="tel"
          label={t('contact-secondary-phone')}
          variant="outline"
          value={phone2}
          onChange={(e) => setDraft(e.target.value)}
          disabled={isLoading}
        />
        {/* Appears once there's something to save — no idle disabled button. */}
        {(phone2.trim() !== saved2 || isLoading) && (
          <div className="mt-3 flex justify-end">
            <Button variant="formPrimary" size="small" loading={isLoading} disabled={isLoading}>
              {t('account-save-changes')}
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
};

export default ProfileContact;
