'use client';

import Link from 'next/link';
import cn from 'classnames';
import SafeImage from '@/components/ui/safe-image';
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  Droplet,
  Hand,
  Heart,
  Leaf,
  PottedPlant,
  Scissors,
  Seedling,
  Shovel,
  Spray,
  Sprout,
  Truck,
  type LucideIcon,
} from '@/components/ui/icon';
import { useCategories } from '@/framework/category';
import { CATEGORIES_PER_PAGE } from '@/framework/client/variables';
import { SectionHead } from './section-head';
import {
  GUIDE_CARDS,
  NEED_CARDS,
  SECTION,
  TASK_TILES,
  TOOLS_FAQS,
  WHY_ITEMS,
  type ToolIconKey,
} from './tools-content';

/** tools-content's icon keys → glyphs. Seedling and Sprout are the same Tabler seedling. */
const ICONS: Record<ToolIconKey, LucideIcon> = {
  scissors: Scissors,
  pot: PottedPlant,
  droplet: Droplet,
  seedling: Seedling,
  shovel: Shovel,
  spray: Spray,
  sprout: Sprout,
  badge: BadgeCheck,
  hand: Hand,
  truck: Truck,
  leaf: Leaf,
  heart: Heart,
};

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700';

/**
 * "Not sure what you need?": a full-bleed sage band of four task cards (icon,
 * task, what it takes, →), each linking to the category that serves it. From
 * `lg` a leafy crop of the hero photo bleeds off the right edge behind them.
 *
 * Render it inside the page's gutter container (`px-5 lg:px-6 xl:px-8`): the
 * band bleeds out with matching negative margins and re-adds the gutter inside.
 */
