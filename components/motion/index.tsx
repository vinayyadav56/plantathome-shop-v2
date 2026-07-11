'use client';

import React from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, animate } from 'framer-motion';

// Premium reveal/motion primitives ported from V1.
// Reveals animate on MOUNT (`initial` + `animate`), NOT on viewport entry —
// framer-motion's IntersectionObserver reveals (`whileInView`) don't fire
// reliably on deployed builds, leaving content stuck hidden. Mount-driven
// animation runs deterministically after hydration.

export const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function WordReveal({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={className}>
      {text.split(' ').map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: '115%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.85, delay: delay + i * 0.06, ease: EXPO }}
          >
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export function FadeUp({
  children,
  delay = 0,
  y = 30,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, delay, ease: EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ClipReveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ clipPath: 'inset(100% 0% 0% 0%)', scale: 1.12 }}
      animate={{ clipPath: 'inset(0% 0% 0% 0%)', scale: 1 }}
      transition={{ duration: 1, delay, ease: EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Magnetic({
  children,
  className = '',
  onClick,
  type = 'button',
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 22 });
  const sy = useSpring(y, { stiffness: 300, damping: 22 });
  return (
    <motion.button
      ref={ref}
      type={type}
      style={{ x: sx, y: sy }}
      className={className}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * 0.35);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.35);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.button>
  );
}

export function Marquee({ children, duration = 24 }: { children: React.ReactNode; duration?: number }) {
  return (
    <div className="flex overflow-hidden">
      <motion.div animate={{ x: ['0%', '-50%'] }} transition={{ duration, repeat: Infinity, ease: 'linear' }} className="flex shrink-0">
        {children}
        {children}
      </motion.div>
    </div>
  );
}

export function Counter({
  value,
  divide = 1,
  decimals = 0,
  suffix = '',
}: {
  value: number;
  divide?: number;
  decimals?: number;
  suffix?: string;
}) {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    const c = animate(0, value, { duration: 1.7, ease: EXPO, onUpdate: (x) => setVal(x) });
    return () => c.stop();
  }, [value]);
  return (
    <span>
      {(val / divide).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

const KB_VARIANTS = [
  { scale: [1.08, 1.22], x: ['0%', '-3%'], y: ['0%', '-2%'] },
  { scale: [1.2, 1.06], x: ['-2%', '2%'], y: ['-1%', '1%'] },
  { scale: [1.1, 1.24], x: ['2%', '-1%'], y: ['1%', '-2%'] },
];
export function KenBurns({ images, interval = 6, className = '' }: { images: string[]; interval?: number; className?: string }) {
  const [reduce, setReduce] = React.useState(false);
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    setReduce(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);
  React.useEffect(() => {
    if (reduce || images.length < 2) return;
    const t = setInterval(() => setI((p) => (p + 1) % images.length), interval * 1000);
    return () => clearInterval(t);
  }, [images.length, interval, reduce]);

  if (!images.length) return null;
  if (reduce) {
    return (
      <div
        className={`absolute inset-0 ${className}`}
        style={{ backgroundImage: `url(${images[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
    );
  }
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <AnimatePresence>
        {(() => {
          const kb = KB_VARIANTS[i % KB_VARIANTS.length];
          return (
            <motion.img
              key={i}
              src={images[i]}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
              initial={{ opacity: 0, scale: kb.scale[0], x: kb.x[0], y: kb.y[0] }}
              animate={{ opacity: 1, scale: kb.scale[1], x: kb.x[1], y: kb.y[1] }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: 1.6, ease: 'easeInOut' },
                scale: { duration: interval + 2, ease: 'linear' },
                x: { duration: interval + 2, ease: 'linear' },
                y: { duration: interval + 2, ease: 'linear' },
              }}
            />
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
