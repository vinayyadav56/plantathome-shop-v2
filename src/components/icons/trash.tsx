import { FC } from 'react';
import { Trash2 } from '@/components/ui/icon';

type TrashProps = {
  width?: number;
  height?: number;
  className?: string;
};

const Trash: FC<TrashProps> = (props) => {
  return <Trash2 aria-hidden {...(props as any)} />;
};

export default Trash;

export const TrashTwo: FC<TrashProps> = (props) => {
  return <Trash2 aria-hidden {...(props as any)} />;
};
