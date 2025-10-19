"use client";
import { createContext, useState } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const addToCart = (item) => setCart([...cart, item]);
  const clearCart = () => setCart([]);
  const totalPrice = cart.reduce((acc, item) => acc + item.price, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, clearCart, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};
