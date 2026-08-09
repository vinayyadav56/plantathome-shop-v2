import { Eye as EyeGlyph } from '@/components/ui/icon';

export const Eye: React.FC<React.SVGAttributes<{}>> = (props) => (
  <EyeGlyph aria-hidden {...(props as any)} />
);
