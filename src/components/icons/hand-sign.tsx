import { Hand } from '@/components/ui/icon';

export const HandSign: React.FC<React.SVGAttributes<{}>> = (props) => {
  return <Hand aria-hidden {...(props as any)} />;
};
