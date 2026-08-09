import { Heart } from '@/components/ui/icon';

export const HeartFillIcon: React.FC<React.SVGAttributes<{}>> = (props) => (
  <Heart aria-hidden fill="currentColor" {...(props as any)} />
);
