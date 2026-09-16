/**
 * Premium "fly to cart" interaction.
 *
 * Clones the product image and arcs it into the header cart icon with the Web
 * Animations API (smooth ease-out + a slight upward curve + shrink + fade), then
 * pulses the cart badge and reveals the mini-cart. Replaces the old version that
 * depended on `.product-card`/`.product-cart`/`.product-image` classes which the
 * PlantAtHome components don't use — so the animation silently no-op'd and the
 * count just snapped (the "abrupt" feel). This one finds its source + target
 * robustly and degrades gracefully (a count pulse) when no image is available.
 */
function findSourceImage(target: HTMLElement | null): HTMLImageElement | null {
  if (!target) return null;
  const container =
    target.closest<HTMLElement>(
      '[data-product-card], .product-card, article, [class*="group"]',
    ) || target.parentElement;
  const local = container?.querySelector<HTMLImageElement>('img');
  if (local) return local;
  // PDP fallback: the main gallery / detail image.
  return (
    document.querySelector<HTMLImageElement>('[data-product-gallery] img') ||
    document.querySelector<HTMLImageElement>('main img')
  );
}

export const cartAnimation = (event: any) => {
  if (typeof window === 'undefined') return;
  try {
    const target: HTMLElement | null =
      (event?.currentTarget as HTMLElement) ||
      (event?.target as HTMLElement) ||
      null;

    // The header's cart button (data-cart-target). The old floating
    // .product-cart button is gone; no fallback needed — a missing target
    // already degrades to pulse + open drawer below.
    const cart = document.querySelector<HTMLElement>('[data-cart-target]');

    // Always pulse the cart, even if we can't build a flight (graceful fallback).
    const pulse = () =>
      window.dispatchEvent(new CustomEvent('pah-cart-bump'));

    const img = findSourceImage(target);
    const prefersReduced = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    )?.matches;

    if (!img || !cart || prefersReduced || typeof img.animate !== 'function') {
      pulse();
      window.dispatchEvent(new CustomEvent('pah-open-cart'));
      return;
    }

    const from = img.getBoundingClientRect();
    const to = cart.getBoundingClientRect();
    const fromX = from.left;
    const fromY = from.top;
    const toX = to.left + to.width / 2 - from.width / 2;
    const toY = to.top + to.height / 2 - from.height / 2;
    const midX = (fromX + toX) / 2;
    const midY = Math.min(fromY, toY) - 80; // arc up before diving in

    const clone = img.cloneNode(true) as HTMLElement;
    Object.assign(clone.style, {
      position: 'fixed',
      left: `${fromX}px`,
      top: `${fromY}px`,
      width: `${from.width}px`,
      height: `${from.height}px`,
      margin: '0',
      borderRadius: '16px',
      objectFit: 'cover',
      zIndex: '99999',
      pointerEvents: 'none',
      boxShadow: '0 24px 48px -18px rgba(22,48,26,0.45)',
      willChange: 'transform, opacity',
    } as CSSStyleDeclaration);
    document.body.appendChild(clone);

    const anim = clone.animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0 },
        {
          transform: `translate(${midX - fromX}px, ${midY - fromY}px) scale(0.6)`,
          opacity: 0.9,
          offset: 0.55,
        },
        {
          transform: `translate(${toX - fromX}px, ${toY - fromY}px) scale(0.18)`,
          opacity: 0.2,
          offset: 1,
        },
      ],
      { duration: 750, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)', fill: 'forwards' },
    );

    anim.onfinish = () => {
      clone.remove();
      pulse();
      window.dispatchEvent(new CustomEvent('pah-open-cart'));
    };
    // Safety net if onfinish never fires.
    setTimeout(() => clone.isConnected && clone.remove(), 1100);
  } catch {
    window.dispatchEvent(new CustomEvent('pah-cart-bump'));
  }
};
