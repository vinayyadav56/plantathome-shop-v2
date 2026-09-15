import { forwardRef } from 'react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import type { TablerIcon, IconProps as TablerIconProps } from '@tabler/icons-react';
import {
  // commerce
  IconShoppingBag,
  IconSearch,
  IconHeart,
  IconStar,
  IconGift,
  IconCreditCard,
  IconWallet,
  IconReceipt,
  IconTag,
  IconPercentage,
  // fulfilment
  IconTruck,
  IconBike,
  IconPackage,
  IconMapPin,
  IconClock,
  IconCalendarMonth,
  IconStopwatch,
  IconRefresh,
  IconRotate,
  IconFlag,
  IconHeadset,
  IconBox,
  // status
  IconCheck,
  IconCircleCheck,
  IconX,
  IconCircleX,
  IconAlertTriangle,
  IconAlertCircle,
  IconInfoCircle,
  IconShieldCheck,
  IconRosetteDiscountCheck,
  IconLock,
  // navigation
  IconMenu2,
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
  IconChevronUp,
  IconArrowRight,
  IconArrowLeft,
  IconArrowDown,
  IconArrowUp,
  IconHome,
  IconExternalLink,
  IconLayoutGrid,
  IconAdjustmentsHorizontal,
  IconLogout,
  // account & contact
  IconUser,
  IconUserCircle,
  IconPhone,
  IconMail,
  IconMessageCircle,
  IconDeviceMobile,
  IconBell,
  IconShare,
  IconCopy,
  IconEye,
  IconEyeOff,
  // plants & care
  IconLeaf,
  IconSeedling,
  IconFlower,
  IconDroplet,
  IconSun,
  IconMoon,
  IconWind,
  IconTemperature,
  IconRuler,
  IconTool,
  IconStack2,
  IconWorld,
  // botanical — plant-domain vocabulary
  IconPaw,
  IconShovel,
  IconPlant,
  IconScissors,
  IconSpray,
  IconBucketDroplet,
  IconSunHigh,
  IconSunLow,
  IconDroplets,
  IconPointFilled,
  IconFlask,
  IconRecycle,
  IconShoppingCartOff,
  IconDeviceFloppy,
  IconLayoutList,
  IconPlant2,
  IconGrain,
  // misc UI
  IconPlus,
  IconMinus,
  IconPencil,
  IconTrash,
  IconCamera,
  IconGlobe,
  IconPlayerPlay,
  IconQuote,
  IconBolt,
  IconSparkles,
  IconWand,
  IconBuilding,
  IconTrendingUp,
  IconVolumeOff,
  IconMicrophone,
  IconSend,
  IconHelpCircle,
  IconFileText,
  IconSettings,
  IconNavigation,
  IconCrosshair,
  IconDownload,
  IconThumbUp,
  IconThumbDown,
  IconHandStop,
  IconUpload,
  IconDots,
  IconDotsVertical,
} from '@tabler/icons-react';

/**
 * The single icon system for the storefront.
 *
 * Import glyphs from THIS file, never from '@tabler/icons-react' directly, so
 * concept->glyph stays pinned in one place and the weight below stays
 * authoritative. An eslint no-restricted-imports rule enforces it.
 *
 * GEOMETRY SPEC — every glyph here, library or hand-drawn, obeys it:
 *   grid      viewBox 0 0 24 24, 2u margin, 20x20 live area
 *   keylines  square 20x20 | circle d20 | portrait 18x20 | landscape 20x18
 *   stroke    ICON_STROKE below, round cap, round join
 *   corners   exterior radius 2u, interior 1u
 *   snapping  key vertices on whole or half units, nothing finer
 *   detail    no negative space narrower than one stroke; <=4 strokes at 16px
 *   colour    currentColor only, never a hex
 *   solid     same paths, fill swapped, via .pa-icon-solid -- never a 2nd drawing
 *
 * Illustrations are NOT icons: anything rendered above 64px lives in
 * components/ui/illustration/ under its own rules.
 *
 * Deliberately NOT here: brand marks (icons/social/*, icons/payment-gateways/*)
 * and the DB-keyed category/group palettes, whose export names are pinned by
 * records in the database and must be redrawn in place, never renamed.
 */

/** ONE knob. Changing this number retunes every icon on the site. */
export const ICON_STROKE = 1.75;

export type IconSize = 12 | 14 | 16 | 18 | 20 | 24 | 32 | 40 | 48;

/** Public prop shape. `stroke` is deliberately absent: the knob owns weight. */
export type IconProps = Omit<TablerIconProps, 'stroke' | 'ref' | 'size'> & { size?: IconSize };

/** Frozen legacy type names -- ~14 files annotate maps with these. */
export type LucideIcon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;
export type LucideProps = IconProps;

/** Applies the house weight. A call site may still override fill/strokeWidth
 *  directly (the filled star, quote and play glyphs rely on that). */
/** Wraps a raw library glyph in the house weight. Exported for the DB-keyed
 *  palette files under icons/category and icons/groups, whose export names are
 *  pinned by database records and so cannot be re-exported from this barrel. */
export const paletteIcon = (Glyph: TablerIcon) =>
  forwardRef<SVGSVGElement, IconProps>(function PaPaletteIcon(props, ref) {
    return <Glyph stroke={ICON_STROKE} {...props} ref={ref} />;
  });

