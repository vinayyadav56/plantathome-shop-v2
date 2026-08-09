import { CircleCheck } from '@/components/ui/icon';

const CheckIconWithBg: React.FC<React.SVGAttributes<{}>> = ({
  width = 20,
  height = 20,
  ...props
}) => {
  return (
    <CircleCheck
      aria-hidden
      fill="currentColor"
      width={width}
      height={height}
      {...(props as any)}
    />
  );
};

export default CheckIconWithBg;
