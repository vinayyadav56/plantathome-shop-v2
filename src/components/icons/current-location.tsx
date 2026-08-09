import { Crosshair } from '@/components/ui/icon';

function CurrentLocation({ ...props }) {
  return <Crosshair aria-hidden width={16} height={16} {...(props as any)} />;
}

export default CurrentLocation;
