import { Plus } from '@/components/ui/icon';

export const PlusIcon: React.FC<React.SVGAttributes<{}>> = (props) => (
  <Plus aria-hidden {...(props as any)} />
);

export const PlusIconNew: React.FC<React.SVGAttributes<{}>> = (props) => {
  return <Plus aria-hidden {...(props as any)} />;
};
