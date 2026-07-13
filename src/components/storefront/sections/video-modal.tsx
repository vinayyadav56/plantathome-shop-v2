import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../icons';
import { KenBurns, EXPO } from '../motion';

/** Fullscreen "tour" lightbox — cinematic Ken-Burns walkthrough + caption. */
export function VideoModal({
  open,
  onClose,
  scenes,
  title,
  subtitle,
}: {
  open: boolean;
  onClose: () => void;
  scenes: string[];
  title: string;
  subtitle: string;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[90] grid place-items-center bg-deep/80 p-4 backdrop-blur-md sm:p-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5, ease: EXPO }}
            onClick={(e) => e.stopPropagation()}
            className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-2xl bg-black shadow-2xl"
          >
            <KenBurns images={scenes} interval={4} />
            <div className="absolute inset-0 bg-gradient-to-t from-deep/85 via-transparent to-deep/30" />

            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
              aria-label="close"
            >
              <Icon.x className="h-5 w-5" />
            </button>

            <div className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-8">
              <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur">
                <Icon.play className="h-3 w-3" /> The tour
              </span>
              <h3 className="font-heading text-2xl font-black text-white drop-shadow sm:text-3xl">
                {title}
              </h3>
              <p className="mt-1 max-w-md text-sm text-white/80">{subtitle}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
