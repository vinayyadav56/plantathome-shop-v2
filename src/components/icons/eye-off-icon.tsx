import { EyeOff as EyeOffGlyph } from '@/components/ui/icon';

export const EyeOff: React.FC<React.SVGAttributes<{}>> = (props) => (
  <EyeOffGlyph aria-hidden {...(props as any)} />
);
