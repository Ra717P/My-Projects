"use client";

import { useEffect, useState } from "react";
import TransaksiList from "@/components/admin/TransaksiList";

export default function AdminTransaksiPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    const res = await fetch("/api/admin/transaksi", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setErr(json.error ?? "Gagal ambil transaksi");
      setRows([]);
      return;
    }

    setRows(json.data ?? json.rows ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Transaksi</h1>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <TransaksiList rows={rows} />
    </div>
  );
}