const g = (Glyph: TablerIcon) =>
  forwardRef<SVGSVGElement, IconProps>(function PaIcon(props, ref) {
    return <Glyph stroke={ICON_STROKE} {...props} ref={ref} />;
  });

// commerce
export const ShoppingBag = g(IconShoppingBag);
export const Search = g(IconSearch);
export const Heart = g(IconHeart);
export const Star = g(IconStar);
export const Gift = g(IconGift);
export const CreditCard = g(IconCreditCard);
export const Wallet = g(IconWallet);
export const Receipt = g(IconReceipt);
export const Tag = g(IconTag);
export const Percent = g(IconPercentage);

// fulfilment
export const Truck = g(IconTruck);
export const Bike = g(IconBike);
export const Package = g(IconPackage);
export const MapPin = g(IconMapPin);
export const Clock = g(IconClock);
export const CalendarDays = g(IconCalendarMonth);
export const Timer = g(IconStopwatch);
export const RefreshCw = g(IconRefresh);
export const RotateCcw = g(IconRotate);
export const Flag = g(IconFlag);
export const Headset = g(IconHeadset);
export const Box = g(IconBox);

// status
export const Check = g(IconCheck);
export const CircleCheck = g(IconCircleCheck);
export const X = g(IconX);
export const CircleX = g(IconCircleX);
export const TriangleAlert = g(IconAlertTriangle);
export const CircleAlert = g(IconAlertCircle);
export const Info = g(IconInfoCircle);
export const ShieldCheck = g(IconShieldCheck);
export const BadgeCheck = g(IconRosetteDiscountCheck);
export const Lock = g(IconLock);

// navigation
export const Menu = g(IconMenu2);
export const ChevronLeft = g(IconChevronLeft);
export const ChevronRight = g(IconChevronRight);
export const ChevronDown = g(IconChevronDown);
export const ChevronUp = g(IconChevronUp);
export const ArrowRight = g(IconArrowRight);
export const ArrowLeft = g(IconArrowLeft);
export const ArrowDown = g(IconArrowDown);
export const ArrowUp = g(IconArrowUp);
export const Home = g(IconHome);
export const ExternalLink = g(IconExternalLink);
export const LayoutGrid = g(IconLayoutGrid);
export const SlidersHorizontal = g(IconAdjustmentsHorizontal);
export const LogOut = g(IconLogout);

// account & contact
export const User = g(IconUser);
export const UserRound = g(IconUserCircle);
export const Phone = g(IconPhone);
export const Mail = g(IconMail);
export const MessageCircle = g(IconMessageCircle);
export const Smartphone = g(IconDeviceMobile);
export const Bell = g(IconBell);
export const Share2 = g(IconShare);
export const Copy = g(IconCopy);
export const Eye = g(IconEye);
export const EyeOff = g(IconEyeOff);

// plants & care
export const Leaf = g(IconLeaf);
export const Sprout = g(IconSeedling);
export const Flower2 = g(IconFlower);
export const Droplet = g(IconDroplet);
export const Sun = g(IconSun);
export const Moon = g(IconMoon);
export const Wind = g(IconWind);
export const Thermometer = g(IconTemperature);
export const Ruler = g(IconRuler);
export const Wrench = g(IconTool);
export const Layers = g(IconStack2);
export const Earth = g(IconWorld);

// botanical — plant-domain vocabulary
export const PawPrint = g(IconPaw);
export const Shovel = g(IconShovel);
export const PottedPlant = g(IconPlant);
export const Seedling = g(IconSeedling);
export const Scissors = g(IconScissors);
export const Spray = g(IconSpray);
export const BucketDroplet = g(IconBucketDroplet);
export const SunHigh = g(IconSunHigh);
export const SunLow = g(IconSunLow);
export const Droplets = g(IconDroplets);
export const Flower = g(IconFlower);
export const Dot = g(IconPointFilled);
export const Flask = g(IconFlask);
export const Recycle = g(IconRecycle);
export const CartOff = g(IconShoppingCartOff);
export const Save = g(IconDeviceFloppy);
export const ListView = g(IconLayoutList);
export const PlantPotted = g(IconPlant);
export const PlantBare = g(IconPlant2);
export const Grain = g(IconGrain);

// misc UI
export const Plus = g(IconPlus);
export const Minus = g(IconMinus);
export const Pencil = g(IconPencil);
export const Trash2 = g(IconTrash);
export const Camera = g(IconCamera);
export const Globe = g(IconGlobe);
export const Play = g(IconPlayerPlay);
export const Quote = g(IconQuote);
export const Zap = g(IconBolt);
export const Sparkles = g(IconSparkles);
export const WandSparkles = g(IconWand);
export const Building2 = g(IconBuilding);
export const TrendingUp = g(IconTrendingUp);
export const VolumeX = g(IconVolumeOff);
export const Mic = g(IconMicrophone);
export const Send = g(IconSend);
export const CircleHelp = g(IconHelpCircle);
export const FileText = g(IconFileText);
export const Settings = g(IconSettings);
export const Navigation = g(IconNavigation);
export const Crosshair = g(IconCrosshair);
export const Download = g(IconDownload);
export const ThumbsUp = g(IconThumbUp);
export const ThumbsDown = g(IconThumbDown);
export const Hand = g(IconHandStop);
export const Upload = g(IconUpload);
export const Ellipsis = g(IconDots);
export const EllipsisVertical = g(IconDotsVertical);
