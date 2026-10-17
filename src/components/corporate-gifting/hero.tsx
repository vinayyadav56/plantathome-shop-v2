'use client';

import Breadcrumb from '@/components/ui/breadcrumb';
import SafeImage from '@/components/ui/safe-image';
import { Routes } from '@/config/routes';
import { BENEFITS, HERO } from './content';

/**
 * The cream hero band (owner's mocks, 2026-10-17). From lg the copy sits in the left 54% of
 * the page grid and the photo fills the right 50% of the SECTION, so it bleeds to the viewport
 * edge and fades in under the copy (the painted wall logo is already cropped out of the file).
 * Below lg the photo comes first, full width, then the copy and a 2×2 benefit grid.
 *
 * ONE photo element for every width — the page's only preloaded image. `h-[min(70vw,280px)]`
 * is the one knob for the phone photo (the mock is taller than the written 175–205px).
 */
export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream-100 lg:min-h-[320px]">
      <div className="relative h-[min(70vw,280px)] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[50%] lg:[mask-image:linear-gradient(to_right,transparent,black_30%)]">
        <SafeImage
          src={HERO.image}
          variant="banner"
          fill
          preload
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover object-[50%_45%] lg:object-[50%_62%]"
          alt={HERO.alt}
        />
      </div>

      {/* `relative` so the copy (later in the DOM) paints above the absolute photo from lg. */}
      <div className="relative mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:py-10">
        {/* 54% + the photo's 50%: the overlap sits inside the photo's faded left 30%. */}
        <div className="lg:w-[54%]">
          {/* Phones skip the visible trail to keep the hero short; the route's BreadcrumbList stays. */}
          <Breadcrumb
            className="mb-4 hidden lg:block"
            items={[{ label: 'Home', href: Routes.home }, { label: 'Corporate Gifting' }]}
          />
          <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.18em] text-forest-700">
            {HERO.eyebrow}
          </p>
          <h1 className="mt-2 font-heading text-[32px] font-medium leading-[1.08] text-forest-900 lg:text-[40px] xl:text-[48px]">
            {HERO.title}
          </h1>
          <p className="mt-3 max-w-[52ch] text-pretty text-[16px] leading-normal text-stone-600">{HERO.sub}</p>

          <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {BENEFITS.map(({ icon: Icon, title }) => (
              <li key={title} className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-forest-700 ring-1 ring-gold">
                  <Icon size={20} aria-hidden />
                </span>
                <span className="text-[13px] font-semibold leading-tight text-forest-900">{title}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
