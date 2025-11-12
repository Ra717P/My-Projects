// /components/Navbar.tsx
"use client";
import Link from "next/link";
import CartIcon from "@/components/CartIcon";

export default function Navbar() {
  return (
    // fixed + full width + safe-area top (untuk iOS)
    <header className="fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        {/* Samakan font dengan hero: Dancing Script */}
        <Link
          href="/"
          className="font-dancing text-xl sm:text-2xl leading-none"
        >
          Sisi Kopi
        </Link>

        <nav className="flex items-center gap-3">
          <Link href="/menu" className="hover:underline">
            Menu
          </Link>
          <CartIcon />
        </nav>
      </div>
      {/* Safe area padding untuk notch */}
      <div className="pt-[env(safe-area-inset-top)]" />
    </header>
  );
}
