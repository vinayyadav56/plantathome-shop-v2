'use client';
import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Sprout } from '@/components/ui/icon';

type GalleryImage = { original?: string; thumbnail?: string; id?: string | number };

type Props = {
  gallery: GalleryImage[];
  productName: string;
  /* passed by plantathome-details; unused here (V1 shipped the same) */
  productId?: any;
  badge?: string | null;
};

const PlantAtHomeGallery: React.FC<Props> = ({ gallery, productName }) => {
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

  // FIXED height at lg (not h-auto): the media column must not stretch to
  // match the right column — opening the pot rail made the object-cover
  // image blow up/distort (worst in the quick-view modal).
  return (
    <div className="relative h-[300px] w-full self-start sm:h-[380px] lg:h-[620px]">
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

      {/* vertical thumbnail strip — outer (left) side.
          The 68px thumb upsize happens at lg, NOT sm: the container is only
          380px tall from sm to lg, and several thumbs at 68px + gaps + top
          offset spilled past the gallery onto the content below. At lg the
          container is ≥620px and 68px fits. max-h + overflow-y keeps
          many-image products scrolling inside the strip. */}
      <div className="absolute left-3 top-5 z-10 flex max-h-[calc(100%-2.5rem)] flex-col gap-2 overflow-y-auto sm:left-6 sm:top-10 lg:gap-3">
        {thumbs.map((img, i) => {
          const src = img.thumbnail || img.original || '';
          return (
            <button
              key={img.id ?? i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-white shadow-[0_8px_20px_-8px_rgba(34,48,26,0.4)] transition lg:h-[68px] lg:w-[68px] ${
                active === i
                  ? 'ring-2 ring-forest-600 ring-offset-2 ring-offset-[#F4F1E6]'
                  : 'opacity-90 hover:opacity-100'
              }`}
            >
              {src ? (
                <Image src={src} alt={`${productName} — photo ${i + 1}`} fill sizes="68px" className="object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center text-forest-700/30"><Sprout size={16} aria-hidden /></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Prev / next — paired in the bottom-right rather than the usual
          centred-on-each-edge placement, because the thumbnail rail owns the
          left edge at every breakpoint and a centred left arrow would sit on
          top of it. Shown on touch and pointer alike: swiping is invisible
          affordance, and on desktop there is nothing to swipe with. */}
      {images.length > 1 && (
        <div className="absolute bottom-4 right-3 z-10 flex gap-2 sm:bottom-6 sm:right-6">
          {(['prev', 'next'] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => go(dir === 'prev' ? -1 : 1)}
              aria-label={dir === 'prev' ? 'Previous image' : 'Next image'}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/40 bg-white/85 text-forest-900 shadow-[0_6px_16px_-6px_rgba(34,48,26,0.5)] backdrop-blur-md transition hover:bg-white sm:h-10 sm:w-10"
            >
              {dir === 'prev' ? <ChevronLeft size={18} aria-hidden /> : <ChevronRight size={18} aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlantAtHomeGallery;
