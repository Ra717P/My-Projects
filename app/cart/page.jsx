// app/cart/page.jsx
"use client";
import { useContext, useMemo } from "react";
import Link from "next/link";
import { CartContext } from "@/context/CartContext";

function toNumberIDR(v) {
  if (typeof v === "number") return v;
  const s = String(v || "").replace(/[^0-9]/g, "");
  return Number(s || 0);
}
function formatIDR(n) {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(n || 0);
  } catch {
    return `Rp${(n || 0).toLocaleString("id-ID")}`;
  }
}

export default function CartPage() {
  const { cart, removeFromCart, addToCart, clearCart } =
    useContext(CartContext);

  const items = useMemo(
    () =>
      cart.map((it) => ({
        id: it.id,
        name: it.name,
        priceNumber: toNumberIDR(it.price),
        priceDisplay: formatIDR(toNumberIDR(it.price)),
        quantity: it.quantity ?? 1,
        image: it.image ?? null,
      })),
    [cart]
  );

  const total = useMemo(
    () => items.reduce((a, b) => a + b.priceNumber * b.quantity, 0),
    [items]
  );

  return (
    // Catatan: kalau main layout-mu sudah kasih padding/container,
    // kamu boleh ganti <div className="container ..."> jadi <section className="space-y-4 sm:space-y-6">
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Keranjang</h1>

      {!items.length ? (
        <p className="text-gray-600">
          Keranjang kosong.{" "}
          <Link href="/menu" className="underline">
            Lihat menu
          </Link>
        </p>
      ) : (
        <>
          <ul className="divide-y divide-gray-200 bg-white rounded-xl border">
            {items.map((it) => (
              <li key={it.id} className="p-3 sm:p-4">
                {/* HP: 2 baris (konten lalu aksi), Desktop: 1 baris */}
                <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
                  {/* Baris 1 (kiri): gambar + nama + qty x harga */}
                  <div className="flex items-center gap-3">
                    {it.image && (
                      <img
                        src={it.image}
                        alt={it.name}
                        className="w-14 h-14 sm:w-12 sm:h-12 object-cover rounded-md"
                        loading="lazy"
                      />
                    )}
                    <div>
                      <p className="font-medium leading-tight">{it.name}</p>
                      <p className="text-sm text-gray-600">
                        {it.quantity} × {it.priceDisplay}
                      </p>
                    </div>
                  </div>

                  {/* Baris 2 (kanan di desktop / bawah di HP): aksi */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => removeFromCart(it.id)}
                      className="px-3 py-2 rounded-lg border hover:bg-gray-50 active:scale-[0.98] transition text-sm sm:text-base"
                    >
                      Hapus
                    </button>
                    <button
                      onClick={() =>
                        addToCart({ ...it, quantity: (it.quantity ?? 1) + 1 })
                      }
                      className="px-3 py-2 rounded-lg border hover:bg-gray-50 active:scale-[0.98] transition text-sm sm:text-base"
                    >
                      +1
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Ringkasan total */}
          <div className="mt-6 flex items-center justify-between">
            <p className="font-semibold text-lg">Total</p>
            <p className="font-bold text-lg">{formatIDR(total)}</p>
          </div>

          {/* Aksi bawah */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={clearCart}
              className="px-4 py-3 rounded-lg border hover:bg-gray-50 active:scale-[0.98] transition"
            >
              Kosongkan
            </button>
            <Link
              href="/checkout"
              className="inline-flex justify-center items-center bg-[#d4a373] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 active:scale-[0.98] transition"
            >
              Lanjut ke Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
