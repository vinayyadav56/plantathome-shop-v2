/**
 * /tools page copy — the owner's mock (2026-10-07), verbatim. UI copy only:
 * products, categories, prices and images always come from the API.
 *
 * Plain module on purpose: no 'use client' and no ui/icon import, because the
 * server route imports TOOLS_FAQS (FAQPage JSON-LD) from here. Icons are string
 * keys that the client components resolve to glyphs.
 */

export type ToolIconKey =
  | 'shield'
  | 'truck'
  | 'heart'
  | 'hand'
  | 'leaf'
  | 'scissors'
  | 'pot'
  | 'droplet'
  | 'seedling'
  | 'shovel'
  | 'spray';

export interface ToolsLink {
  label: string;
  href: string;
}

/** An icon + title + one line (hero trust row, "Why" band). */
export interface IconCopy {
  icon: ToolIconKey;
  t: string;
  d: string;
}

export interface NeedCard {
  key: string;
  title: string;
  /** Shown as "a · b" with the last item on its own line, as in the mock. */
  items: string[];
  href: string;
  icon: ToolIconKey;
  /** Tailwind text colour for the icon. */
  tone: string;
}

export interface TaskTile {
  key: string;
  title: string;
  sub: string;
  href: string;
  icon: ToolIconKey;
  /** Tailwind text colour for the icon. */
  tone: string;
}

export interface GuideCard {
  title: string;
  /** The category the card links to; its image is the card's image. */
  slug: string;
  href: string;
}

export interface ToolsFaq {
  q: string;
  a: string;
}

/** Where every "View All …" link lands: the Tools block of /categories. */
export const VIEW_ALL_HREF = '/categories#tools';

/** The owner's potting-table photo (1600×569): the hero, the kit band's stand-in and the
 *  need band's leafy crop all use it. */
export const HERO_PHOTO = '/tools-hero.webp';

/**
 * `sizes` for the hero photo and the kit band's stand-in (same box geometry). It describes the
 * width the photo is DRAWN at, not its box: object-cover scales the 2.81:1 photo to the box's
 * height, so it is drawn ~1350 px wide in the ~490 px desktop band (~1250 px in the lg band and
 * the 420 px kit panel), at least the viewport (and 720 px) in the 256 px tablet strip, and
 * 141vw in the 2:1 phone strip. One string, so the hero's single preload is the file each of
 * them picks (lg+ always resolves to the 1920w file, which the need band's crop asks for too).
 */
export const HERO_PHOTO_SIZES = '(min-width: 1280px) 1350px, (min-width: 1024px) 1250px, (min-width: 640px) 100vw, 141vw';

export const HERO: {
  eyebrow: string;
  title: string;
  sub: string;
  primary: ToolsLink;
  secondary: ToolsLink;
  trust: IconCopy[];
} = {
  eyebrow: 'GARDENING TOOLS',
  title: 'Gardening Tools for Every Green Space',
  sub: 'Everything you need to plant, prune, water and care for your garden.',
  primary: { label: 'Shop Gardening Tools', href: '#categories' },
  secondary: { label: 'Explore Tool Sets', href: '/c/tool-sets' },
  trust: [
    { icon: 'shield', t: 'Quality Selected', d: 'For home gardeners' },
    { icon: 'truck', t: 'Easy Delivery', d: 'Across India' },
    { icon: 'leaf', t: 'Trusted by', d: 'Plant Lovers' },
  ],
};

/** Section headings — `title`/`sub`/`link` spread straight into <SectionHead>. */
export const SECTION = {
  categories: {
    title: 'Shop by Category',
    sub: 'Find the right tools for your gardening needs.',
    link: { label: 'View All Tools', href: VIEW_ALL_HREF },
  },
  bestsellers: {
    title: 'Tools gardeners love',
    sub: 'Best-selling tools, selected for everyday plant care.',
    link: { label: 'View All', href: VIEW_ALL_HREF },
  },
  need: {
    title: 'Not sure what you need?',
    sub: 'Find the right gardening tool for your plant care task.',
  },
  kit: {
    eyebrow: 'FEATURED',
    sub: 'Everything you need to start gardening.',
    cta: 'View Tool Kit',
  },
  tasks: {
    title: 'What are you working on today?',
    sub: 'Browse tools by your gardening task.',
    link: { label: 'View All Tasks', href: VIEW_ALL_HREF },
  },
  why: {
    title: 'Why shop tools from PlantAtHome?',
  },
  guides: {
    title: 'Gardening Tools Guide',
    sub: 'Helpful guides, tips and resources.',
    link: { label: 'View All Guides', href: VIEW_ALL_HREF },
  },
  faq: {
    title: 'Gardening Tools — FAQs',
  },
};

