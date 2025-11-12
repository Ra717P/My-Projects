"use client";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";

export default function CartIcon() {
  const { cart } = useCart();
  const count = cart.reduce((n, item) => n + (item.qty ?? 1), 0);
  const badgeRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!badgeRef.current) return;
    badgeRef.current.classList.remove("animate-ping-once");
    // restart animation
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    badgeRef.current.offsetWidth;
    badgeRef.current.classList.add("animate-ping-once");
  }, [count]);

  return (
    <Link
      href="/cart"
      aria-label={`Keranjang belanja (${count})`}
      className="relative inline-flex items-center justify-center rounded-xl border bg-white/70 backdrop-blur px-3 py-2 shadow-sm hover:shadow transition"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="sr-only">Keranjang</span>
      <span
        ref={badgeRef}
        className="absolute -right-2 -top-2 min-w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] leading-5 grid place-items-center px-1 font-semibold shadow-md animate-ping-once"
      >
        {count}
      </span>

      <style jsx global>{`
        @keyframes ping-once {
          0% {
            transform: scale(0.9);
            opacity: 0.9;
          }
          80% {
            transform: scale(1.15);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-ping-once {
          animation: ping-once 0.35s ease-out 1;
        }
      `}</style>
    </Link>
  );
}
