import { Heart } from '@/components/ui/icon';

export const HeartGhostIcon: React.FC<React.SVGAttributes<{}>> = (props) => {
  return <Heart aria-hidden {...(props as any)} />;
};