export const NEED_CARDS: NeedCard[] = [
  {
    key: 'planting',
    title: "I'm planting",
    items: ['Trowels', 'Cultivators', 'Transplanters'],
    href: '/c/tool-accessories',
    icon: 'seedling',
    tone: 'text-emerald-600',
  },
  {
    key: 'pruning',
    title: "I'm pruning",
    items: ['Secateurs', 'Shears', 'Cutters'],
    href: '/c/pruning-cutting',
    icon: 'scissors',
    tone: 'text-rose-500',
  },
  {
    key: 'watering',
    title: "I'm watering",
    items: ['Watering cans', 'Sprayers', 'Misters'],
    href: '/c/watering-tools',
    icon: 'droplet',
    tone: 'text-sky-500',
  },
  {
    key: 'repotting',
    title: "I'm repotting",
    items: ['Pots tools', 'Scoops', 'Root care tools'],
    href: '/c/planters-pots',
    icon: 'pot',
    tone: 'text-orange-600',
  },
];

// Cleaning and Supporting have no category of their own yet — they land on Accessories.
export const TASK_TILES: TaskTile[] = [
  { key: 'pruning', title: 'Pruning', sub: 'Cut, shape & maintain plants', href: '/c/pruning-cutting', icon: 'scissors', tone: 'text-rose-500' },
  { key: 'repotting', title: 'Repotting', sub: 'Move plants & refresh soil', href: '/c/planters-pots', icon: 'pot', tone: 'text-orange-600' },
  { key: 'watering', title: 'Watering', sub: 'Keep plants hydrated', href: '/c/watering-tools', icon: 'droplet', tone: 'text-sky-500' },
  { key: 'planting', title: 'Planting', sub: 'Plant seeds & transplants', href: '/c/tool-accessories', icon: 'seedling', tone: 'text-emerald-600' },
  { key: 'soil', title: 'Soil Care', sub: 'Manage soil & nutrition', href: '/c/soil-care', icon: 'shovel', tone: 'text-amber-800' },
  { key: 'cleaning', title: 'Cleaning', sub: 'Clean leaves & remove dust', href: '/c/tool-accessories', icon: 'spray', tone: 'text-sky-600' },
  { key: 'supporting', title: 'Supporting', sub: 'Stakes, ties & plant support', href: '/c/tool-accessories', icon: 'leaf', tone: 'text-green-700' },
];

export const WHY_ITEMS: IconCopy[] = [
  { icon: 'leaf', t: 'Quality selected', d: 'Practical tools for home gardening' },
  { icon: 'hand', t: 'Ergonomic design', d: 'Comfortable for everyday use' },
  { icon: 'truck', t: 'Easy delivery', d: 'Fast delivery across India' },
  { icon: 'heart', t: 'Plant care expertise', d: 'Selected by people who understand plants' },
];

/** Navigation into the collections, not articles — there is no content system,
 *  so no article URL is ever invented. */
export const GUIDE_CARDS: GuideCard[] = [
  { title: 'Best gardening tools for beginners', slug: 'tool-accessories', href: '/c/tool-accessories' },
  { title: 'How to choose the right pruning tool', slug: 'pruning-cutting', href: '/c/pruning-cutting' },
  { title: 'Essential tools for balcony gardening', slug: 'planters-pots', href: '/c/planters-pots' },
  { title: 'Complete guide to gardening tool kits', slug: 'tool-sets', href: '/c/tool-sets' },
];

/** Rendered by the FAQ accordion AND emitted as FAQPage JSON-LD by the route —
 *  one source, so the structured data always matches the visible answers. */
export const TOOLS_FAQS: ToolsFaq[] = [
  {
    q: 'What gardening tools do I need as a beginner?',
    a: 'Start with a hand trowel, a hand cultivator, a pair of bypass secateurs, gardening gloves and a watering can with a fine rose. Together they cover planting, loosening soil, light pruning and watering — almost everything a balcony or small garden needs. A ready tool set is the easiest way to get the essentials in one go.',
  },
  {
    q: 'Which tool is best for pruning plants?',
    a: 'For most houseplants and shrubs, sharp bypass secateurs give the cleanest cut on live stems. Use snips for delicate trimming and deadheading, and a lopper or pruning saw for thicker woody branches. Clean, sharp blades help cuts heal faster.',
  },
  {
    q: 'What is the difference between a pruner and a garden shear?',
    a: 'A pruner (secateur) is a one-handed tool for precise cuts on individual stems and branches. Garden shears have long blades worked with both hands and are made for shaping hedges and trimming many soft shoots at once. Use pruners for plant health and shears for shape.',
  },
  {
    q: 'What tools are needed for balcony gardening?',
    a: 'Balcony gardens are container gardens, so a hand trowel, a cultivator, a watering can or spray bottle, gloves and a good potting mix go a long way. Planters with drainage holes, grow bags or a window box help you make the most of the space.',
  },
  {
    q: 'Can I buy gardening tool sets online?',
    a: 'Yes. The Tool Sets collection on PlantAtHome brings the essentials together in one order, from compact hand-tool sets to kits for bonsai and succulent care. Add a set to your cart like any other product and confirm delivery for your city at checkout.',
  },
];
