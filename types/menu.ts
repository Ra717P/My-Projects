// =========================
// File: /types/menu.ts
// =========================

/**
 * Semua kategori menu yang tersedia di kafe
 */
export type MenuCategory =
  | "Signature"
  | "Espresso Based"
  | "Tea"
  | "Flavour"
  | "Mojito Mint"
  | "Milk Based"
  | "Etc";

/**
 * Tipe dasar item menu.
 * Dipakai untuk data menu dan juga keranjang belanja.
 */
export type MenuItem = {
  id: number | string; // ID unik untuk setiap item
  name: string; // Nama menu
  price: number; // Harga dalam IDR (contoh: 22000)
  category: MenuCategory; // Kategori (Signature, Tea, dll)
  image: string; // Path ke gambar (contoh: /images/latte.jpg)
  qty?: number; // Jumlah (digunakan saat di keranjang)
};

/**
 * (Opsional) tipe item di keranjang
 * Jika kamu ingin definisi lebih jelas di CartContext
 */
export type CartItem = MenuItem & {
  qty: number;
};
