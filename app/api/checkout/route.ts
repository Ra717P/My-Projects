// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireEnv(name: string, v?: string) {
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

const SUPABASE_URL = requireEnv(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

const SERVICE_KEY = requireEnv(
  "SUPABASE_SERVICE_ROLE_KEY",
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

type CheckoutItem = { menu_item_id: number | string; qty: number };
type CheckoutBody = {
  customer_phone?: string | null;
  note?: string | null;
  items: CheckoutItem[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as CheckoutBody | null;
    if (!body) {
      return NextResponse.json({ error: "Body JSON invalid" }, { status: 400 });
    }

    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json({ error: "Items kosong" }, { status: 400 });
    }

    // validasi qty & kumpulkan menu ids
    const menuIds = items
      .map((it) => it?.menu_item_id)
      .filter((x) => x !== null && x !== undefined);

    for (const it of items) {
      const q = Number(it.qty);
      if (!Number.isFinite(q) || q <= 0) {
        return NextResponse.json({ error: "qty harus > 0" }, { status: 400 });
      }
    }

    // ambil harga asli dari menu_items
    const { data: menus, error: menuErr } = await supabase
      .from("menu_items")
      .select("id,price,name")
      .in("id", menuIds);

    if (menuErr) {
      return NextResponse.json({ error: menuErr.message }, { status: 500 });
    }

    const menuMap = new Map<any, number>();
    (menus ?? []).forEach((m: any) => menuMap.set(m.id, Number(m.price ?? 0)));

    const orderItemsRows = items.map((it) => {
      const price = menuMap.get(it.menu_item_id);
      if (price === undefined) {
        throw new Error(
          `Menu tidak ditemukan untuk id: ${String(it.menu_item_id)}`,
        );
      }
      return {
        menu_item_id: it.menu_item_id,
        qty: Number(it.qty),
        price: Number(price),
      };
    });

    const total = orderItemsRows.reduce((s, r) => s + r.price * r.qty, 0);

    // insert order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        customer_phone: body.customer_phone ?? null,
        note: body.note ?? null,
        status: "PENDING",
        total,
      })
      .select("id")
      .single();

    if (orderErr) {
      return NextResponse.json({ error: orderErr.message }, { status: 500 });
    }

    // insert order items
    const rowsWithOrderId = orderItemsRows.map((r) => ({
      ...r,
      order_id: order.id,
    }));

    const { error: itemsErr } = await supabase
      .from("order_items")
      .insert(rowsWithOrderId);

    if (itemsErr) {
      // rollback: hapus order jika item gagal
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json({ error: itemsErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, order_id: order.id });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 },
    );
  }
}
