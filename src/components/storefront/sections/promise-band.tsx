import { FadeUp } from '../motion';
import { Icon } from '../icons';
import type { PromiseItem } from '../verticals';

export function PromiseBand({ items }: { items: PromiseItem[] }) {
  return (
    // Compact (annotation: 60% less height) — icon beside the copy, not above it.
    <section className="bg-gradient-to-b from-[#081209] via-[#0E2415] to-[#081209] py-6 text-white lg:py-8">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="pah-rail [--rail-w:80%] md:[--rail-w:55%] lg:[--rail-w:calc((100%_-_64px)/3)] grid gap-5 md:gap-8">
          {items.map((b, i) => {
            const I = Icon[b.icon];
            return (
              <FadeUp key={b.t} delay={i * 0.08}>
                <div className="flex items-start gap-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-goldlight/20 bg-white/10 text-goldlight">
                    <I className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-heading text-base font-medium leading-snug text-white">{b.t}</h3>
                    <p className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-white/70">{b.d}</p>
                  </div>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}
