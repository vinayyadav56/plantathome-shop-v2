import { ArrowRight } from '@/components/ui/icon';

export const LongArrowIcon: React.FC<React.SVGAttributes<{}>> = (props) => {
  return <ArrowRight aria-hidden {...(props as any)} />;
};
