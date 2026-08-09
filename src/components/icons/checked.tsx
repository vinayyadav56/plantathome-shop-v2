import { CircleCheck } from '@/components/ui/icon';

export const CheckedIcon: React.FC<React.SVGAttributes<{}>> = (props) => {
  return <CircleCheck aria-hidden fill="currentColor" {...(props as any)} />;
};

export const CheckedIconWithCircle: React.FC<React.SVGAttributes<{}>> = (
  props,
) => {
  return <CircleCheck aria-hidden {...(props as any)} />;
};
