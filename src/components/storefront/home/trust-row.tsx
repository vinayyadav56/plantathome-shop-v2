'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { EXPO } from '@/components/storefront/motion';
import { Heart, MessageCircle, Package, ShieldCheck } from '@/components/ui/icon';

const ITEMS: { title: string; sub: string; icon: JSX.Element }[] = [
  {
    title: '100% Quality Assured',
    sub: 'Only healthy & handpicked plants',
    icon: <ShieldCheck size={20} aria-hidden />,
  },
  {
    title: 'Secure Packaging',
    sub: 'Safe delivery to your doorstep',
    icon: <Package size={20} aria-hidden />,
  },
  {
    title: 'Loved by 10,000+',
    sub: 'Happy plant parents',
    icon: <Heart size={20} aria-hidden />,
  },
  {
    title: 'Expert Guidance',
    sub: 'Helping you at every step',
    icon: <MessageCircle size={20} aria-hidden />,
  },
];

export function TrustRow() {
  return (
    <section className="font-hanken">
      <motion.div
        initial={{ y: 24 }}
        whileInView={{ y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: EXPO }}
        className="relative border-t border-kraft-300/70 bg-[#F0EDE4] py-5 lg:py-6"
      >
        <div className="relative mx-auto grid max-w-none grid-cols-2 gap-6 px-5 sm:px-8 lg:grid-cols-4 lg:gap-0 lg:px-16">
          {ITEMS.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ y: 18 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.09, duration: 0.5, ease: EXPO }}
              className="relative flex items-center gap-3.5 lg:px-5"
            >
              {/* vertical divider between items on desktop */}
              {i > 0 && (
                <div className="absolute inset-y-0 left-0 hidden w-px bg-gradient-to-b from-transparent via-forest-900/10 to-transparent lg:block" />
              )}

              {/* icon chip — white on the tinted band so it still lifts */}
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-forest-700 shadow-[0_2px_8px_rgba(34,48,26,0.08)]">
                {it.icon}
              </div>

              {/* text */}
              <div className="min-w-0">
                <div className="text-[14.5px] font-bold leading-[1.2] text-forest-900">
                  {it.title}
                </div>
                <div className="mt-0.5 text-[12px] leading-[1.4] text-stone-500">
                  {it.sub}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

export default TrustRow;
