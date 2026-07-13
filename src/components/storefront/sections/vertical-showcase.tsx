import Link from 'next/link';
import { motion } from 'framer-motion';
import { FadeUp, WordReveal, ClipReveal } from '../motion';
import { Icon } from '../icons';
import { getVerticalMeta } from '../verticals';
import { useTypes } from '@/framework/type';
import { TYPES_PER_PAGE } from '@/framework/client/variables';

/** Home-only — introduces the brand's worlds (data-driven from API types). */
export function VerticalShowcase() {
  const { types } = useTypes({ limit: TYPES_PER_PAGE });
  const list = types ?? [];
  if (list.length === 0) return null;

  const homeSlug =
    list.find((t) => t?.settings?.isHome)?.slug ?? list[0]?.slug;

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:py-24">
        <div className="mb-8 text-center sm:mb-12">
          <FadeUp>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-gold">
              One home, three worlds
            </p>
          </FadeUp>
          <h2 className="mx-auto max-w-2xl font-serif text-4xl font-semibold leading-tight text-forest sm:text-5xl lg:text-6xl">
            <WordReveal text="Everything to grow your green life." />
          </h2>
        </div>

        <div className="pah-rail [--rail-w:84%] sm:[--rail-w:60%] lg:[--rail-w:calc((100%_-_40px)/3)] grid gap-4 sm:gap-5">
          {list.map((t, i) => {
            const meta = getVerticalMeta(t.slug, t.name);
            const href = t.slug === homeSlug ? '/' : `/${t.slug}`;
            return (
              <ClipReveal key={t.slug} delay={i * 0.08}>
                <Link href={href}>
                  <motion.div
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="group relative h-80 overflow-hidden rounded-[1.6rem]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={meta.scenes[0]}
                      alt={t.name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/25 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                      <h3 className="font-heading text-2xl font-black">{t.name}</h3>
                      <p className="mt-1 max-w-xs text-sm text-white/80">
                        {meta.tagline}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-goldlight">
                        Explore {t.name}{' '}
                        <Icon.arrow className="h-4 w-4 transition group-hover:translate-x-1" />
                      </span>
                    </div>
                  </motion.div>
                </Link>
              </ClipReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
