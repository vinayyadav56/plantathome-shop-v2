import { Icon } from '../icons';
import { FadeUp, WordReveal } from '../motion';

const BENEFITS = [
  {
    icon: Icon.wind,
    title: 'Air purification',
    text: 'Plants naturally filter toxins and lift oxygen levels, keeping your space fresh and clean.',
  },
  {
    icon: Icon.sprout,
    title: 'Stress reduction',
    text: 'Time spent tending to plants lowers cortisol by up to 37%. Nature heals.',
  },
  {
    icon: Icon.moon,
    title: 'Better sleep',
    text: 'Bedroom plants like lavender and peace lily create a calmer atmosphere for deeper rest.',
  },
  {
    icon: Icon.home,
    title: 'Living décor',
    text: 'Transform any space instantly. Plants add colour, texture and organic warmth to interiors.',
  },
  {
    icon: Icon.zap,
    title: 'Productivity boost',
    text: 'Greenery improves focus and creativity by 15%. Work smarter, surrounded by green.',
  },
];

export function Benefits() {
  return (
    <section id="benefits" className="bg-cream-50">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        {/* centered editorial intro */}
        <div className="mx-auto max-w-2xl text-center">
          <FadeUp>
            <span className="inline-flex items-center gap-2 rounded-full bg-sage-100 px-4 py-1.5 font-display text-[11px] font-medium uppercase tracking-[0.28em] text-forest-700">
              <Icon.leaf className="h-3.5 w-3.5" /> Science-backed benefits
            </span>
          </FadeUp>
          <h2 className="mt-5 font-serif text-4xl font-semibold leading-[1.05] text-forest-900 sm:text-5xl">
            <WordReveal text="Why every home needs " />
            <span className="text-forest-700">plants</span>
          </h2>
          <FadeUp delay={0.1}>
            <p className="mx-auto mt-4 max-w-xl text-[17px] leading-7 text-stone-600">
              Beyond beauty — plants actively improve your air quality, mental
              health, and daily life.
            </p>
          </FadeUp>
        </div>

        {/* benefit cards */}
        <div className="pah-rail [--rail-w:78%] sm:[--rail-w:46%] lg:[--rail-w:calc((100%_-_80px)/5)] mt-12 grid grid-cols-1 gap-5 sm:mt-14">
          {BENEFITS.map((b, i) => (
            <FadeUp key={b.title} delay={(i % 5) * 0.06}>
              <div className="group flex h-full flex-col items-center rounded-lg border border-kraft-200 bg-white p-6 text-center shadow-[0_2px_8px_rgba(34,48,26,0.06)] transition-shadow hover:shadow-[0_8px_24px_rgba(34,48,26,0.10)]">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-sage-100 text-forest-700 transition-colors group-hover:bg-forest-700 group-hover:text-white">
                  <b.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-serif text-xl font-semibold text-forest-900">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">{b.text}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
