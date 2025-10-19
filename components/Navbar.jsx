// components/Navbar.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // tutup menu mobile saat pindah halaman
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href) => pathname === href;

  const NavLink = ({ href, children, onClick }) => (
    <Link
      href={href}
      onClick={onClick}
      className={`transition ${
        isActive(href) ? "text-white" : "text-white/80 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-[#4A2C2A] shadow-sm">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-3">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-1 select-none text-white"
        >
          <span className="text-lg leading-none">☕</span>
          <span className="font-dancing text-3xl leading-none">Sisi Kopi</span>
        </Link>

        {/* Links - DESKTOP */}
        <div className="hidden md:flex items-center gap-4 text-[20px]">
          <NavLink href="/">Beranda</NavLink>
          <NavLink href="/menu">Menu</NavLink>
          <NavLink href="/cart">Keranjang</NavLink>
          <NavLink href="/contact">Kontak</NavLink>
        </div>

        {/* Toggle - MOBILE */}
        <button
          className="md:hidden text-white text-2xl p-1 -mr-1"
          aria-label="Buka menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Drawer - MOBILE */}
      {open && (
        <div className="md:hidden border-t border-white/15 bg-[#4A2C2A]">
          <div className="mx-auto max-w-6xl px-3 py-3">
            <ul className="flex flex-col gap-3 text-white text-[18px]">
              <li>
                <NavLink href="/" onClick={() => setOpen(false)}>
                  Beranda
                </NavLink>
              </li>
              <li>
                <NavLink href="/menu" onClick={() => setOpen(false)}>
                  Menu
                </NavLink>
              </li>
              <li>
                <NavLink href="/cart" onClick={() => setOpen(false)}>
                  Keranjang
                </NavLink>
              </li>
              <li>
                <NavLink href="/contact" onClick={() => setOpen(false)}>
                  Kontak
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
}
