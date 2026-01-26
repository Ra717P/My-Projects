"use client";

import { formatIDR } from "@/lib/currency";

type OrderItem = {
  id?: string | number;
  qty?: number | null;
  quantity?: number | null;
  price?: number | null;
  menu?: { id?: string | number; name?: string | null } | null;

  // fallback kalau struktur lama masih ada
  name?: string | null;
  menu_name?: string | null;
};

type Row = {
  id: string | number;
  order_id?: string | number | null; // kalau ada
  order_code?: string | null; // kalau ada
  created_at?: string | null;
  status?: string | null;
  total?: number | null;
  customer_phone?: string | null;
  note?: string | null;
  items?: OrderItem[] | null;
};

function formatDate(s?: string | null) {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString("id-ID");
}

export default function TransaksiList({ rows }: { rows: Row[] }) {
  return (
    <div className="space-y-3">
      {rows.map((o) => {
        const label = o.order_code ?? o.order_id ?? o.id;
        const items = o.items ?? [];

        return (
          <div key={o.id} className="rounded-xl border bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold">Order #{label}</div>

                <div className="text-xs text-gray-500">
                  {formatDate(o.created_at)} {o.status ? `• ${o.status}` : ""}
                </div>

                <div className="mt-1 text-sm text-gray-700">
                  Total:{" "}
                  <span className="font-semibold">
                    {formatIDR(Number(o.total ?? 0))}
                  </span>
                </div>

                {o.customer_phone && (
                  <div className="text-sm text-gray-700">
                    Phone: {o.customer_phone}
                  </div>
                )}

                {o.note && (
                  <div className="text-sm text-gray-700">Note: {o.note}</div>
                )}
              </div>
            </div>

            <div className="mt-3">
              <div className="text-sm font-medium">Items</div>

              {items.length === 0 ? (
                <div className="mt-1 text-sm text-gray-500">
                  Tidak ada item.
                </div>
              ) : (
                <ul className="mt-1 list-disc pl-5 text-sm text-gray-700">
                  {items.map((it, idx) => {
                    const name =
                      it.menu?.name ?? it.menu_name ?? it.name ?? "Item";
                    const qty = it.qty ?? it.quantity ?? 1;
                    const price = it.price ?? 0;

                    return (
                      <li key={it.id ?? `${o.id}-${idx}`}>
                        {name} x{qty} • {formatIDR(Number(price))}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        );
      })}

      {rows.length === 0 && (
        <div className="rounded-xl border bg-white p-4 text-sm text-gray-500">
          Belum ada transaksi.
        </div>
      )}
    </div>
  );
}
