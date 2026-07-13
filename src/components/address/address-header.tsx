import { PlusIcon } from '@/components/icons/plus-icon';
import { useTranslation } from 'next-i18next';

interface AddressHeaderProps {
  count: number | boolean;
  label: string;
  onAdd: () => void;
}

export const AddressHeader: React.FC<AddressHeaderProps> = ({
  onAdd,
  count,
  label,
}) => {
  const { t } = useTranslation('common');
  return (
    <div className="pa-checkout-step-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {count && <span className="pa-checkout-step-num">{count}</span>}
        <span className="pa-checkout-step-label">{label}</span>
      </div>
      {onAdd && (
        <button
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#5B5F58', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={onAdd}
        >
          <PlusIcon className="h-4 w-4 stroke-2" />
          {t('text-add')}
        </button>
      )}
    </div>
  );
};
