'use client';

import { create } from 'zustand';

type DrawerView = 'cart' | 'search' | 'menu' | null;

type DrawerState = {
  open: boolean;
  view: DrawerView;
  /** increments on each add-to-cart so the header badge can replay its bump animation */
  bumpToken: number;
  openCart: () => void;
  openView: (view: DrawerView) => void;
  close: () => void;
  bump: () => void;
};

export const useDrawer = create<DrawerState>((set) => ({
  open: false,
  view: null,
  bumpToken: 0,
  openCart: () => set({ open: true, view: 'cart' }),
  openView: (view) => set({ open: !!view, view }),
  close: () => set({ open: false, view: null }),
  bump: () => set((s) => ({ bumpToken: s.bumpToken + 1 })),
}));
