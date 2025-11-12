"use client";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import type { MenuItem } from "@/types/menu";

export function AddToCartButton({
  item,
  className = "",
  label = "Tambah ke Keranjang",
}: {
  item: MenuItem;
  className?: string;
  label?: string;
}) {
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);

  const onAdd = () => {
    setLoading(true);
    try {
      addToCart(item);
      toast.success(`${item?.name ?? "Produk"} ditambahkan ke keranjang`, {
        description: "Lihat keranjang untuk checkout.",
        action: {
          label: "Buka Keranjang",
          onClick: () => (window.location.href = "/cart"),
        },
      });
    } catch {
      toast.error("Gagal menambah ke keranjang");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onAdd}
      disabled={loading}
      className={`bg-[#d4a373] text-white px-4 py-2 rounded-lg hover:bg-[#c08b5a] transition disabled:opacity-60 ${className}`}
    >
      {loading ? "Menambahkan..." : label}
    </button>
  );
}
