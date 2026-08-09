import { ArrowLeft } from '@/components/ui/icon';

type ArrowNarrowLeftProps = {
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
};

const ArrowNarrowLeft: React.FC<ArrowNarrowLeftProps> = (props) => {
  return <ArrowLeft aria-hidden {...(props as any)} />;
};

export default ArrowNarrowLeft;
