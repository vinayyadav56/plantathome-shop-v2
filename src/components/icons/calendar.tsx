import { CalendarDays } from '@/components/ui/icon';

export const CalendarGhostIcon: React.FC<React.SVGAttributes<{}>> = (props) => {
  return <CalendarDays aria-hidden {...(props as any)} />;
};
