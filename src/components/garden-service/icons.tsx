import {
  CalendarDays,
  ChevronDown,
  Layers,
  Lock,
  MapPin,
  Phone,
  Ruler,
  ShieldCheck,
  Sparkles,
  Sprout,
  Star,
  UserRound,
  Wrench,
  type LucideIcon,
} from '@/components/ui/icon';

/**
 * Garden Service page icon funnel, now backed by Lucide
 * (docs/design/icon-system.md). Name keys frozen for existing call sites; new
 * code should import from '@/components/ui/icon' directly.
 */
const GLYPHS: Record<string, LucideIcon> = {
  sprout: Sprout,
  soil: Layers,
  tools: Wrench,
  gardener: UserRound,
  calendar: CalendarDays,
  shieldCheck: ShieldCheck,
  phone: Phone,
  chevronDown: ChevronDown,
  ruler: Ruler,
  sparkle: Sparkles,
  mapPin: MapPin,
  lock: Lock,
};

export function GsIcon({
  name,
  className = 'h-5 w-5',
  strokeWidth = 2,
}: {
  name: keyof typeof GLYPHS | string;
  className?: string;
  strokeWidth?: number;
}) {
  const Glyph = GLYPHS[name];
  if (!Glyph && process.env.NODE_ENV !== 'production') {
    console.warn('[icons] GsIcon unmapped name:', name);
  }
  const Resolved = Glyph ?? Sprout;
  return <Resolved className={className} strokeWidth={strokeWidth} aria-hidden />;
}

/** Solid gold star — the design system's gold (#B58E39), used sparingly. */
export function GoldStar({ className = 'h-[15px] w-[15px]' }: { className?: string }) {
  return <Star className={className} fill="#B58E39" color="#B58E39" strokeWidth={0} aria-hidden />;
}

export default GsIcon;
