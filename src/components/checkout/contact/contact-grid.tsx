import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { customerContactAtom } from '@/store/checkout';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { PlusIcon } from '@/components/icons/plus-icon';
import { useTranslation } from 'next-i18next';
import classNames from 'classnames';
import PhoneInput from '@/components/ui/forms/phone-input';
import { useContacts } from '@/framework/contact';

interface ContactProps {
  contact: string | undefined | null;
  label: string;
  count?: number;
  className?: string;
  gridClassName?: string;
}

const ContactGrid = ({
  contact,
  label,
  count,
  className,
  gridClassName,
}: ContactProps) => {
  const [contactNumber, setContactNumber] = useAtom(customerContactAtom);
  const { openModal } = useModalAction();
  const { t } = useTranslation('common');

  // Prefer the account's saved primary phone (from the contacts API); fall back to
  // the profile contact passed in. Guests get no contacts data → `contact` wins.
  const { data: contactsData } = useContacts();
  const savedPhone =
    contactsData?.data?.phones?.find((p) => p.primary)?.number ??
    contactsData?.data?.phones?.[0]?.number ??
    contact;

  useEffect(() => {
    // Seed from the saved profile only when the checkout has no contact yet.
    // Never clear a number the user just entered (that caused it to be lost).
    if (savedPhone && !contactNumber) {
      setContactNumber(savedPhone);
    }
  }, [savedPhone, contactNumber, setContactNumber]);

  function onAddOrChange() {
    openModal('ADD_OR_UPDATE_CHECKOUT_CONTACT');
  }

  return (
    <div className={className}>
      <div className="pa-checkout-step-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {count && <span className="pa-checkout-step-num">{count}</span>}
          <span className="pa-checkout-step-label">{label}</span>
        </div>
        <button
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#5B5F58', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={onAddOrChange}
        >
          <PlusIcon className="h-4 w-4 stroke-2" />
          {contactNumber ? t('text-update') : t('text-add')}
        </button>
      </div>

      <div className={classNames('w-full', gridClassName)}>
        <PhoneInput
          country="in"
          value={contactNumber}
          disabled={true}
          inputClass="!p-0 ltr:!pr-4 rtl:!pl-4 ltr:!pl-14 rtl:!pr-14 !flex !items-center !w-full !appearance-none !transition !duration-300 !ease-in-out !text-heading !text-sm focus:!outline-none focus:!ring-0 !border !border-border-base !rounded focus:!border-accent !h-12"
          dropdownClass="focus:!ring-0 !border !border-border-base !shadow-350"
        />
      </div>
    </div>
  );
};

export default ContactGrid;
