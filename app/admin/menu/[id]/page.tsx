"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import MenuForm from "@/components/admin/MenuForm";

export default function AdminEditMenuPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [initial, setInitial] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/menu/${id}`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(json.error ?? "Gagal load data menu");
      setLoading(false);
      return;
    }
    setInitial(json.data ?? json.item ?? json);
    setLoading(false);
  }

  async function update(payload: any) {
    const res = await fetch(`/api/admin/menu/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json.error ?? "Gagal update menu");
      return;
    }

    alert("Menu berhasil diupdate");
    router.push("/admin/menu");
    router.refresh();
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Edit Menu</h1>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}

      {!loading && initial && (
        <MenuForm
          initial={initial}
          submitLabel="Simpan Perubahan"
          onSubmit={update}
        />
      )}
    </div>
  );
}
