import { Globe } from '@/components/ui/icon';

export const LangIcon: React.FC<React.SVGAttributes<{}>> = (props) => {
  return <Globe aria-hidden {...(props as any)} />;
};
