"use client";

import Link from "next/link";

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category?: string | null;
  image_url?: string | null;
  description?: string | null;
  is_available?: boolean | null;
};

export default function MenuTable({
  items,
  onDelete,
}: {
  items: MenuItem[];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b">
          <tr>
            <th className="p-3">Nama</th>
            <th className="p-3">Kategori</th>
            <th className="p-3">Harga</th>
            <th className="p-3">Status</th>
            <th className="p-3">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-b last:border-b-0">
              <td className="p-3">{it.name}</td>
              <td className="p-3">{it.category ?? "-"}</td>
              <td className="p-3">{it.price}</td>
              <td className="p-3">
                {it.is_available ? "Available" : "Hidden"}
              </td>
              <td className="p-3">
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/menu/${it.id}`}
                    className="rounded-lg border px-3 py-1 hover:bg-gray-50"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => onDelete(it.id)}
                    className="rounded-lg border px-3 py-1 hover:bg-gray-50"
                  >
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="p-3 text-gray-500">
                Belum ada menu.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
