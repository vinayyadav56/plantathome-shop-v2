import { FadeUp } from '../motion';
import { Icon } from '../icons';
import type { PromiseItem } from '../verticals';

export function PromiseBand({ items }: { items: PromiseItem[] }) {
  return (
    <section className="bg-gradient-to-b from-[#081209] via-[#0E2415] to-[#081209] py-12 text-white sm:py-16 lg:py-20">
      <div className="pah-rail [--rail-w:80%] md:[--rail-w:55%] lg:[--rail-w:calc((100%_-_64px)/3)] mx-auto grid max-w-7xl gap-5 px-5 sm:px-8 md:gap-8">
        {items.map((b, i) => {
          const I = Icon[b.icon];
          return (
            <FadeUp key={b.t} delay={i * 0.08}>
              <div className="flex flex-col gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-2xl border border-goldlight/20 bg-white/10 text-goldlight">
                  <I className="h-7 w-7" />
                </span>
                <h3 className="font-heading text-xl font-bold text-white">{b.t}</h3>
                <p className="text-sm leading-6 text-white/70">{b.d}</p>
              </div>
            </FadeUp>
          );
        })}
      </div>
    </section>
  );
}
