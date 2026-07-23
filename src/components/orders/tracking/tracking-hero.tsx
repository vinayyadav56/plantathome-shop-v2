import { Image } from '@/components/ui/image';
import Link from '@/components/ui/link';
import { Routes } from '@/config/routes';

/**
 * Full-bleed hero for the tracking page: breadcrumb, page title and a soft
 * botanical photo bleeding in from the right (hidden on small screens).
 */
export default function TrackingHero({ trackingNumber }: { trackingNumber?: string }) {
  return (
    <section className="relative overflow-hidden bg-[#F1EFE6]">
      <div className="absolute inset-y-0 right-0 hidden w-[46%] md:block">
        <Image
          src="/plants-2.jpg"
          alt="Potted plants on a wooden shelf"
          fill
          priority
          sizes="(max-width: 768px) 0px, 46vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F1EFE6] via-[#F1EFE6]/45 to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-[1280px] px-4 pb-10 pt-5 sm:px-6 md:pb-14">
        <nav aria-label="Breadcrumb" className="mb-8 md:mb-10">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-[#8C8A81]">
            <li>
              <Link href={Routes.home} className="transition-colors hover:text-forest-900">
                Home
              </Link>
            </li>
            <li aria-hidden="true">&rsaquo;</li>
            <li>
              <Link href={Routes.orders} className="transition-colors hover:text-forest-900">
                My Orders
              </Link>
            </li>
            <li aria-hidden="true">&rsaquo;</li>
            <li className="font-medium text-forest-900">
              Order #{trackingNumber ?? ''}
            </li>
          </ol>
        </nav>

        <h1 className="text-4xl font-semibold tracking-tight text-forest-900 sm:text-5xl">
          Track Your Order
        </h1>
        <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-[#6F6D64]">
          We&rsquo;re carefully packing your greens and getting them ready to reach you.
        </p>
        <span className="mt-5 block h-[3px] w-10 rounded-full bg-[var(--ds-accent,#4E8B31)]" />
      </div>
    </section>
  );
}
