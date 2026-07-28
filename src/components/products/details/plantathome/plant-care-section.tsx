'use client';
import React, { useState } from 'react';
import { LineIcon } from '@/components/icons/line-icons';

/** Extract a YouTube video id from watch/embed/shorts/youtu.be URLs. */
function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/,
  );
  return m ? m[1] : null;
}

/** Skip empty-ish admin values ("none") without inventing content. */
const real = (v?: string | null) =>
  v && String(v).trim() && String(v).trim().toLowerCase() !== 'none'
    ? String(v).trim()
    : null;

/** Click-to-play YouTube embed — iframe only mounts after a click (client
 *  state starts false, so SSR markup and first paint are identical). */
function VideoBlock({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const id = youtubeId(url);

  if (!id) {
    // Non-YouTube video: plain external link row.
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-8 inline-flex items-center gap-2.5 rounded-[14px] border border-[#ECECEC] bg-white px-5 py-3.5 text-sm font-semibold text-[#184A31] transition hover:border-[#14532D]/40"
      >
        <LineIcon name="play" className="h-4 w-4 text-[#24693E]" />
        Watch the plant video
        <LineIcon name="external" className="h-4 w-4 text-[#8A8A8A]" />
      </a>
    );
  }

  return (
    <div className="mt-8 overflow-hidden rounded-[22px] border border-[#ECECEC] bg-white shadow-[0_4px_10px_rgba(0,0,0,0.04),0_20px_40px_rgba(0,0,0,0.08)]">
      <div className="relative aspect-video w-full bg-stone-100">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
            title="Plant video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label="Play plant video"
            className="group absolute inset-0 h-full w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              alt="Plant video preview"
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 bg-black/20 transition group-hover:bg-black/30" />
            <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#14532D] shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition group-hover:scale-105">
              <LineIcon name="play" className="ml-1 h-6 w-6" strokeWidth={2.2} />
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * "Plant care & details" — full-width section (parent provides the container):
 * LEFT = sanitized description html + benefits/medicinal paragraphs,
 * RIGHT = spec label/value rows + air-purifying/pet-friendly chips,
 * BELOW = click-to-play product video. Null when there is nothing to show.
 * `contentHtml` MUST already be sanitized by the caller (useSanitizeContent).
 */
export function PlantCareSection({
  product,
  contentHtml,
}: {
  product: any;
  contentHtml: string | null;
}) {
  const pa = product?.plant_attribute ?? {};

  const specs: { label: string; value: string }[] = (
    [
      { label: 'Sunlight', value: real(pa.sunlight) },
      { label: 'Water', value: real(pa.water_requirement) },
      {
        label: 'Temperature',
        value: real(pa.temperature_range)
          ? `${real(pa.temperature_range)} °C`
          : null,
      },
      { label: 'Placement', value: real(pa.indoor_outdoor) },
      { label: 'Height', value: real(pa.height_range) },
      { label: 'Life span', value: real(pa.life_span) },
      { label: 'Growth rate', value: real(pa.growth_rate) },
      { label: 'Flowering season', value: real(pa.flowering_season) },
      { label: 'Native region', value: real(pa.native_region) },
      { label: 'Hindi name', value: real(pa.hindi_name) },
      {
        label: 'Scientific name',
        value: real(pa.scientific_name ?? product?.scientific_name),
      },
    ] as { label: string; value: string | null }[]
  ).filter((s): s is { label: string; value: string } => Boolean(s.value));

  const benefits = real(pa.benefits);
  const medicinal = real(pa.medicinal_uses);
  const airPurifying = Boolean(pa.air_purifying);
  const petFriendly = Boolean(pa.pet_friendly);
  const videoUrl: string | undefined = product?.video?.[0]?.url;

  const hasLeft = Boolean(contentHtml || benefits || medicinal);
  const hasRight = specs.length > 0 || airPurifying || petFriendly;

  if (!hasLeft && !hasRight && !videoUrl) return null;

  return (
    <div>
      <h2 className="text-[15px] font-bold uppercase tracking-[0.08em] text-[#184A31]">
        Plant care &amp; details
      </h2>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:gap-10">
        {/* LEFT — full description + benefits/medicinal */}
        {hasLeft && (
          <div className="min-w-0">
            {contentHtml && (
              <div
                className="react-editor-description text-[13.5px] leading-6 text-[#5B5B5B]"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            )}
            {(benefits || medicinal) && (
              <div className={`${contentHtml ? 'mt-5' : ''} space-y-4`}>
                {benefits && (
                  <div className="rounded-[14px] bg-[#F3F8EC] p-5">
                    <h3 className="text-sm font-bold text-[#184A31]">Benefits</h3>
                    <p className="mt-1.5 text-sm leading-6 text-[#5B5B5B]">
                      {benefits}
                    </p>
                  </div>
                )}
                {medicinal && (
                  <div className="rounded-[14px] bg-[#F3F8EC] p-5">
                    <h3 className="text-sm font-bold text-[#184A31]">
                      Medicinal uses
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-[#5B5B5B]">
                      {medicinal}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* RIGHT — spec rows + badges */}
        {hasRight && (
          <div className="min-w-0">
            <div className="rounded-[22px] border border-[#ECECEC] bg-white p-5 shadow-[0_4px_10px_rgba(0,0,0,0.04),0_20px_40px_rgba(0,0,0,0.08)]">
              {specs.length > 0 && (
                <dl>
                  {specs.map((s) => (
                    <div
                      key={s.label}
                      className="flex items-baseline justify-between gap-4 border-b border-[#ECECEC] py-2.5 first:pt-0 last:border-0 last:pb-0"
                    >
                      <dt className="shrink-0 text-[13.5px] text-[#8A8A8A]">
                        {s.label}
                      </dt>
                      <dd className="text-right text-[14px] font-semibold text-[#184A31]">
                        {s.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {(airPurifying || petFriendly) && (
                <div
                  className={`flex flex-wrap gap-2 ${specs.length > 0 ? 'mt-4' : ''}`}
                >
                  {airPurifying && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F8EC] px-3.5 py-1.5 text-xs font-semibold text-[#24693E]">
                      <LineIcon name="leaf" className="h-3.5 w-3.5" /> Air purifying
                    </span>
                  )}
                  {petFriendly && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F8EC] px-3.5 py-1.5 text-xs font-semibold text-[#24693E]">
                      <LineIcon name="shield" className="h-3.5 w-3.5" /> Pet friendly
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {videoUrl && <VideoBlock url={videoUrl} />}
    </div>
  );
}

export default PlantCareSection;
