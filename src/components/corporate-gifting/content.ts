/**
 * /corporate-gifting copy and options — the owner's 2026-10-17 spec and mocks, verbatim.
 * UI copy only: the hampers, their prices and the contact details come from the API.
 *
 * PLANT_PREFS keys and the quantity/budget bands are what `POST corporate-leads` stores
 * (`meta.plant_preferences` is validated against these keys server-side).
 */
import {
  Building2,
  CalendarDays,
  Gift,
  Headset,
  MapPin,
  Package,
  PottedPlant,
  Sparkles,
  Truck,
  User,
  Wallet,
  type LucideIcon,
} from '@/components/ui/icon';

export const HERO = {
  eyebrow: 'Corporate plant gifting',
  title: 'Request a Custom Proposal',
  sub: 'Tell us a few details about your requirements, and our team will help you find the right plants, planters, packaging and delivery options.',
  image: '/images/gifting/proposal-hero-2026-10.webp',
  alt: 'Branded PlantAtHome planters with a peace lily and a kraft gift box tied with green ribbon',
};

export const BENEFITS: { icon: LucideIcon; title: string }[] = [
  { icon: PottedPlant, title: 'Curated plant options' },
  { icon: Package, title: 'Custom branding & packaging' },
  { icon: Truck, title: 'Pan-India delivery' },
  { icon: Headset, title: 'Dedicated corporate support' },
];

export const FORM = {
  title: 'Corporate Gifting Enquiry',
  subDesktop: 'Please fill in the key details and our team will get back to you with a customized proposal.',
  subMobile: 'Share a few details to receive a customized proposal.',
  steps: ['Your details', 'Gifting details', 'Plant preferences', 'Additional requirements (optional)'],
  prefsLegend: 'Select the type of plants you’re interested in (optional)',
  messagePlaceholder:
    'Tell us about logo printing, branded pots, gift packaging, personalized cards or special delivery requirements.',
  messageMax: 500,
  submit: 'Submit Request',
  privacy: 'Your information will be used to prepare a proposal tailored to your requirements.',
};

export const OCCASIONS = [
  'Employee gifting',
  'Client appreciation',
  'Corporate event',
  'Festive gifting',
  'Dealer or partner gifting',
  'Other',
];

export const QUANTITIES = [
  { value: '25-49', label: '25–49 gifts' },
  { value: '50-99', label: '50–99 gifts' },
  { value: '100-249', label: '100–249 gifts' },
  { value: '250-499', label: '250–499 gifts' },
  { value: '500-999', label: '500–999 gifts' },
  { value: '1000+', label: '1,000+ gifts' },
];

/** Preference bands, not prices: the proposal quotes the real per-gift cost. */
export const BUDGETS = ['Under ₹500', '₹500–₹999', '₹1,000–₹1,999', '₹2,000–₹4,999', '₹5,000+'];

export const PLANT_PREFS = [
  { key: 'indoor', label: 'Indoor plants', image: '/images/gifting/prefs/indoor.webp' },
  { key: 'air_purifying', label: 'Air-purifying plants', image: '/images/gifting/prefs/air-purifying.webp' },
  { key: 'low_maintenance', label: 'Low-maintenance plants', image: '/images/gifting/prefs/low-maintenance.webp' },
  { key: 'flowering', label: 'Flowering plants', image: '/images/gifting/prefs/flowering.webp' },
  { key: 'succulents_desk', label: 'Succulents & desk plants', image: '/images/gifting/prefs/succulents-desk.webp' },
  { key: 'other', label: 'Other / open to ideas', image: '/images/gifting/prefs/other.webp' },
];

export const SUMMARY = {
  title: 'Your enquiry summary',
  text: 'We’ll review your requirements and get back to you with suitable options and pricing.',
  rows: [
    { key: 'company', label: 'Company', icon: Building2 },
    { key: 'name', label: 'Contact person', icon: User },
    { key: 'occasion', label: 'Occasion', icon: Gift },
    { key: 'quantity', label: 'Quantity', icon: Package },
    { key: 'budget_range', label: 'Budget per gift', icon: Wallet },
    { key: 'preferred_date', label: 'Delivery date', icon: CalendarDays },
    { key: 'city', label: 'Delivery city', icon: MapPin },
    { key: 'plant_preferences', label: 'Plant preferences', icon: PottedPlant },
  ] as const,
};

export const HELP = {
  title: 'Need help?',
  text: 'Our corporate gifting team can help you choose suitable plants, planters, packaging and delivery.',
  call: 'Talk to our team',
};

export const WHY: { title: string; items: { icon: LucideIcon; text: string }[] } = {
  title: 'Why choose PlantAtHome?',
  items: [
    { icon: PottedPlant, text: 'Curated plants and planters' },
    { icon: Sparkles, text: 'Custom branding and premium packaging' },
    { icon: Truck, text: 'Delivery options for offices and individual recipients, subject to availability' },
    { icon: Headset, text: 'Dedicated support for corporate clients' },
  ],
};

export const HAMPERS = { title: 'Popular corporate gifting options', link: 'View all', href: '/offers?tab=corporate' };

export const TRUST = [
  'Trusted by businesses across India',
  'Suitable for offices and remote teams',
  'Thoughtful and sustainable gifting options',
  'End-to-end support from selection to delivery',
];

export const SUCCESS = {
  title: 'Request received',
  text: 'Thanks! Our corporate gifting team will get back to you with a tailored proposal.',
  again: 'Send another request',
};
