import { Check } from '@/components/ui/icon';

export const CheckMark = ({ ...props }) => {
  return <Check aria-hidden {...(props as any)} />;
};
