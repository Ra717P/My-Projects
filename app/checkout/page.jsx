"use client";

import { useContext, useMemo, useState } from "react";
import { CartContext } from "@/context/CartContext";

// Helper: normalisasi harga (terima number atau string "Rp 20.000")
function toNumberIDR(value) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const clean = String(value).replace(/[^0-9]/g, "");
  return Number(clean || 0);
}

// Helper: format ke Rupiah "Rp20.000"
function formatIDR(num) {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(num);
  } catch {
    return `Rp${(num || 0).toLocaleString("id-ID")}`;
  }
}

export default function CheckoutPage() {
  const { cart, clearCart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);

  // Total dihitung dari cart (pakai qty dari CartContext)
  const computedTotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = toNumberIDR(item.price);
      const qty = item.qty ?? 1;
      return acc + price * qty;
    }, 0);
  }, [cart]);

  // Data tampilan
  const displayCart = useMemo(
    () =>
      cart.map((item) => {
        const priceNumber = toNumberIDR(item.price);
        const qty = item.qty ?? 1;

        return {
          id: item.id,
          name: item.name,
          priceNumber,
          priceDisplay: formatIDR(priceNumber),
          qty,
          image: item.image ?? null,
        };
      }),
    [cart]
  );

  const handleCheckout = async () => {
    if (!cart.length) {
      alert("Keranjang masih kosong.");
      return;
    }

    setLoading(true);
    try {
      // Payload untuk backend (backend tetap ambil harga asli dari Supabase)
      const payload = {
        items: displayCart.map((it) => ({
          id: it.id,
          qty: it.qty,
        })),
        total: computedTotal,
        currency: "IDR",
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Gagal membuat pesanan.");
      }

      // Karena sekarang "langsung sukses"
      alert(`Pembayaran sukses!\nOrder: ${data?.orderId || "-"}`);
      clearCart();

      // Optional redirect:
      // window.location.href = `/order/success?order_id=${data.orderId}`;
    } catch (e) {
      console.error("[checkout] error:", e);
      alert(e?.message || "Terjadi kesalahan saat checkout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-10">
      <h2 className="text-2xl font-semibold mb-6">Checkout</h2>

      {!cart.length ? (
        <p className="text-gray-600">Keranjang kosong.</p>
      ) : (
        <>
          <ul className="divide-y divide-gray-200">
            {displayCart.map((item, idx) => (
              <li
                key={`${item.id}-${idx}`}
                className="py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-md"
                    />
                  ) : null}
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.qty} × {item.priceDisplay}
                    </p>
                  </div>
                </div>
                <div className="font-semibold">
                  {formatIDR(item.priceNumber * item.qty)}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between">
            <p className="font-semibold text-lg">Total</p>
            <p className="font-bold text-lg">{formatIDR(computedTotal)}</p>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="mt-6 bg-[#d4a373] px-6 py-3 rounded-lg text-white font-semibold hover:bg-[#c08b5a] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Memproses..." : "Konfirmasi Pembayaran"}
          </button>
        </>
      )}
    </div>
  );
}
