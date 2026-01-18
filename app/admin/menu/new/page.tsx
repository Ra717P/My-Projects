"use client";

import { useRouter } from "next/navigation";
import MenuForm from "@/components/admin/MenuForm";

export default function AdminNewMenuPage() {
  const router = useRouter();

  async function create(payload: any) {
    const res = await fetch("/api/admin/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json.error ?? "Gagal tambah menu");
      return;
    }

    alert("Menu berhasil ditambah");
    router.push("/admin/menu");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Tambah Menu</h1>
      <MenuForm submitLabel="Tambah Menu" onSubmit={create} />
    </div>
  );
}
