"use client";

import { useState } from "react";

export type MenuPayload = {
  name: string;
  category: string | null;
  price: number;
};

export default function MenuForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: Partial<MenuPayload>;
  onSubmit: (payload: MenuPayload) => Promise<void>;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [price, setPrice] = useState<string>(
    initial?.price !== undefined ? String(initial.price) : "",
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await onSubmit({
      name: name.trim(),
      category: category.trim() ? category.trim() : null,
      price: Number(price || 0),
    });

    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border bg-white p-4"
    >
      <div className="space-y-2">
        <label className="text-sm font-medium">Nama</label>
        <input
          className="w-full rounded-lg border px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Nama menu"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Kategori</label>
        <input
          className="w-full rounded-lg border px-3 py-2"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Kategori"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Harga</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
          className="mt-1 w-full rounded-lg border px-3 py-2"
          placeholder="Contoh: 20000"
          required
        />
      </div>

      <button
        disabled={loading}
        className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {loading ? "Menyimpan..." : submitLabel}
      </button>
    </form>
  );
}
