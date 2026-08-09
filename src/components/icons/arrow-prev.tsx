import { ChevronLeft } from '@/components/ui/icon';

export const ArrowPrevIcon: React.FC<React.SVGAttributes<{}>> = (props) => (
  <ChevronLeft aria-hidden {...(props as any)} />
);
