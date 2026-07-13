import Link from 'next/link';
import { useSettings } from '@/framework/settings';

const DEFAULT_GARDEN_BAND_IMG = '/images/garden/hero.jpg';

/**
 * Homepage CTA band promoting the home-garden service (lead-gen + packages).
 * Links to /garden-service where customers get a free consultation for their
 * curated needs or buy a gardening package.
 */
export function GardenServiceBand() {
  const { settings } = useSettings();
  const gardenImg =
    (settings as any)?.sectionMedia?.gardenBandImage || DEFAULT_GARDEN_BAND_IMG;
  return (
    <section className="px-5 py-10 sm:px-8 lg:py-14">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={gardenImg}
          alt="Home garden built by experts"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#081209]/85 via-[#0E2415]/75 to-[#0E2415]/40" />
        <div className="relative grid items-center gap-6 px-5 py-12 sm:px-12 lg:grid-cols-[1.4fr_1fr] lg:py-16">
          <div className="text-white">
            <span className="inline-flex items-center text-xs font-bold uppercase tracking-[0.22em] text-gold">
              New · Home Garden Service
            </span>
            <h2 className="mt-4 font-cormorant text-4xl font-semibold not-italic leading-tight text-white sm:text-5xl">
              Want a garden built &amp; cared for at home?
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base sm:leading-7">
              Free consultation, then a package tailored to your space — plants, seeds, soil,
              tools and a gardener who visits on schedule. You just enjoy the green.
            </p>
          </div>
          <div className="flex flex-col gap-3.5 sm:flex-row lg:flex-col lg:items-end">
            <Link
              href="/garden-service"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-md bg-goldlight px-7 py-3.5 text-center text-sm font-bold uppercase tracking-[0.14em] text-forest-900 shadow-[0_14px_34px_rgba(8,18,9,0.35)] transition hover:bg-goldlight/90 sm:w-auto"
            >
              Get my free garden plan →
            </Link>
            <Link
              href="/garden-service#quote"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-md border border-white/30 bg-white/10 px-6 py-3.5 text-center text-sm font-semibold uppercase tracking-[0.14em] text-white backdrop-blur transition hover:bg-white/15 sm:w-auto"
            >
              Browse packages
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default GardenServiceBand;
