import {
  Box,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Flag,
  Headset,
  Leaf,
  Mail,
  MapPin,
  Phone,
  Receipt,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  Truck,
} from '@/components/ui/icon';

/**
 * Order-tracking page icon set, now backed by Lucide
 * (docs/design/icon-system.md). Export names frozen for existing call sites;
 * new code should import from '@/components/ui/icon' directly.
 */
type IconProps = { className?: string };

export const CheckBoldIcon = ({ className }: IconProps) => (
  <Check className={className} strokeWidth={2} aria-hidden />
);
export const ReceiptIcon = ({ className }: IconProps) => (
  <Receipt className={className} strokeWidth={2} aria-hidden />
);
export const BoxIcon = ({ className }: IconProps) => (
  <Box className={className} strokeWidth={2} aria-hidden />
);
export const TruckIcon = ({ className }: IconProps) => (
  <Truck className={className} strokeWidth={2} aria-hidden />
);
export const CourierBagIcon = ({ className }: IconProps) => (
  <ShoppingBag className={className} strokeWidth={2} aria-hidden />
);
export const FlagIcon = ({ className }: IconProps) => (
  <Flag className={className} strokeWidth={2} aria-hidden />
);
export const HeadsetIcon = ({ className }: IconProps) => (
  <Headset className={className} strokeWidth={2} aria-hidden />
);
export const CopyIcon = ({ className }: IconProps) => (
  <Copy className={className} strokeWidth={2} aria-hidden />
);
export const PhoneIcon = ({ className }: IconProps) => (
  <Phone className={className} strokeWidth={2} aria-hidden />
);
export const MailIcon = ({ className }: IconProps) => (
  <Mail className={className} strokeWidth={2} aria-hidden />
);
export const ClockIcon = ({ className }: IconProps) => (
  <Clock className={className} strokeWidth={2} aria-hidden />
);
export const MapPinIcon = ({ className }: IconProps) => (
  <MapPin className={className} strokeWidth={2} aria-hidden />
);
export const RefreshIcon = ({ className }: IconProps) => (
  <RefreshCw className={className} strokeWidth={2} aria-hidden />
);
export const ChevronRightIcon = ({ className }: IconProps) => (
  <ChevronRight className={className} strokeWidth={2} aria-hidden />
);
export const PottedPlantIcon = ({ className }: IconProps) => (
  <Sprout className={className} strokeWidth={2} aria-hidden />
);
export const ShieldCheckIcon = ({ className }: IconProps) => (
  <ShieldCheck className={className} strokeWidth={2} aria-hidden />
);
export const LeafIcon = ({ className }: IconProps) => (
  <Leaf className={className} strokeWidth={2} aria-hidden />
);
