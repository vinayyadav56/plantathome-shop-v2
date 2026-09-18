'use client';
import React, { useRef, useState } from 'react';
import { PlantMark } from '@/components/storefront/logo-mark';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from '@/components/ui/icon';

type GalleryImage = { original?: string; thumbnail?: string; id?: string | number };

type Props = {
  gallery: GalleryImage[];
  productName: string;
  /* passed by plantathome-details; unused here (V1 shipped the same) */
  productId?: any;
  badge?: string | null;
  /* rendered INSIDE the image box (bottom-left is free: arrows are
     edge-centred, wishlist is top-right) — the parent's own absolute overlay
     would land on the thumbnail strip below the image instead. */
  overlay?: React.ReactNode;
};

const PlantAtHomeGallery: React.FC<Props> = ({ gallery, productName, overlay }) => {
  const images = (gallery?.length ? gallery : [{ original: '', thumbnail: '' }]) as GalleryImage[];
  const [active, setActive] = useState(0);
  const [err, setErr] = useState<Record<number, boolean>>({});
  const touchX = useRef<number | null>(null);

  // Wraps both ways, so neither arrow is ever a dead end.
  const go = (delta: number) =>
    setActive((i) => (i + delta + images.length) % images.length);

  const mainSrc = images[active]?.original || images[active]?.thumbnail || '';
  // Every image gets a thumb — the strip scrolls (max-h + overflow-y below).
  const thumbs = images;

  // FIXED height at lg (not h-auto) on the IMAGE BOX: the media column must
  // not stretch to match the right column — opening the pot rail made the
  // object-cover image blow up/distort (worst in the quick-view modal).
  // self-start on the root keeps that true with the thumb strip below.
  return (
    <div className="w-full self-start">
      <div className="relative h-[300px] w-full sm:h-[380px] lg:h-[620px]">
      {/* Full rectangular image — no decorative curve/border, fills the right side.
          All gallery images are stacked + preloaded, so switching thumbnails is an
          instant opacity swap (no reload flash / fluctuation). */}
      <div
        className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#E9F0E2] via-[#F1F3E8] to-[#F6F2E6]"
        // Swipe to change photo on touch devices. Plain touch handlers rather
        // than a carousel library: the images are already stacked and
        // cross-faded, so all a swipe has to do is move an index.
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          const start = touchX.current;
          touchX.current = null;
          if (start === null || images.length < 2) return;
          const dx = e.changedTouches[0].clientX - start;
          // 40px threshold — below that it's a tap or a vertical scroll that
          // drifted sideways, not a deliberate swipe.
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        {images.map((img, i) => {
          const src = img.original || img.thumbnail || '';
          if (!src || err[i]) return null;
          return (
            <Image
              key={img.id ?? i}
              src={src}
              alt={productName}
              fill
              priority={i === 0}
              sizes="(max-width:1024px) 100vw, 55vw"
              onError={() => setErr((e) => ({ ...e, [i]: true }))}
              className={`object-cover object-center transition-opacity duration-300 ${i === active ? 'opacity-100' : 'opacity-0'}`}
            />
          );
        })}
        {(!mainSrc || err[active]) && (
          <span className="absolute inset-0 grid place-items-center px-6 text-center font-poppins text-2xl font-semibold text-forest-800/40">
            {productName}
          </span>
        )}
      </div>

      {/* Prev / next — centred on each edge of the image, the placement the
          annotations asked for (possible now that the thumb strip lives BELOW
          the image instead of overlaying its left edge). Shown on touch and
          pointer alike: swiping is invisible affordance, and on desktop there
          is nothing to swipe with. */}
      {images.length > 1 && (
        <>
          {(['prev', 'next'] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => go(dir === 'prev' ? -1 : 1)}
              aria-label={dir === 'prev' ? 'Previous image' : 'Next image'}
              className={`absolute top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-white/85 text-forest-900 shadow-[0_6px_16px_-6px_rgba(34,48,26,0.5)] backdrop-blur-md transition hover:bg-white sm:h-10 sm:w-10 ${
                dir === 'prev' ? 'left-2 sm:left-4' : 'right-2 sm:right-4'
              }`}
            >
              {dir === 'prev' ? <ChevronLeft size={18} aria-hidden /> : <ChevronRight size={18} aria-hidden />}
            </button>
          ))}
        </>
      )}
      {overlay}
      </div>

      {/* Horizontal thumbnail strip UNDER the image (annotation: thumbs must
          not overlay the photo). Scrolls sideways for many-image products;
          shrink-0 keeps thumbs square inside the scroll row. */}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:gap-3">
          {thumbs.map((img, i) => {
            const src = img.thumbnail || img.original || '';
            return (
              <button
                key={img.id ?? i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white shadow-[0_8px_20px_-8px_rgba(34,48,26,0.4)] transition lg:h-[68px] lg:w-[68px] ${
                  active === i
                    ? 'ring-2 ring-forest-600 ring-offset-2 ring-offset-[#F4F1E6]'
                    : 'opacity-90 hover:opacity-100'
                }`}
              >
                {src ? (
                  <Image src={src} alt={`${productName} — photo ${i + 1}`} fill sizes="68px" className="object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-forest-700/30"><PlantMark className="h-4 w-4" /></span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Photography disclaimer. Sits under the thumbnail strip so it reads as
          a caption on the whole gallery, and lives HERE rather than in
          plantathome-details so it cannot drift away from the images it is
          about — the quick-view modal renders this same component.
          Kept deliberately generic: this gallery serves pots, tools and farm
          boxes as well as plants, so it must not promise plant-specific
          variation. */}
      <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
        Actual product may vary slightly from the images shown.
      </p>
    </div>
  );
};

export default PlantAtHomeGallery;