export function NeedBand() {
  return (
    <section
      aria-labelledby="tools-need"
      className="relative -mx-5 mt-14 overflow-hidden bg-sage-100 px-5 py-10 lg:-mx-6 lg:mt-20 lg:px-6 xl:-mx-8 xl:px-8"
    >
      {/* Absolute ⇒ painted above in-flow content, so the heading and cards below are `relative`.
          The photo is drawn at 190% of the band's height and shifted right by 50.6% of its own
          width. That pins the photo's x≈49% (the potted plant's leafy crown, left of its pot and
          the tools) to the band's right edge at every width, so only leaves show, as in the mock. */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 hidden w-[30%] overflow-hidden lg:block [mask-image:linear-gradient(to_right,transparent,black_45%)]"
      >
        <SafeImage
          src="/tools-hero.webp"
          alt=""
          width={1600}
          height={569}
          // Drawn about 1,600 CSS px wide at every lg width, so this always picks the 1920w
          // candidate: the same URL (w=1920, q=70) a retina screen already fetched for the hero.
          sizes="1600px"
          quality={70}
          className="absolute right-0 top-0 h-[190%] w-auto max-w-none translate-x-[50.6%]"
        />
      </div>

      <SectionHead id="tools-need" className="relative" {...SECTION.need} />

      <ul className="relative mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {NEED_CARDS.map((card) => {
          const Icon = ICONS[card.icon];
          return (
            <li key={card.key}>
              <Link
                href={card.href}
                className={cn(
                  'group flex h-full items-start gap-4 rounded-lg bg-white p-5 shadow-box transition hover:-translate-y-0.5 lg:p-6',
                  FOCUS_RING,
                )}
              >
                <Icon size={32} className={cn('shrink-0', card.tone)} aria-hidden />
                <div className="min-w-0">
                  <h3 className="text-[16px] font-bold leading-snug text-forest-900">{card.title}</h3>
                  <p className="mt-1 text-[14px] leading-5 text-stone-600">{card.items}</p>
                  <ArrowRight
                    size={16}
                    className="mt-2.5 block text-forest-900 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * "What are you working on today?": seven task tiles (icon, task, one line),
 * each linking to the category that serves it. Cleaning and Supporting land on
 * Accessories until they have categories of their own. Seven across from `lg`,
 * four on tablets, two on phones.
 */
export function TaskTiles() {
  return (
    <section aria-labelledby="tools-tasks" className="mt-14 lg:mt-20">
      <SectionHead id="tools-tasks" {...SECTION.tasks} />
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7 lg:gap-4 xl:gap-5">
        {TASK_TILES.map((tile) => {
          const Icon = ICONS[tile.icon];
          return (
            <li key={tile.key}>
              <Link
                href={tile.href}
                className={cn(
                  'flex h-full min-h-[128px] flex-col rounded-lg border border-kraft-200 bg-white p-4 transition hover:border-forest-700/40 hover:shadow-box xl:p-5',
                  FOCUS_RING,
                )}
              >
                <Icon size={32} className={cn('shrink-0', tile.tone)} aria-hidden />
                <h3 className="mt-4 text-[15px] font-bold leading-5 text-forest-900">{tile.title}</h3>
                <p className="mt-1 text-[12.5px] leading-snug text-stone-600">{tile.sub}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * "Why shop tools from PlantAtHome?": four promises (icon disc, title, one
 * line) in a band ruled top and bottom. No cards.
 */
export function WhyBand() {
  return (
    <section aria-labelledby="tools-why" className="mt-14 border-y border-kraft-200 py-10 lg:mt-20">
      <SectionHead id="tools-why" {...SECTION.why} />
      <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {WHY_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <li key={item.t} className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-kraft-200 bg-white text-forest-800">
                <Icon size={24} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[16px] font-semibold leading-snug text-forest-900">{item.t}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-stone-600">{item.d}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * "Gardening Tools Guide": four cards into the collections. They are
 * navigation, not articles: there is no content system, so no article URL is
 * invented. Each card's photo is its linked category's own image, read from the
 * same useCategories key as ToolsCategories and loadToolsData (one request,
 * server-seeded). A sage tint shows while it loads, or when the category has
 * no image or its image fails.
 *
 * @param type the vertical slug (`tools`)
 * @param className layout from the page, e.g. its grid column
 */
export function ToolsGuides({ type, className }: { type: string; className?: string }) {
  const { categories } = useCategories({
    type,
    parent: 'null',
    limit: CATEGORIES_PER_PAGE,
    home: 1,
  });
  const imageOf = (slug: string) => categories.find((c) => c?.slug === slug)?.image?.original ?? '';

  return (
    <section aria-labelledby="tools-guides" className={cn(className)}>
      <SectionHead id="tools-guides" {...SECTION.guides} />
      <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-5">
        {GUIDE_CARDS.map((guide) => (
          <li key={guide.title}>
            <Link
              href={guide.href}
              className={cn(
                'group flex h-full flex-col overflow-hidden rounded-lg border border-kraft-200 bg-white transition hover:shadow-box',
                FOCUS_RING,
              )}
            >
              <div className="relative aspect-[3/2] overflow-hidden bg-sage-100">
                {/* Decorative: the card's title is its text, so an alt would only repeat it. */}
                <SafeImage
                  src={imageOf(guide.slug)}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
                  quality={70}
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  fallback={null}
                />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="mb-6 line-clamp-3 text-[14px] font-semibold leading-5 text-forest-900">
                  {guide.title}
                </h3>
                <ArrowRight
                  size={16}
                  className="mt-auto text-forest-900 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * "Gardening Tools — FAQs": native <details> rows, so they work from the
 * keyboard and without JS and the answers are in the server HTML. None is open
 * by default. TOOLS_FAQS also feeds the route's FAQPage JSON-LD, so the
 * structured data always matches what is shown.
 *
 * @param className layout from the page, e.g. its grid column
 */
export function ToolsFaq({ className }: { className?: string }) {
  return (
    <section aria-labelledby="tools-faq" className={cn(className)}>
      <SectionHead id="tools-faq" {...SECTION.faq} />
      <div className="mt-4">
        {TOOLS_FAQS.map((faq) => (
          <details key={faq.q} className="group border-b border-kraft-200">
            <summary
              className={cn(
                'flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 py-4 [&::-webkit-details-marker]:hidden',
                FOCUS_RING,
              )}
            >
              <h3 className="text-[15px] font-medium leading-snug text-forest-900">{faq.q}</h3>
              <ChevronDown
                size={16}
                className="shrink-0 text-stone-600 transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="px-3 pb-4 text-[14px] leading-relaxed text-stone-600">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
