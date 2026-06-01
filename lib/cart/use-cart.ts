'use client';

import { useContext } from 'react';
import { CartContext, type CartContextValue } from './provider';
import { emptyCart } from './operations';
import { countItems } from './operations';

/**
 * Returns the cart context. Falls back to a read-only no-op shape when
 * called outside a `<CartProvider>` (e.g. during SSR or in isolated
 * Storybook stories) so components don't crash.
 */
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (ctx) return ctx;
  const cart = emptyCart();
  return {
    cart,
    itemCount: countItems(cart),
    addBundle: () => {},
    addProduct: () => {},
    removeItem: () => {},
    updateQty: () => {},
    clearCart: () => {},
  };
}
