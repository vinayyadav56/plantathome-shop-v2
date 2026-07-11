'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** The cart API returns line items by variant_uuid only (no product name/image).
 *  We record a lightweight snapshot at add-time so the drawer + cart can render
 *  real names/images. Items from a prior device fall back to a generic label. */
export type CartSnap = { name: string; image?: string | null; slug: string; size?: string | null };

type State = {
  snaps: Record<string, CartSnap>;
  record: (variantUuid: string, snap: CartSnap) => void;
};

export const useCartSnaps = create<State>()(
  persist(
    (set) => ({
      snaps: {},
      record: (variantUuid, snap) => set((s) => ({ snaps: { ...s.snaps, [variantUuid]: snap } })),
    }),
    { name: 'pah-cart-snaps' },
  ),
);
