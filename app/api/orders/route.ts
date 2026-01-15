import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("ENV Supabase belum lengkap (URL / SERVICE_ROLE_KEY).");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function fail(step: string, message: string, status = 500, extra?: any) {
  console.error(`[orders][${step}] ${message}`, extra ?? "");
  return json({ ok: false, step, message, extra: extra ?? null }, status);
}

export async function POST(req: Request) {
  let supabase;
  try {
    supabase = supabaseService();
  } catch (e: any) {
    return fail("ENV", e?.message || "Supabase client gagal dibuat");
  }

  let body: any;
  try {
    body = await req.json();
  } catch (e: any) {
    return fail("PARSE_BODY", "Body JSON tidak valid", 400, e?.message);
  }

  // ========== VALIDATE ITEMS ==========
  if (!Array.isArray(body?.items) || body.items.length === 0) {
    return fail(
      "VALIDATE_ITEMS",
      "Items wajib diisi (minimal 1)",
      400,
      body?.items
    );
  }

  type IncomingItem = {
    menuItemId?: number | string;
    id?: number | string;
    menu_item_id?: number | string;
    qty?: number | string;
    quantity?: number | string;
  };

  const itemsReq = (body.items as IncomingItem[]).map((it) => {
    const menuItemId = Number(it.menuItemId ?? it.id ?? it.menu_item_id);
    const qtyRaw = Number(it.qty ?? it.quantity ?? 1);
    const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? Math.round(qtyRaw) : 1;
    return { menuItemId, qty };
  });

  if (
    itemsReq.some((x) => !Number.isInteger(x.menuItemId) || x.menuItemId <= 0)
  ) {
    return fail("VALIDATE_ITEMS", "Ada menuItemId tidak valid", 400, itemsReq);
  }
  if (itemsReq.some((x) => !Number.isInteger(x.qty) || x.qty <= 0)) {
    return fail("VALIDATE_ITEMS", "Ada qty tidak valid", 400, itemsReq);
  }

  // ========== FETCH MENU ==========
  const uniqueIds = Array.from(new Set(itemsReq.map((x) => x.menuItemId)));

  const { data: menuRows, error: menuErr } = await supabase
    .from("menu_items")
    .select("id, name, price")
    .in("id", uniqueIds);

  if (menuErr) {
    return fail("FETCH_MENU", "Gagal mengambil data menu", 500, menuErr);
  }
  if (!menuRows || menuRows.length === 0) {
    return fail(
      "FETCH_MENU",
      "Menu tidak ditemukan (tabel kosong / ID tidak cocok)",
      400,
      { uniqueIds }
    );
  }

  const priceById = new Map<number, number>(
    menuRows.map((m: any) => [Number(m.id), Number(m.price)])
  );
  const nameById = new Map<number, string>(
    menuRows.map((m: any) => [Number(m.id), String(m.name)])
  );

  const missingIds = uniqueIds.filter((id) => !priceById.has(id));
  if (missingIds.length > 0) {
    return fail("FETCH_MENU", "Ada ID menu yang tidak ada di DB", 400, {
      missingIds,
    });
  }

  // ========== CALC TOTAL ==========
  const item_details = itemsReq.map((it) => {
    const price = Math.round(Number(priceById.get(it.menuItemId)));
    const name = (nameById.get(it.menuItemId) ?? `Item ${it.menuItemId}`).slice(
      0,
      50
    );
    return { id: it.menuItemId, name, price, qty: it.qty };
  });

  const invalidPrice = item_details.filter(
    (x) => !Number.isFinite(x.price) || x.price <= 0
  );
  if (invalidPrice.length > 0) {
    return fail(
      "CALC_TOTAL",
      "Ada item dengan harga tidak valid",
      400,
      invalidPrice
    );
  }

  const gross_amount = item_details.reduce(
    (sum, it) => sum + it.price * it.qty,
    0
  );
  if (!Number.isFinite(gross_amount) || gross_amount <= 0) {
    return fail(
      "CALC_TOTAL",
      "Total tidak valid setelah dihitung server",
      400,
      {
        gross_amount,
        item_details,
      }
    );
  }

  // ========== INSERT ORDER ==========
  const customer = body.customer || {};
  const customerName = customer.first_name
    ? `${customer.first_name}${
        customer.last_name ? " " + customer.last_name : ""
      }`
    : body.customerName ?? null;

  // IMPORTANT:
  // - Jangan paksa status "SETTLEMENT" karena kolom status kamu ENUM.
  // - Kalau mau set status sukses, isi ENV ORDER_SUCCESS_STATUS dengan value enum yang valid.
  const orderInsert: any = {
    customer_name: customerName,
    note: body.note || null,
    total: gross_amount,
  };

  if (process.env.ORDER_SUCCESS_STATUS?.trim()) {
    orderInsert.status = process.env.ORDER_SUCCESS_STATUS.trim();
  }

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert(orderInsert)
    .select("*")
    .single();

  if (orderErr || !order) {
    return fail("INSERT_ORDER", "Gagal membuat order", 500, orderErr);
  }

  // ========== INSERT ORDER ITEMS ==========
  const itemsInsert = item_details.map((it) => ({
    order_id: order.id,
    menu_item_id: Number(it.id),
    qty: it.qty,
    price: it.price,
  }));

  const { error: itemsErr } = await supabase
    .from("order_items")
    .insert(itemsInsert);

  if (itemsErr) {
    return fail("INSERT_ITEMS", "Gagal menyimpan order_items", 500, itemsErr);
  }

  const orderId = String(order.order_code ?? order.id);

  return json(
    {
      ok: true,
      message: "Pembayaran sukses!",
      orderId,
      total: gross_amount,
      // status dikembalikan dari DB kalau ada
      status: order.status ?? null,
    },
    200
  );
}
