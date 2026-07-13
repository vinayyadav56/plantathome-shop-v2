import { Icon } from '../icons';
import { FadeUp, WordReveal } from '../motion';

const TESTIMONIALS = [
  {
    name: 'Ananya R.',
    city: 'Bengaluru',
    quote:
      'My living room finally feels alive. The Monstera arrived bigger and healthier than I imagined.',
    img: '/images/people/t1.jpg',
  },
  {
    name: 'Rohan M.',
    city: 'Mumbai',
    quote:
      'Packaging was unreal — not a single leaf bent. This is how premium plant delivery should feel.',
    img: '/images/people/t2.jpg',
  },
  {
    name: 'Priya S.',
    city: 'Delhi',
    quote:
      'The care guide and reminders kept my brown thumb in check. Everything is thriving months later.',
    img: '/images/people/t3.jpg',
  },
];

export function Testimonials() {
  return (
    <section
      id="reviews"
      className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:py-20"
    >
      <FadeUp>
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.25em] text-gold">
          Reviews
        </p>
      </FadeUp>
      <h2 className="mx-auto mb-10 max-w-2xl text-center font-cormorant text-4xl font-semibold not-italic text-forest sm:mb-14 sm:text-5xl lg:text-6xl">
        <WordReveal text="Plant parents, in their words" />
      </h2>
      <div className="pah-rail [--rail-w:82%] md:[--rail-w:55%] lg:[--rail-w:calc((100%_-_48px)/3)] grid gap-4 md:gap-6">
        {TESTIMONIALS.map((t, i) => (
          <FadeUp key={t.name} delay={i * 0.08}>
            <div className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-[0_22px_50px_rgba(31,42,33,0.08)] sm:p-7">
              <Icon.quote className="h-8 w-8 text-goldlight" />
              <p className="mt-4 flex-1 text-[15px] leading-7 text-[#3a4a3e]">
                “{t.quote}”
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-[#eee7d8] pt-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.img}
                  alt={t.name}
                  loading="lazy"
                  className="h-11 w-11 rounded-full object-cover"
                />
                <div>
                  <div className="text-sm font-bold text-forest">{t.name}</div>
                  <div className="text-xs text-[#8a958c]">{t.city}</div>
                </div>
                <div className="ml-auto flex gap-0.5 text-gold">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Icon.star key={k} className="h-3.5 w-3.5" />
                  ))}
                </div>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}
