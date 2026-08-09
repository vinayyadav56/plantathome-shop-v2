import { Smartphone } from '@/components/ui/icon';

export const MobileIcon: React.FC<React.SVGAttributes<{}>> = (props) => (
  <Smartphone aria-hidden {...(props as any)} />
);

export const MobileIconNew: React.FC<React.SVGAttributes<{}>> = (props) => {
  return <Smartphone aria-hidden {...(props as any)} />;
};
