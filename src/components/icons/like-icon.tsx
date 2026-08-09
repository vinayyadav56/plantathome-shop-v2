import { ThumbsUp } from '@/components/ui/icon';

export const LikeIcon: React.FC<React.SVGAttributes<{}>> = (props) => {
  return <ThumbsUp aria-hidden {...(props as any)} />;
};
