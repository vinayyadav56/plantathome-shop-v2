import { Minus } from '@/components/ui/icon';

export const MinusIcon: React.FC<React.SVGAttributes<{}>> = (props) => (
  <Minus aria-hidden {...(props as any)} />
);

export const MinusIconNew: React.FC<React.SVGAttributes<{}>> = (props) => {
  return <Minus aria-hidden {...(props as any)} />;
};
