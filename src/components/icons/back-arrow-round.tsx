import { ArrowLeft } from '@/components/ui/icon';

export const BackArrowRound: React.FC<React.SVGAttributes<{}>> = (props) => (
  <ArrowLeft aria-hidden {...(props as any)} />
);
