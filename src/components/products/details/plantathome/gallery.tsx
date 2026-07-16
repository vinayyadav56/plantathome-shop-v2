'use client';
import React, { useState } from 'react';
import Image from 'next/image';

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

  const mainSrc = images[active]?.original || images[active]?.thumbnail || '';
  const thumbs = images.slice(0, 4);

  return (
    <div className="relative h-[300px] w-full sm:h-[380px] lg:h-auto lg:min-h-[620px]">
      {/* Full rectangular image — no decorative curve/border, fills the right side.
          All gallery images are stacked + preloaded, so switching thumbnails is an
          instant opacity swap (no reload flash / fluctuation). */}
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#E9F0E2] via-[#F1F3E8] to-[#F6F2E6]">
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

      {/* vertical thumbnail strip — outer (left) side */}
      <div className="absolute left-3 top-5 z-10 flex flex-col gap-2 sm:left-6 sm:top-10 sm:gap-3">
        {thumbs.map((img, i) => {
          const src = img.thumbnail || img.original || '';
          return (
            <button
              key={img.id ?? i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={`relative h-11 w-11 overflow-hidden rounded-2xl bg-white shadow-[0_8px_20px_-8px_rgba(34,48,26,0.4)] transition sm:h-[68px] sm:w-[68px] ${
                active === i
                  ? 'ring-2 ring-forest-600 ring-offset-2 ring-offset-[#F4F1E6]'
                  : 'opacity-90 hover:opacity-100'
              }`}
            >
              {src ? (
                <Image src={src} alt="" fill sizes="68px" className="object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center text-forest-700/30">🌿</span>
              )}
            </button>
          );
        })}

        <button
          type="button"
          aria-label="360 degree view"
          className="grid h-11 w-11 place-items-center rounded-2xl bg-forest-900 text-white shadow-[0_8px_20px_-8px_rgba(34,48,26,0.5)] transition hover:bg-forest-800 sm:h-[68px] sm:w-[68px]"
        >
          <span className="flex flex-col items-center gap-0.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v4h4" />
            </svg>
            <span className="text-[7px] font-semibold leading-none sm:text-[7.5px]">360° View</span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default PlantAtHomeGallery;
