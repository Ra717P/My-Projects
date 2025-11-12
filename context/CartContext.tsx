// /context/CartContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MenuItem } from "@/types/menu"; // <- TYPE, bukan dari /data/menu

type CartItem = MenuItem & { qty: number };

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: MenuItem, qty?: number) => void;
  removeFromCart: (id: MenuItem["id"]) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "sk_cart_v1";

export const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // parser aman untuk localStorage
  const safeParse = <T,>(json: string | null, fallback: T): T => {
    try {
      return json ? (JSON.parse(json) as T) : fallback;
    } catch {
      return fallback;
    }
  };

  // Hydrate dari localStorage (client-only)
  useEffect(() => {
    const raw =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const initial = safeParse<CartItem[]>(raw, []);
    setCart(initial);
  }, []);

  // Simpan ke localStorage ketika cart berubah
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore quota / privacy mode errors
    }
  }, [cart]);

  const addToCart = (item: MenuItem, qty = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
        return copy;
      }
      return [...prev, { ...item, qty }];
    });
  };

  const removeFromCart = (id: MenuItem["id"]) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  };

  const clearCart = () => setCart([]);

  const value = useMemo(
    () => ({ cart, addToCart, removeFromCart, clearCart }),
    [cart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
