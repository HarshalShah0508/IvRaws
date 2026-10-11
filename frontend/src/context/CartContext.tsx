import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../lib/api.ts';
import type { Cart } from '../lib/types.ts';

interface CartContextValue {
  cart: Cart | null;
  itemCount: number;
  refresh: () => Promise<void>;
  addItem: (variantId: string, quantity: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  mergeGuestCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);

  async function refresh() {
    const result = await api.get<Cart>('/cart');
    setCart(result);
  }

  async function addItem(variantId: string, quantity: number) {
    const result = await api.post<Cart>('/cart/items', { variantId, quantity });
    setCart(result);
  }

  async function updateItem(itemId: string, quantity: number) {
    const result = await api.patch<Cart>(`/cart/items/${itemId}`, { quantity });
    setCart(result);
  }

  async function removeItem(itemId: string) {
    const result = await api.delete<Cart>(`/cart/items/${itemId}`);
    setCart(result);
  }

  async function mergeGuestCart() {
    const result = await api.post<Cart>('/cart/merge');
    setCart(result);
  }

  useEffect(() => {
    refresh().catch(() => undefined);
  }, []);

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <CartContext.Provider value={{ cart, itemCount, refresh, addItem, updateItem, removeItem, mergeGuestCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
