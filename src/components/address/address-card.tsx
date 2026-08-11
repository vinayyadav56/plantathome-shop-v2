import { CloseIcon } from '@/components/icons/close-icon';
import { PencilIcon } from '@/components/icons/pencil-icon';
import { formatAddress } from '@/lib/format-address';
import { Check } from '@/components/ui/icon';
import classNames from 'classnames';
import { useTranslation } from 'next-i18next';

interface AddressProps {
  address: any;
  checked: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  userId?: any;
  /** Show a "Default" pill (real `address.default` flag from the API). */
  defaultBadge?: boolean;
  /** Amber "Needs details" chip — address is missing required fields. */
  needsDetails?: boolean;
  /** When provided (and not default), renders a small "Set as default" action. */
  onSetDefault?: () => void;
}
const AddressCard: React.FC<AddressProps> = ({
  checked,
  address,
  userId,
  onEdit,
  onDelete,
  defaultBadge,
  needsDetails,
  onSetDefault,
}) => {
  const { t } = useTranslation();
  return (
    <div className={classNames('pa-address-card', { 'pa-address-card--checked': checked })}>
      {checked && (
        <span className="pa-address-check">
          <Check size={12} aria-hidden />
        </span>
      )}
      <div className="flex items-center gap-2">
        <p className="pa-address-title">{address?.title}</p>
        {defaultBadge && (
          <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[10.5px] font-semibold text-forest-700">
            {t('text-default')}
          </span>
        )}
        {needsDetails && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700">
            Needs details
          </span>
        )}
      </div>
      <p className="pa-address-body">{formatAddress(address?.address)}</p>
      {onSetDefault && !defaultBadge && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSetDefault();
          }}
          className="mt-1.5 text-[11.5px] font-semibold text-forest-700 underline transition-colors hover:text-forest-900 hover:no-underline"
        >
          Set as default
        </button>
      )}
      <div className="pa-address-actions">
        {onEdit && (
          <button className="pa-address-btn pa-address-btn--edit" onClick={onEdit} title={t('text-edit')}>
            <PencilIcon className="h-3 w-3" />
          </button>
        )}
        {onDelete && (
          <button className="pa-address-btn pa-address-btn--delete" onClick={onDelete} title={t('text-delete')}>
            <CloseIcon className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AddressCard;
