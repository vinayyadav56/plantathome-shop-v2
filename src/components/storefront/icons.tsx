import type { SVGProps } from 'react';

// Inline single-colour SVG icon set for the PlantAtHome storefront.
type P = SVGProps<SVGSVGElement>;
const s = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const Icon = {
  leaf: (p: P) => (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  ),
  truck: (p: P) => (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <path d="M5 17H3V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v3" />
      <polygon points="9 17 9 11 19 11 22 14 22 17 9 17" />
      <circle cx="13.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  shield: (p: P) => (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  star: (p: P) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  arrow: (p: P) => (
    <svg viewBox="0 0 24 24" {...s} strokeWidth={2} {...p}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  bag: (p: P) => (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  menu: (p: P) => (
    <svg viewBox="0 0 24 24" {...s} strokeWidth={2} {...p}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  x: (p: P) => (
    <svg viewBox="0 0 24 24" {...s} strokeWidth={2} {...p}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  play: (p: P) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  ),
  droplet: (p: P) => (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <path d="M12 2.7s6 5.7 6 10.3a6 6 0 0 1-12 0c0-4.6 6-10.3 6-10.3Z" />
    </svg>
  ),
  sun: (p: P) => (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" />
    </svg>
  ),
  spark: (p: P) => (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />
    </svg>
  ),
  quote: (p: P) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M7 7h4v6a4 4 0 0 1-4 4v-2a2 2 0 0 0 2-2H7V7Zm8 0h4v6a4 4 0 0 1-4 4v-2a2 2 0 0 0 2-2h-2V7Z" />
    </svg>
  ),
  user: (p: P) => (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </svg>
  ),
  truckFast: (p: P) => (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7" />
      <circle cx="7.5" cy="18.5" r="1.5" />
      <circle cx="17.5" cy="18.5" r="1.5" />
    </svg>
  ),
  lock: (p: P) => (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  ),
  chevron: (p: P) => (
    <svg viewBox="0 0 24 24" {...s} strokeWidth={2} {...p}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  heart: (p: P) => (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  ),
  plus: (p: P) => (
    <svg viewBox="0 0 24 24" {...s} strokeWidth={2} {...p}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  search: (p: P) => (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  // ── thin botanical/benefit line icons (no emoji, per the design system) ──
  wind: (p: P) => (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
      <path d="M17.7 8a2.5 2.5 0 1 1 1.8 4.3H2" />
    </svg>
  ),
  moon: (p: P) => (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  ),
  home: (p: P) => (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  ),
  zap: (p: P) => (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  ),
  sprout: (p: P) => (
    <svg viewBox="0 0 24 24" {...s} {...p}>
      <path d="M12 21v-9" />
      <path d="M12 12c0-3.3-2.7-6-6-6 0 3.3 2.7 6 6 6Z" />
      <path d="M12 11c0-3.3 2.7-6 6-6 0 3.3-2.7 6-6 6Z" />
    </svg>
  ),
};
