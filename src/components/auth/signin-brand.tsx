import Image from 'next/image';
import Link from 'next/link';
import { Caveat } from 'next/font/google';
import { useTranslation } from 'next-i18next';
import { WordmarkStacked } from '@/components/storefront/logo-mark';
import { Leaf, Truck, Home, Recycle } from '@/components/ui/icon';

/**
 * The brand half of /signin, rendered as real HTML over the page's photographic
 * backdrop rather than baked into the artwork.
 *
 * The owner supplied this as a composed image. Shipping it that way would have
 * made the headline, the four benefits and the icon captions unselectable,
 * untranslatable, invisible to search engines, and would have cropped them at
 * any viewport other than the one they were drawn for. Every string below is
 * therefore a real node; only the photograph is a raster.
 *
 * Split in two exports because the phone needs them on OPPOSITE sides of the
 * login card: brand above it (so the page still introduces itself), benefits
 * below it (so nobody scrolls past a wall of marketing to reach a password
 * field). On desktop they stack back into one left-hand column.
 */

/**
 * The signature is the one genuinely handwritten mark in the design, and
 * nothing else on the site uses a script face.
 *
 * Deliberately NOT the `font-caveat` Tailwind alias: tailwind.config.js:66
 * currently collapses that alias onto the body sans, and repointing it would
 * silently restyle a product-detail component in the same commit. Deliberately
 * not a Google Fonts <link> either — that is a render-blocking cross-origin
 * stylesheet on the critical path of the page whose LCP we just spent a cycle
 * fixing. next/font self-hosts it and, because the instance lives in this
 * module rather than the root layout, only routes that render this component
 * pay for it.
 */
const caveat = Caveat({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-signature',
});

/** Top-left: lockup, headline, promise. */
export function SigninBrand({ className = '' }: { className?: string }) {
  const { t } = useTranslation('common');
  return (
    <div className={`text-white ${className}`}>
      <Link href="/" className="inline-flex" aria-label="PlantAtHome home">
        <WordmarkStacked light tagline={false} />
      </Link>

      <h2 className="mt-7 font-pahserif text-[30px] font-medium leading-[1.08] tracking-[-0.02em] sm:text-[38px] lg:mt-10 lg:text-[46px] xl:text-[52px]">
        {t('signin-headline')}
      </h2>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-white/78 sm:text-[15px] lg:mt-4 lg:max-w-lg lg:text-[16px]">
        {t('signin-subline')}
      </p>
    </div>
  );
}

/**
 * Bottom-left: the four benefits, the signature, and the category row.
 *
 * `Leaf` here is a plant, not ornament — "Wide Variety / Plants for every
 * space" is literally about plants, which is why this file is allowlisted in
 * scripts/check-icon-rules.mjs rather than the rule being relaxed.
 */
const FEATURES = [
  { Icon: Leaf, title: 'signin-usp-variety', sub: 'signin-usp-variety-sub' },
  { Icon: Truck, title: 'signin-usp-delivery', sub: 'signin-usp-delivery-sub' },
  { Icon: Home, title: 'signin-usp-greener', sub: 'signin-usp-greener-sub' },
  { Icon: Recycle, title: 'signin-usp-sustainable', sub: 'signin-usp-sustainable-sub' },
] as const;

/** Matches the artwork's caption row. All five files already shipped unused. */
const GLYPHS = [
  { src: '/brand/glyph-plants.png', label: 'Plants' },
  { src: '/brand/glyph-pot.png', label: 'Pots' },
  { src: '/brand/glyph-home.png', label: 'Home' },
  { src: '/brand/glyph-sustainable.png', label: 'Sustainable' },
  { src: '/brand/glyph-lifestyle.png', label: 'Lifestyle' },
] as const;

export function SigninFeatures({ className = '' }: { className?: string }) {
  const { t } = useTranslation('common');
  return (
    <div className={`text-white ${className}`}>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-x-8 lg:gap-y-5">
        {FEATURES.map(({ Icon, title, sub }) => (
          <li key={title} className="flex items-start gap-3">
            {/* Pale-green disc per the artwork. The ring is what keeps it read-
                able where the photograph goes bright behind it. */}
            <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#DFF3D4]/90 text-forest-800 ring-1 ring-white/25 backdrop-blur-sm">
              <Icon size={20} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[14.5px] font-semibold leading-snug">
                {t(title)}
              </span>
              <span className="mt-0.5 block text-[13px] leading-snug text-white/78">
                {t(sub)}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <p
        className={`${caveat.className} mt-8 text-[30px] leading-none text-[#C8E6A0] lg:mt-10 lg:text-[36px]`}
      >
        Bring Nature Home
      </p>

      <ul className="mt-6 flex flex-wrap items-start justify-center gap-x-6 gap-y-4 lg:mt-8 lg:justify-start lg:gap-x-8">
        {GLYPHS.map(({ src, label }) => (
          <li key={label} className="flex w-[68px] flex-col items-center gap-2">
            <Image
              src={src}
              alt=""
              width={30}
              height={27}
              quality={65}
              className="h-[27px] w-auto opacity-90 [filter:brightness(0)_invert(1)]"
            />
            <span className="text-center text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white/70">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
