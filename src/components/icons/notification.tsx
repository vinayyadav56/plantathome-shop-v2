import { Bell } from '@/components/ui/icon';

export const NotificationIcon: React.FC<React.SVGAttributes<{}>> = (props) => {
  return <Bell aria-hidden {...(props as any)} />;
};
