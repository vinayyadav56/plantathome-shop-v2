import classNames from "classnames";

interface ScheduleProps {
  schedule: any;
  checked: boolean;
}
const ScheduleCard: React.FC<ScheduleProps> = ({ checked, schedule }) => (
  <div className={classNames('pa-schedule-card', { 'pa-schedule-card--checked': checked })}>
    {checked && (
      <span className="pa-schedule-check">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </span>
    )}
    <span className="pa-schedule-title">{schedule.title}</span>
    <span className="pa-schedule-desc">{schedule.description}</span>
  </div>
);

export default ScheduleCard;
