"use client";
import { useContext, useMemo, useState } from "react";
import { CartContext } from "@/context/CartContext";
import Script from "next/script";

// Helper: normalisasi harga (terima number atau string "Rp 20.000")
function toNumberIDR(value) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  // buang "Rp", titik pemisah, spasi, dll
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
    // fallback
    return `Rp${(num || 0).toLocaleString("id-ID")}`;
  }
}

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);

  // Hitung total yang konsisten
  const computedTotal = useMemo(() => {
    if (typeof totalPrice === "number" && totalPrice > 0) return totalPrice;
    return cart.reduce((acc, item) => {
      const price = toNumberIDR(item.price);
      const qty = item.quantity ?? 1;
      return acc + price * qty;
    }, 0);
  }, [cart, totalPrice]);

  const displayCart = useMemo(
    () =>
      cart.map((item) => ({
        id: item.id,
        name: item.name,
        priceNumber: toNumberIDR(item.price),
        priceDisplay: formatIDR(toNumberIDR(item.price)),
        quantity: item.quantity ?? 1,
        image: item.image ?? null,
        category: item.category ?? null,
      })),
    [cart]
  );

  const handleCheckout = async () => {
    if (!cart.length) {
      alert("Keranjang masih kosong.");
      return;
    }

    setLoading(true);
    try {
      // Payload rapi dan konsisten
      const payload = {
        items: displayCart.map((it) => ({
          id: it.id,
          name: it.name,
          price: it.priceNumber, // number (IDR)
          quantity: it.quantity,
          subtotal: it.priceNumber * it.quantity,
        })),
        total: computedTotal, // integer IDR (tanpa desimal)
        currency: "IDR",
        // customer (opsional):
        // customer: { first_name: "Budi", email: "budi@example.com", phone: "08123456789" },
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Gagal membuat pesanan.");
      }

      const data = await res.json(); // { token, redirect_url, orderId }
      // Tampilkan popup Snap
      if (typeof window !== "undefined" && window.snap && data?.token) {
        window.snap.pay(data.token, {
          onSuccess: () => {
            alert("Pembayaran sukses!");
            clearCart();
            // window.location.href = `/order/success?order_id=${data.orderId}`;
          },
          onPending: () => {
            alert("Transaksi pending. Silakan selesaikan pembayaran.");
            // window.location.href = `/order/pending?order_id=${data.orderId}`;
          },
          onError: (error) => {
            console.error(error);
            alert("Terjadi kesalahan pembayaran.");
          },
          onClose: () => {
            console.log("Popup pembayaran ditutup oleh pengguna.");
          },
        });
      } else if (data?.redirect_url) {
        // Fallback ke redirect jika snap belum ready
        window.location.href = data.redirect_url;
      } else {
        throw new Error("Snap belum siap atau token tidak tersedia.");
      }
    } catch (e) {
      console.error(e);
      alert(e?.message || "Terjadi kesalahan saat checkout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-10">
      {/* Script Snap Midtrans */}
      <Script
        src={
          process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL ||
          "https://app.sandbox.midtrans.com/snap/snap.js"
        }
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
        onLoad={() => console.log("Midtrans Snap loaded")}
      />

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
                      {item.quantity} × {item.priceDisplay}
                    </p>
                  </div>
                </div>
                <div className="font-semibold">
                  {formatIDR(item.priceNumber * item.quantity)}
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
            {loading ? "Memproses..." : "Bayar Sekarang"}
          </button>
        </>
      )}
    </div>
  );
}
