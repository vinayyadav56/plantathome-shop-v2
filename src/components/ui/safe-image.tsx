'use client';
import Image, { type ImageProps } from 'next/image';
import { useState, type ReactNode } from 'react';

/**
 * Where the storefront's image variants are defined.
 *
 * Most of this site's imagery used to be raw `<img>` — all twelve images in the
 * phone home, and seven of sixteen in the desktop home — so none of it reached
 * the optimizer. Measured consequences: 900x600 and 800x1200 originals painted
 * into 125x125 boxes, and admin-uploaded vertical tiles of 1.1-2.9 MB rendered
 * into a 150x96 tile. Lighthouse put the site-wide cost at 26.6 MB.
 *
 * `sizes` is the part that actually decides the bytes, and it must describe the
 * box the image is PAINTED into, not the source. The widths below are read off
 * the Tailwind classes at each call site; if you change a card's width, change
 * it here too or the browser will keep picking the old candidate.
 *
 * `quality` stays >= 65 — this is a premium plant brand and the images are the
 * product. Every value used here must also appear in `images.qualities` in
 * next.config.ts, or Next 16 answers the request with a 400.
 */
const VARIANTS = {
  /** phone product card — w-[165px] (storefront/pah/product-card.tsx) */
  'product-card': { sizes: '165px', quality: 65 },
  /** phone verticals rail tile — h-[96px] w-[150px] (pah/verticals-rail.tsx) */
  'vertical-tile': { sizes: '150px', quality: 65 },
  /** phone "why plants" card — w-[168px], image box h-[124px] (pah/why-plants.tsx) */
  'why-card': { sizes: '168px', quality: 65 },
  /** category circle — h-16 w-16 on phone, ~125px in the desktop grid */
  'category-circle': { sizes: '(max-width: 768px) 64px, 125px', quality: 65 },
  /** phone collections tile — h-[180px] w-[140px] (pah/collections.tsx) */
  'collection-tile': { sizes: '140px', quality: 65 },
  /** desktop verticals band — w-[72%] sm:44% md:36% lg:auto (home/verticals-band.tsx) */
  'vertical-band': {
    sizes: '(max-width: 640px) 72vw, (max-width: 768px) 44vw, (max-width: 1024px) 36vw, 320px',
    quality: 70,
  },
  /** full-width marketing band (gifting, why-plants backdrop) */
  banner: { sizes: '(max-width: 1024px) 100vw, 44vw', quality: 70 },
  /** header/footer brand lockup — painted at 160x44 */
  logo: { sizes: '160px', quality: 75 },
} as const;

export type ImageVariant = keyof typeof VARIANTS;

/**
 * A next/image that FAILS GRACEFULLY and carries the right `sizes`/`quality`.
 *
 * On a load error, or when `src` is empty, it renders `fallback` (any node —
 * this is how the SVG placeholders and icon spans stay OUT of the optimizer,
 * which rejects SVG without `dangerouslyAllowSVG`), else `fallbackSrc`, else
 * nothing — never a broken-image box.
 *
 * Lazy by default, which is what makes the hidden half of the dual homepage
 * tree stop downloading: `display:none` gives a lazy image no intersection box.
 * Pass `priority` only for something genuinely in the first viewport.
 */
export default function SafeImage({
  variant,
  fallback,
  fallbackSrc,
  ...props
}: ImageProps & {
  variant?: ImageVariant;
  fallback?: ReactNode;
  fallbackSrc?: string;
}) {
  const [errored, setErrored] = useState(false);

  const missing = !props.src || props.src === '';
  if (missing || (errored && !fallbackSrc)) return <>{fallback ?? null}</>;

  const preset = variant ? VARIANTS[variant] : undefined;

  return (
    <Image
      {...props}
      // After the spread, so the resolution is unambiguous: an explicitly
      // passed sizes/quality wins, otherwise the variant preset applies.
      sizes={props.sizes ?? preset?.sizes}
      quality={props.quality ?? preset?.quality}
      src={errored && fallbackSrc ? fallbackSrc : props.src}
      onError={() => setErrored(true)}
    />
  );
}
