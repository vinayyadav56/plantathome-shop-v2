import React from 'react';

/**
 * Shared inline line icons (lucide-style strokes). The storefront used to lean
 * on Font Awesome <i> classes, but the FA stylesheet is never loaded in the
 * App Router build, so every one of those rendered as an invisible box —
 * replace any `fa-solid` usage with these.
 */
const PATHS: Record<string, React.ReactNode> = {
  leaf: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </>
  ),
  lotus: (
    <>
      <path d="M12 20c-1.8-1.5-3-3.8-3-6.5C9 10 10.5 7 12 5c1.5 2 3 5 3 8.5 0 2.7-1.2 5-3 6.5z" />
      <path d="M12 20c-3.6.4-6.8-.8-9-3 1.6-1 3.6-1.6 5.7-1.5" />
      <path d="M12 20c3.6.4 6.8-.8 9-3-1.6-1-3.6-1.6-5.7-1.5" />
    </>
  ),
  menu: (
    <>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </>
  ),
  cart: (
    <>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
    </>
  ),
  arrowRight: (
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </>
  ),
  droplet: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />,
  truck: (
    <>
      <path d="M1 3h15v13H1z" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </>
  ),
  language: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>
  ),
  check: <polyline points="20 6 9 17 4 12" />,
};

export function LineIcon({
  name,
  className = 'h-4 w-4',
  strokeWidth = 1.9,
}: {
  name: keyof typeof PATHS | string;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {PATHS[name] ?? PATHS.leaf}
    </svg>
  );
}

export default LineIcon;
