import { MapPin as MapPinGlyph } from '@/components/ui/icon';

export const MapPin = ({ ...props }) => {
  return <MapPinGlyph aria-hidden {...(props as any)} />;
};

export const MapPinNew = ({ ...props }) => {
  return <MapPinGlyph aria-hidden {...(props as any)} />;
};
