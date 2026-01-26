// components/MenuCard.jsx
"use client";

import Image from "next/image";
import { useContext } from "react";
import { CartContext } from "@/context/CartContext";
import { formatIDR } from "@/lib/currency";

export default function MenuCard({ data }) {
  const { addToCart } = useContext(CartContext) || { addToCart: () => {} };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-3 sm:p-4 flex flex-col">
      {/* Gambar: SQUARE 1:1 (≈800x800) tanpa cropping */}
      <div className="relative w-full aspect-square bg-white">
        <Image
          src={data.image || "/images/placeholder.jpg"}
          alt={data.name}
          fill
          className="object-contain rounded-lg"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          loading="lazy"
        />
      </div>

      {/* Nama & harga */}
      <h3 className="mt-3 text-base sm:text-lg font-semibold leading-snug text-gray-900">
        {data.name}
      </h3>
      <p className="text-sm sm:text-base text-gray-600 mb-3">
        {formatIDR(data.price)}
      </p>

      {/* Tombol: full-width di HP, auto di desktop */}
      <button
        onClick={() => addToCart(data)}
        aria-label={`Tambah ${data.name} ke keranjang`}
        className="mt-auto inline-flex justify-center items-center rounded-lg bg-[#d4a373] text-white px-4 py-2 sm:px-5 sm:py-2.5 hover:opacity-90 active:scale-[0.98] transition w-full sm:w-auto"
      >
        Tambah ke Keranjang
      </button>
    </div>
  );
}
