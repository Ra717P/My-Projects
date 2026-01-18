// components/admin/TransaksiTable.tsx
"use client";

type Order = {
  id: string;
  created_at?: string;
  status?: string;
  total_amount?: number;
  customer_name?: string | null;
};

type Item = {
  id: string;
  order_id: string;
  qty?: number;
  price?: number;
  name?: string;
};

export default function TransaksiTable({
  orders,
  items,
}: {
  orders: Order[];
  items: Item[];
}) {
  const itemsByOrder = new Map<string, Item[]>();
  for (const it of items) {
    const arr = itemsByOrder.get(it.order_id) ?? [];
    arr.push(it);
    itemsByOrder.set(it.order_id, arr);
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="rounded-xl border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-semibold">Order #{o.id}</div>
              <div className="text-xs text-gray-500">
                {o.created_at ?? "-"} • {o.status ?? "-"}
              </div>
            </div>
            <div className="text-sm">
              Total:{" "}
              <span className="font-semibold">{o.total_amount ?? "-"}</span>
            </div>
          </div>

          <div className="mt-3">
            <div className="text-sm font-medium">Items</div>
            <ul className="mt-1 list-disc pl-5 text-sm text-gray-700">
              {(itemsByOrder.get(o.id) ?? []).map((it) => (
                <li key={it.id}>
                  {it.name ?? "Item"} x{it.qty ?? 1} (price: {it.price ?? "-"})
                </li>
              ))}
              {(itemsByOrder.get(o.id) ?? []).length === 0 && (
                <li className="text-gray-500">Tidak ada item.</li>
              )}
            </ul>
          </div>
        </div>
      ))}

      {orders.length === 0 && (
        <div className="rounded-xl border bg-white p-4 text-sm text-gray-500">
          Belum ada transaksi.
        </div>
      )}
    </div>
  );
}
