import classNames from "classnames";
import { Check } from '@/components/ui/icon';

interface ScheduleProps {
  schedule: any;
  checked: boolean;
}
const ScheduleCard: React.FC<ScheduleProps> = ({ checked, schedule }) => (
  <div className={classNames('pa-schedule-card', { 'pa-schedule-card--checked': checked })}>
    {checked && (
      <span className="pa-schedule-check">
        <Check size={12} aria-hidden />
      </span>
    )}
    <span className="pa-schedule-title">{schedule.title}</span>
    <span className="pa-schedule-desc">{schedule.description}</span>
  </div>
);

export default ScheduleCard;
