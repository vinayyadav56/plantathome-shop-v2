import { CloseIcon } from '@/components/icons/close-icon';
import { PencilIcon } from '@/components/icons/pencil-icon';
import { formatAddress } from '@/lib/format-address';
import classNames from 'classnames';
import { useTranslation } from 'next-i18next';

interface AddressProps {
  address: any;
  checked: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  userId?: any;
  /** Show a "Default" pill (display-only — no is_default flag in the data). */
  defaultBadge?: boolean;
}
const AddressCard: React.FC<AddressProps> = ({
  checked,
  address,
  userId,
  onEdit,
  onDelete,
  defaultBadge,
}) => {
  const { t } = useTranslation();
  return (
    <div className={classNames('pa-address-card', { 'pa-address-card--checked': checked })}>
      {checked && (
        <span className="pa-address-check">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </span>
      )}
      <div className="flex items-center gap-2">
        <p className="pa-address-title">{address?.title}</p>
        {defaultBadge && (
          <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[10.5px] font-semibold text-forest-700">
            {t('text-default')}
          </span>
        )}
      </div>
      <p className="pa-address-body">{formatAddress(address?.address)}</p>
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
