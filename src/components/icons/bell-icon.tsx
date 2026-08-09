import { Bell } from '@/components/ui/icon';

export const BellIcon: React.FC<React.SVGAttributes<{}>> = (props) => {
  return <Bell aria-hidden {...(props as any)} />;
};
