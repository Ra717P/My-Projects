"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MenuTable, { MenuItem } from "@/components/admin/MenuTable";
import MenuForm from "@/components/admin/MenuForm";

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);

    const res = await fetch("/api/menu", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setErr(
        json.error ?? "Gagal mengambil menu. Pastikan /api/menu (GET) ada.",
      );
      setItems([]);
      setLoading(false);
      return;
    }

    setItems(json.data ?? json.items ?? []);
    setLoading(false);
  }

  async function onDelete(id: string) {
    const ok = confirm("Yakin hapus menu ini?");
    if (!ok) return;

    const res = await fetch(`/api/admin/menu/${id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json.error ?? "Gagal hapus menu");
      return;
    }

    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Kelola Menu</h1>
        <Link
          href="/admin/menu/new"
          className="rounded-lg bg-black px-4 py-2 text-sm text-white"
        >
          + Tambah Menu
        </Link>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}

      {!loading && !err && <MenuTable items={items} onDelete={onDelete} />}
    </div>
  );
}
