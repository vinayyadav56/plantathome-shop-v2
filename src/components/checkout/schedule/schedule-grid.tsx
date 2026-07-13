import { RadioGroup } from '@headlessui/react';
import { useAtom } from 'jotai';
import ScheduleCard from './schedule-card';
import { deliveryTimeAtom } from '@/store/checkout';
import { useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { useSettings } from '@/framework/settings';
import { isArray, isEmpty } from 'lodash';

interface ScheduleProps {
  label: string;
  className?: string;
  count?: number;
}

export const ScheduleGrid: React.FC<ScheduleProps> = ({
  label,
  className,
  count,
}) => {
  const { t } = useTranslation('common');
  const {
    settings: { deliveryTime: schedules },
  }: any = useSettings();

  const [selectedSchedule, setSchedule] = useAtom(deliveryTimeAtom);
  useEffect(() => {
    if (!isEmpty(schedules) && isArray(schedules)) {
      setSchedule(schedules[0]);
    }
  }, [schedules]);
  return (
    <div className={className}>
      <div className="pa-checkout-step-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {count && <span className="pa-checkout-step-num">{count}</span>}
          <span className="pa-checkout-step-label">{label}</span>
        </div>
      </div>

      {schedules && schedules?.length ? (
        <RadioGroup value={selectedSchedule} onChange={setSchedule}>
          <RadioGroup.Label className="sr-only">{label}</RadioGroup.Label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {schedules?.map((schedule: any, idx: number) => (
              <RadioGroup.Option value={schedule} key={idx}>
                {({ checked }) => (
                  <ScheduleCard checked={checked} schedule={schedule} />
                )}
              </RadioGroup.Option>
            ))}
          </div>
        </RadioGroup>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <span className="relative rounded border border-border-200 bg-gray-100 px-5 py-6 text-center text-base">
            {t('text-no-delivery-time-found')}
          </span>
        </div>
      )}
    </div>
  );
};
export default ScheduleGrid;
