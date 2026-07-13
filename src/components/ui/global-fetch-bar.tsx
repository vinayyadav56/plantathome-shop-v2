import { useIsFetching, useIsMutating } from 'react-query';
import { useEffect, useRef, useState } from 'react';

/**
 * A slim top-of-page progress bar that animates whenever ANY react-query
 * request (fetch or mutation) is in flight. Gives instant "something is
 * happening" feedback on filter/sort/city changes, add-to-cart, etc. — the
 * storefront previously showed no loader during background refetches, which
 * read as lag. No dependency (uses react-query's own counters); pure
 * width/opacity transition, no keyframes.
 */
export default function GlobalFetchBar() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const active = fetching + mutating > 0;

  // width creeps toward ~90% while active, jumps to 100% then fades on finish.
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const creepRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (active) {
      if (hideRef.current) clearTimeout(hideRef.current);
      setVisible(true);
      setWidth((w) => (w < 15 ? 15 : w));
      creepRef.current = setInterval(() => {
        setWidth((w) => (w >= 90 ? 90 : w + Math.max(0.5, (90 - w) * 0.08)));
      }, 200);
      return () => {
        if (creepRef.current) clearInterval(creepRef.current);
      };
    }
    // finished: fill + fade out
    if (creepRef.current) clearInterval(creepRef.current);
    if (visible) {
      setWidth(100);
      hideRef.current = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 350);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Clear any pending timers on unmount (guards the finished-branch hide timer).
  useEffect(
    () => () => {
      if (creepRef.current) clearInterval(creepRef.current);
      if (hideRef.current) clearTimeout(hideRef.current);
    },
    [],
  );

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px]"
    >
      <div
        className="h-full bg-accent shadow-[0_0_8px_0_var(--color-accent,#2E5E2A)] transition-[width,opacity] duration-300 ease-out"
        style={{ width: `${width}%`, opacity: active ? 1 : 0 }}
      />
    </div>
  );
}
