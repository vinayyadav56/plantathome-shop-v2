import { ChevronDown } from '@/components/ui/icon';

export const ArrowDownIcon: React.FC<React.SVGAttributes<{}>> = (props) => (
  <ChevronDown aria-hidden {...(props as any)} />
);
