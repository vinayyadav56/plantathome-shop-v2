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
          className="flex cursor-pointer items-center gap-1 border-0 bg-transparent text-[13px] font-semibold text-[#5B5F58]"
          onClick={onAdd}
        >
          <PlusIcon className="h-4 w-4 stroke-2" />
          {t('text-add')}
        </button>
      )}
    </div>
  );
};
