import { ThumbsDown } from '@/components/ui/icon';

export const DislikeIcon: React.FC<React.SVGAttributes<{}>> = (props) => {
  return <ThumbsDown aria-hidden {...(props as any)} />;
};
