'use client';

import { createContext, useCallback, useEffect, useState } from 'react';
import type { Cart } from './types';
import {
  addBundle as addBundleOp,
  addProduct as addProductOp,
  clearCart as clearCartOp,
  countItems,
  emptyCart,
  removeItem as removeItemOp,
  updateQty as updateQtyOp,
} from './operations';
import { loadCart, saveCart } from './storage';

export interface CartContextValue {
  cart: Cart;
  itemCount: number;
  addBundle: (slug: string) => void;
  addProduct: (sku: string, qty?: number) => void;
  removeItem: (idx: number) => void;
  updateQty: (idx: number, qty: number) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Hydrate from localStorage on mount (client-only). SSR starts with empty.
  const [cart, setCart] = useState<Cart>(() => emptyCart());

  useEffect(() => {
    setCart(loadCart());
  }, []);

  // Persist on every change
  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const addBundle = useCallback(
    (slug: string) => setCart((c) => addBundleOp(c, slug)),
    [],
  );
  const addProduct = useCallback(
    (sku: string, qty = 1) => setCart((c) => addProductOp(c, sku, qty)),
    [],
  );
  const removeItem = useCallback(
    (idx: number) => setCart((c) => removeItemOp(c, idx)),
    [],
  );
  const updateQty = useCallback(
    (idx: number, qty: number) => setCart((c) => updateQtyOp(c, idx, qty)),
    [],
  );
  const clearCart = useCallback(() => setCart((c) => clearCartOp(c)), []);

  // Bridge for the vanilla DOM `clarte:add-bundle` event dispatched by the
  // protocol pages' useEffect-scoped client.tsx (sub-project #5 [[project_runtime_quirks]] §6).
  // The protocol page's existing addBundleToCart function lives in a closure
  // and can't call React hooks; firing a window CustomEvent lets the React
  // layer pick up the same intent and write to the cart Context.
  useEffect(() => {
    function onAddBundle(e: Event) {
      const detail = (e as CustomEvent).detail as { slug?: string } | undefined;
      if (detail?.slug) addBundle(detail.slug);
    }
    function onAddProduct(e: Event) {
      const detail = (e as CustomEvent).detail as { sku?: string; qty?: number } | undefined;
      if (detail?.sku) addProduct(detail.sku, detail.qty ?? 1);
    }
    window.addEventListener('clarte:add-bundle', onAddBundle);
    window.addEventListener('clarte:add-product', onAddProduct);
    return () => {
      window.removeEventListener('clarte:add-bundle', onAddBundle);
      window.removeEventListener('clarte:add-product', onAddProduct);
    };
  }, [addBundle, addProduct]);

  const value: CartContextValue = {
    cart,
    itemCount: countItems(cart),
    addBundle,
    addProduct,
    removeItem,
    updateQty,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
