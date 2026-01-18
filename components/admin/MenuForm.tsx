"use client";

import { useState } from "react";

type MenuPayload = {
  name: string;
  category: string;
  price: number;
  image_url?: string | null;
  description?: string | null;
  is_available: boolean;
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
  const [category, setCategory] = useState(initial?.category ?? "Signature");
  const [price, setPrice] = useState<number>(initial?.price ?? 0);
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isAvailable, setIsAvailable] = useState<boolean>(
    initial?.is_available ?? true
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      name,
      category,
      price,
      image_url: imageUrl || null,
      description: description || null,
      is_available: isAvailable,
    });
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border bg-white p-4"
    >
      <div>
        <label className="text-sm">Nama</label>
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm">Kategori</label>
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm">Harga</label>
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
      </div>

      <div>
        <label className="text-sm">Image URL</label>
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="text-sm">Deskripsi</label>
        <textarea
          className="mt-1 w-full rounded-lg border px-3 py-2"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isAvailable}
          onChange={(e) => setIsAvailable(e.target.checked)}
        />
        Available
      </label>

      <button
        disabled={loading}
        className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {loading ? "Menyimpan..." : submitLabel}
      </button>
    </form>
  );
}
