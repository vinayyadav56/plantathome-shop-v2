import { X } from '@/components/ui/icon';

export const CloseIcon: React.FC<React.SVGAttributes<{}>> = (props) => (
  <X aria-hidden {...(props as any)} />
);

export const CloseIconNew: React.FC<React.SVGAttributes<{}>> = (props) => {
  return <X aria-hidden {...(props as any)} />;
};
