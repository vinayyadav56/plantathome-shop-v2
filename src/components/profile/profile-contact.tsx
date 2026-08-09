import { PlusIcon } from '@/components/icons/plus-icon';
import Card from '@/components/ui/cards/card';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { useTranslation } from 'next-i18next';
import PhoneInput from '@/components/ui/forms/phone-input';
import { WhatsAppIcon } from '@/components/icons/whatsapp';
import { Check } from '@/components/ui/icon';

interface Props {
  userId: string;
  profileId: string;
  contact: string;
}

const ProfileContact = ({ userId, profileId, contact }: Props) => {
  const { openModal } = useModalAction();
  const { t } = useTranslation('common');

  function onAdd() {
    openModal('ADD_OR_UPDATE_PROFILE_CONTACT', {
      customerId: userId,
      profileId,
      contact,
    });
  }
  return (
    <Card className="flex w-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-2 text-lg capitalize text-heading lg:text-xl">
          {t('text-contact-number')}
          <span className="inline-flex items-center gap-1 rounded-full bg-[#25D366]/10 px-2 py-0.5 text-xs font-medium normal-case text-[#1da851]">
            <WhatsAppIcon className="h-3.5 w-3.5" />
            {t('text-whatsapp-number')}
          </span>
        </p>

        {onAdd && (
          <button
            className="flex items-center text-sm font-semibold text-accent transition-colors duration-200 hover:text-accent-hover focus:text-accent-hover focus:outline-0"
            onClick={onAdd}
          >
            <PlusIcon className="h-4 w-4 stroke-2 ltr:mr-0.5 rtl:ml-0.5" />
            {Boolean(contact) ? t('text-update') : t('text-add')}
          </button>
        )}
      </div>

      <p className="mb-5 text-sm text-body md:mb-6">
        {t('whatsapp-contact-helper')}
      </p>

      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <PhoneInput
            country="in"
            value={contact}
            disabled={true}
            inputClass="!p-0 ltr:!pr-4 rtl:!pl-4 ltr:!pl-14 rtl:!pr-14 !flex !items-center !w-full !appearance-none !transition !duration-300 !ease-in-out !text-heading !text-sm focus:!outline-none focus:!ring-0 !border !border-border-base !rounded focus:!border-accent !h-12"
            dropdownClass="focus:!ring-0 !border !border-border-base !shadow-350"
          />
        </div>
        {Boolean(contact) && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-forest-600/10 px-2.5 py-1 text-xs font-semibold text-forest-700">
            <Check size={12} aria-hidden />
            {t('text-verified')}
          </span>
        )}
      </div>
    </Card>
  );
};

export default ProfileContact;
