import { HeadsetIcon, LeafIcon, ShieldCheckIcon, TruckIcon } from './icons';

const USPS = [
  {
    icon: ShieldCheckIcon,
    title: 'Safe & Secure Packaging',
    text: 'We ensure your plants reach you in perfect condition.',
  },
  {
    icon: LeafIcon,
    title: 'Live Plants, Fresh Delivery',
    text: 'Direct from nursery to your home.',
  },
  {
    icon: TruckIcon,
    title: 'Pan India Delivery',
    text: 'Fast and reliable delivery across 500+ cities.',
  },
  {
    icon: HeadsetIcon,
    title: 'Dedicated Support',
    text: 'We’re here to help you at every step.',
  },
];

/** Full-width reassurance band between the tracking content and the footer. */
export default function UspBand() {
  return (
    <section className="border-t border-[#ECEAE1] bg-[#FBFAF6]">
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {USPS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--ds-accent-soft,#EAF4E6)] text-[var(--ds-accent-ink,#2E5E2A)]">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-forest-900">{title}</h4>
              <p className="mt-1 text-[13px] leading-relaxed text-[#8C8A81]">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
