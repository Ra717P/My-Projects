"use client";

type Row = {
  order_id: string;
  created_at: string;
  status: string;
  total: number;
  customer_phone: string | null;
  note: string | null;
  items: any[]; // jsonb array
};

export default function TransaksiList({ rows }: { rows: Row[] }) {
  return (
    <div className="space-y-3">
      {rows.map((o) => (
        <div key={o.order_id} className="rounded-xl border bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-semibold">Order #{o.order_id}</div>
              <div className="text-xs text-gray-500">
                {o.created_at} • {o.status}
              </div>
              <div className="mt-1 text-sm text-gray-700">
                Total: <span className="font-semibold">{o.total}</span>
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
            <ul className="mt-1 list-disc pl-5 text-sm text-gray-700">
              {(o.items ?? []).length === 0 && (
                <li className="text-gray-500">Tidak ada item.</li>
              )}
              {(o.items ?? []).map((it: any, idx: number) => (
                <li key={it.id ?? idx}>
                  {it.name ?? it.menu_name ?? "Item"}{" "}
                  {it.qty ? `x${it.qty}` : it.quantity ? `x${it.quantity}` : ""}
                  {it.price ? ` (price: ${it.price})` : ""}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}

      {rows.length === 0 && (
        <div className="rounded-xl border bg-white p-4 text-sm text-gray-500">
          Belum ada transaksi.
        </div>
      )}
    </div>
  );
}
