import { BadgeCheck } from '@/components/ui/icon';

export const VerifyIcon: React.FC<React.SVGAttributes<{}>> = (props) => (
  <BadgeCheck aria-hidden {...(props as any)} />
);
