import React, { FC } from 'react';

type EmptyCartProps = {
  width?: number;
  height?: number;
  className?: string;
};

/**
 * Empty-cart mark for the checkout order summary.
 *
 * Was a 232x292 Pickbazar illustration with a linearGradient and three literal
 * teal greens (#029477 -> #009e7f, #006854), which ignored currentColor and the
 * brand palette entirely. Redrawn on the 120 illustration grid using the same
 * ramp tones as the other empty states, so the two read as one family.
 *
 * Keeps its width/height props: call sites pass width={100} height={120}.
 */
const EmptyCart: FC<EmptyCartProps> = ({ width = 120, height = 144, className }) => (
  <svg
    width={width}
    height={height}
    className={className}
    viewBox="0 0 120 144"
    fill="none"
    aria-hidden
    focusable="false"
  >
    {/* basket */}
    <path
      d="M24 56h72l-7 56a10 10 0 0 1-10 9H41a10 10 0 0 1-10-9L24 56Z"
      fill="#E9E3D6"
      stroke="#C9B79A"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <rect x="20" y="48" width="80" height="12" rx="4" fill="#D7C9AE" stroke="#C9B79A" strokeWidth="2.5" />
    {/* handles */}
    <path
      d="M44 48V34a16 16 0 0 1 32 0v14"
      stroke="#C9B79A"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* a single sprig resting inside, so the empty state still reads as a plant shop */}
    <path d="M60 104c0-13-6-21-17-24 0 12 6 20 17 24Z" fill="#8FAE80" />
    <path d="M60 104c0-16 7-25 20-28 0 14-7 23-20 28Z" fill="#6E8B4A" />
    <path d="M60 82v22" stroke="#2E5E2A" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export default EmptyCart;
