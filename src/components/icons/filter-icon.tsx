import { SlidersHorizontal } from '@/components/ui/icon';

export const FilterIcon: React.FC<React.SVGAttributes<{}>> = (props) => (
  <SlidersHorizontal aria-hidden {...(props as any)} />
);
