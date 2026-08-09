import { Heart } from '@/components/ui/icon';

export const HeartOutlineIcon: React.FC<React.SVGAttributes<{}>> = (props) => (
  <Heart aria-hidden {...(props as any)} />
);
