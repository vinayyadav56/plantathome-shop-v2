import React, { useCallback } from 'react';
import { cartReducer, State, initialState } from './cart.reducer';
import { Item, getItem, inStock } from './cart.utils';
import { CART_KEY } from '@/lib/constants';
import { useAtom } from 'jotai';
import { verifiedResponseAtom } from '@/store/checkout';
import { authorizationAtom } from '@/store/authorization-atom';
import { getServerCart, saveServerCart } from '@/framework/server-cart';
interface CartProviderState extends State {
  addItemsToCart: (items: Item[]) => void;
  addItemToCart: (item: Item, quantity: number) => void;
  removeItemFromCart: (id: Item['id']) => void;
  clearItemFromCart: (id: Item['id']) => void;
  getItemFromCart: (id: Item['id']) => any | undefined;
  isInCart: (id: Item['id']) => boolean;
  isInStock: (id: Item['id']) => boolean;
  resetCart: () => void;
  updateCartLanguage: (language: string) => void;
}
export const cartContext = React.createContext<CartProviderState | undefined>(
  undefined
);

cartContext.displayName = 'CartContext';

export const useCart = () => {
  const context = React.useContext(cartContext);
  if (context === undefined) {
    throw new Error(`useCart must be used within a CartProvider`);
  }
  return React.useMemo(() => context, [context]);
};

export const CartProvider: React.FC<{ children?: React.ReactNode }> = (
  props
) => {
  // Start from the SSR-consistent EMPTY state so the server HTML and the first client render
  // match. The cart is then rehydrated from localStorage AFTER mount. (Previously the reducer
  // seeded itself from localStorage synchronously, so every SSR-rendered cart-dependent node —
  // e.g. a product card's "in cart" vs "add" state — diverged from the client and threw React
  // hydration errors #418/#423/#425 on every page.)
  const [state, dispatch] = React.useReducer(cartReducer, initialState);
  const [hydrated, setHydrated] = React.useState(false);
  const [, emptyVerifiedResponse] = useAtom(verifiedResponseAtom);
  const [isAuthorized] = useAtom(authorizationAtom);
  const syncedRef = React.useRef(false);
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rehydrate the persisted cart once, after mount.
  React.useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(CART_KEY) : null;
      let saved: any = raw ? JSON.parse(raw) : null;
      // Tolerate the previous double-encoded format (react-use stored JSON.stringify(string)).
      if (typeof saved === 'string') saved = JSON.parse(saved);
      if (saved?.items?.length) {
        dispatch({ type: 'ADD_ITEMS_WITH_QUANTITY', items: saved.items });
      }
    } catch {
      /* ignore a corrupt/legacy cart blob */
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    emptyVerifiedResponse(null);
  }, [emptyVerifiedResponse, state]);

  // Persist — only AFTER rehydration, so the empty initial state can't clobber the stored cart.
  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  // ── Account cart sync (cross-device: web ↔ Android ↔ iOS) ──
  // On sign-in, merge the server cart with the local one (union by line, larger
  // quantity wins) so no device silently loses items; on sign-out, drop the local
  // cart. Client-only + post-hydration, mirroring the localStorage effects above
  // so nothing runs during SSR.
  React.useEffect(() => {
    if (!hydrated) return;
    if (!isAuthorized) {
      // Signed out — reset the just-in-case leftover so the next user starts clean.
      if (syncedRef.current) {
        syncedRef.current = false;
        dispatch({ type: 'RESET_CART' });
      }
      return;
    }
    if (syncedRef.current) return;
    syncedRef.current = true;
    (async () => {
      try {
        const serverItems = await getServerCart();
        const byId = new Map<any, any>();
        for (const it of state.items) byId.set(it.id, { ...it });
        for (const { item, quantity } of serverItems) {
          const ex = byId.get(item.id);
          if (ex) ex.quantity = Math.max(Number(ex.quantity ?? 1), quantity);
          else byId.set(item.id, { ...item, quantity });
        }
        const merged = Array.from(byId.values());
        dispatch({ type: 'RESET_CART' });
        if (merged.length) dispatch({ type: 'ADD_ITEMS_WITH_QUANTITY', items: merged });
        saveServerCart(merged).catch(() => {});
      } catch {
        /* offline / not reachable — keep the local cart */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, isAuthorized]);

  // Debounced push of cart changes to the account cart (only once synced-in).
  React.useEffect(() => {
    if (!hydrated || !isAuthorized || !syncedRef.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveServerCart(state.items as any[]).catch(() => {});
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state.items, hydrated, isAuthorized]);

  const addItemsToCart = (items: Item[]) =>
    dispatch({ type: 'ADD_ITEMS_WITH_QUANTITY', items });
  const addItemToCart = (item: Item, quantity: number) =>
    dispatch({ type: 'ADD_ITEM_WITH_QUANTITY', item, quantity });
  const removeItemFromCart = (id: Item['id']) =>
    dispatch({ type: 'REMOVE_ITEM_OR_QUANTITY', id });
  const clearItemFromCart = (id: Item['id']) =>
    dispatch({ type: 'REMOVE_ITEM', id });
  const isInCart = useCallback(
    (id: Item['id']) => !!getItem(state.items, id),
    [state.items]
  );
  const getItemFromCart = useCallback(
    (id: Item['id']) => getItem(state.items, id),
    [state.items]
  );
  const isInStock = useCallback(
    (id: Item['id']) => inStock(state.items, id),
    [state.items]
  );
  const updateCartLanguage = (language: string) =>
    dispatch({ type: 'UPDATE_CART_LANGUAGE', language });
  const resetCart = () => dispatch({ type: 'RESET_CART' });
  const value = React.useMemo(
    () => ({
      ...state,
      addItemsToCart,
      addItemToCart,
      removeItemFromCart,
      clearItemFromCart,
      getItemFromCart,
      isInCart,
      isInStock,
      resetCart,
      updateCartLanguage,
    }),
    [getItemFromCart, isInCart, isInStock, state]
  );
  return <cartContext.Provider value={value} {...props} />;
};
