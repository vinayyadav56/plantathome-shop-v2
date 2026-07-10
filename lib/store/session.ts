'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionUser } from '@/lib/api/types';

/** A pending add-to-cart intent, stashed when an anonymous user hits "add" so we
 *  can replay it after login (one clean cart write). */
export type PendingCartIntent = {
  variant_uuid: string;
  nursery_id: string;
  selection: Record<string, string[]>;
  qty: number;
  city: string | null;
  slug: string;
};

type SessionState = {
  user: SessionUser | null;
  ready: boolean; // silent-refresh boot has completed
  city: string | null; // selected city uuid (persisted)
  cityName: string | null;
  pendingCart: PendingCartIntent | null;
  setUser: (u: SessionUser | null) => void;
  setReady: (r: boolean) => void;
  setCity: (uuid: string | null, name: string | null) => void;
  setPendingCart: (p: PendingCartIntent | null) => void;
};

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      ready: false,
      city: null,
      cityName: null,
      pendingCart: null,
      setUser: (user) => set({ user }),
      setReady: (ready) => set({ ready }),
      setCity: (city, cityName) => set({ city, cityName }),
      setPendingCart: (pendingCart) => set({ pendingCart }),
    }),
    {
      name: 'pah-session',
      // Persist only the durable prefs — never the user object (comes from /auth/me).
      partialize: (s) => ({ city: s.city, cityName: s.cityName, pendingCart: s.pendingCart }),
    },
  ),
);
