import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key)
    throw new Error("ENV Supabase belum lengkap (URL / SERVICE_ROLE).");
  return createClient(url, key, { auth: { persistSession: false } });
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// helper untuk error yang rapi + ada step
function fail(step: string, message: string, status = 500, extra?: any) {
  // log di terminal biar kamu lihat detailnya
  console.error(`[orders][${step}] ${message}`, extra ?? "");
  return json(
    {
      ok: false,
      step,
      message,
      // extra hanya untuk debugging (boleh kamu hapus kalau sudah beres)
      extra: extra ?? null,
    },
    status,
  );
}

export async function POST(req: Request) {
  const supabase = (() => {
    try {
      return supabaseService();
    } catch (e: any) {
      return null;
    }
  })();
  import { createClient } from "@supabase/supabase-js";

  export const runtime = "nodejs";
  export const dynamic = "force-dynamic";

  function supabaseService() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!url || !key)
      throw new Error("ENV Supabase belum lengkap (URL / SERVICE_ROLE).");
    return createClient(url, key, { auth: { persistSession: false } });
  }

  function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "content-type": "application/json" },
    });
  }

  // helper untuk error yang rapi + ada step
  function fail(step: string, message: string, status = 500, extra?: any) {
    // log di terminal biar kamu lihat detailnya
    console.error(`[orders][${step}] ${message}`, extra ?? "");
    return json(
      {
        ok: false,
        step,
        message,
        // extra hanya untuk debugging (boleh kamu hapus kalau sudah beres)
        extra: extra ?? null,
      },
      status,
    );
  }

  export async function POST(req: Request) {
    const supabase = (() => {
      try {
        return supabaseService();
      } catch (e: any) {
        return null;
      }
    })();

    if (!supabase) {
      return fail(
        "ENV",
        "Tidak bisa membuat Supabase client. Cek NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY",
        500,
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch (e: any) {
      return fail("PARSE_BODY", "Body JSON tidak valid", 400, e?.message);
    }

    // ============= STEP: VALIDATE ITEMS =============
    if (!Array.isArray(body?.items) || body.items.length === 0) {
      return fail(
        "VALIDATE_ITEMS",
        "Items wajib diisi (minimal 1)",
        400,
        body?.items,
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
      const qty =
        Number.isFinite(qtyRaw) && qtyRaw > 0 ? Math.round(qtyRaw) : 1;
      return { menuItemId, qty };
    });

    if (
      itemsReq.some((x) => !Number.isInteger(x.menuItemId) || x.menuItemId <= 0)
    ) {
      return fail(
        "VALIDATE_ITEMS",
        "Ada menuItemId tidak valid",
        400,
        itemsReq,
      );
    }
    if (itemsReq.some((x) => !Number.isInteger(x.qty) || x.qty <= 0)) {
      return fail("VALIDATE_ITEMS", "Ada qty tidak valid", 400, itemsReq);
    }

    // ============= STEP: FETCH MENU (ANTI MANIPULASI) =============
    const uniqueIds = Array.from(new Set(itemsReq.map((x) => x.menuItemId)));

    const { data: menuRows, error: menuErr } = await supabase
      .from("menu_items")
      .select("id, name, price")
      .in("id", uniqueIds);

    if (menuErr) {
      // biasanya: tabel tidak ada, kolom tidak ada, RLS, atau koneksi
      return fail("FETCH_MENU", "Gagal mengambil data menu", 500, menuErr);
    }
    if (!menuRows || menuRows.length === 0) {
      return fail(
        "FETCH_MENU",
        "Menu tidak ditemukan (tabel kosong atau ID tidak cocok)",
        400,
        {
          uniqueIds,
          menuRows,
        },
      );
    }

    const priceById = new Map<number, number>(
      menuRows.map((m: any) => [Number(m.id), Number(m.price)]),
    );
    const nameById = new Map<number, string>(
      menuRows.map((m: any) => [Number(m.id), String(m.name)]),
    );

    const missingIds = uniqueIds.filter((id) => !priceById.has(id));
    if (missingIds.length > 0) {
      return fail("FETCH_MENU", "Ada ID menu yang tidak ada di DB", 400, {
        missingIds,
        uniqueIds,
      });
    }

    // ============= STEP: BUILD ITEMS + TOTAL =============
    const item_details = itemsReq.map((it) => {
      const price = Math.round(Number(priceById.get(it.menuItemId)));
      const name = (
        nameById.get(it.menuItemId) ?? `Item ${it.menuItemId}`
      ).slice(0, 50);
      return { id: it.menuItemId, name, price, qty: it.qty };
    });

    const invalidPrice = item_details.filter(
      (x) => !Number.isFinite(x.price) || x.price <= 0,
    );
    if (invalidPrice.length > 0) {
      return fail(
        "CALC_TOTAL",
        "Ada item dengan harga tidak valid",
        400,
        invalidPrice,
      );
    }

    const gross_amount = item_details.reduce(
      (sum, it) => sum + it.price * it.qty,
      0,
    );
    if (!Number.isFinite(gross_amount) || gross_amount <= 0) {
      return fail(
        "CALC_TOTAL",
        "Total tidak valid setelah dihitung server",
        400,
        { gross_amount, item_details },
      );
    }

    // ============= STEP: INSERT ORDER =============
    const customer = body.customer || {};
    const customerName = customer.first_name
      ? `${customer.first_name}${
          customer.last_name ? " " + customer.last_name : ""
        }`
      : (body.customerName ?? null);

    // Status final tanpa Midtrans:
    // PENTING: sesuaikan dengan enum di DB kamu.
    // Kalau enum kamu lowercase, ini aman.
    const FINAL_STATUS = "settlement";

    // NOTE: aku sengaja TIDAK kirim customer_phone lagi,
    // biar aman kalau kolomnya tidak ada di tabel orders.
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        customer_name: customerName,
        note: body.note || null,
        total: gross_amount,
        status: FINAL_STATUS,
      })
      .select("*")
      .single();

    if (orderErr || !order) {
      return fail("INSERT_ORDER", "Gagal membuat order", 500, orderErr);
    }

    // ============= STEP: INSERT ORDER ITEMS =============
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
      // rollback biar tidak ada order "yatim"
      try {
        await supabase.from("orders").delete().eq("id", order.id);
      } catch (e: any) {
        console.error("[orders][ROLLBACK] gagal hapus order", e?.message ?? e);
      }
      return fail("INSERT_ITEMS", "Gagal menyimpan order_items", 500, itemsErr);
    }

    const orderId = String(order.order_code ?? order.id);

    return json(
      {
        ok: true,
        message: "Pembayaran sukses!",
        orderId,
        status: FINAL_STATUS,
        total: gross_amount,
      },
      200,
    );
  }

  if (!supabase) {
    return fail(
      "ENV",
      "Tidak bisa membuat Supabase client. Cek NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY",
      500,
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch (e: any) {
    return fail("PARSE_BODY", "Body JSON tidak valid", 400, e?.message);
  }

  // ============= STEP: VALIDATE ITEMS =============
  if (!Array.isArray(body?.items) || body.items.length === 0) {
    return fail(
      "VALIDATE_ITEMS",
      "Items wajib diisi (minimal 1)",
      400,
      body?.items,
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

  // ============= STEP: FETCH MENU (ANTI MANIPULASI) =============
  const uniqueIds = Array.from(new Set(itemsReq.map((x) => x.menuItemId)));

  const { data: menuRows, error: menuErr } = await supabase
    .from("menu_items")
    .select("id, name, price")
    .in("id", uniqueIds);

  if (menuErr) {
    // biasanya: tabel tidak ada, kolom tidak ada, RLS, atau koneksi
    return fail("FETCH_MENU", "Gagal mengambil data menu", 500, menuErr);
  }
  if (!menuRows || menuRows.length === 0) {
    return fail(
      "FETCH_MENU",
      "Menu tidak ditemukan (tabel kosong atau ID tidak cocok)",
      400,
      {
        uniqueIds,
        menuRows,
      },
    );
  }

  const priceById = new Map<number, number>(
    menuRows.map((m: any) => [Number(m.id), Number(m.price)]),
  );
  const nameById = new Map<number, string>(
    menuRows.map((m: any) => [Number(m.id), String(m.name)]),
  );

  const missingIds = uniqueIds.filter((id) => !priceById.has(id));
  if (missingIds.length > 0) {
    return fail("FETCH_MENU", "Ada ID menu yang tidak ada di DB", 400, {
      missingIds,
      uniqueIds,
    });
  }

  // ============= STEP: BUILD ITEMS + TOTAL =============
  const item_details = itemsReq.map((it) => {
    const price = Math.round(Number(priceById.get(it.menuItemId)));
    const name = (nameById.get(it.menuItemId) ?? `Item ${it.menuItemId}`).slice(
      0,
      50,
    );
    return { id: it.menuItemId, name, price, qty: it.qty };
  });

  const invalidPrice = item_details.filter(
    (x) => !Number.isFinite(x.price) || x.price <= 0,
  );
  if (invalidPrice.length > 0) {
    return fail(
      "CALC_TOTAL",
      "Ada item dengan harga tidak valid",
      400,
      invalidPrice,
    );
  }

  const gross_amount = item_details.reduce(
    (sum, it) => sum + it.price * it.qty,
    0,
  );
  if (!Number.isFinite(gross_amount) || gross_amount <= 0) {
    return fail(
      "CALC_TOTAL",
      "Total tidak valid setelah dihitung server",
      400,
      { gross_amount, item_details },
    );
  }

  // ============= STEP: INSERT ORDER =============
  const customer = body.customer || {};
  const customerName = customer.first_name
    ? `${customer.first_name}${
        customer.last_name ? " " + customer.last_name : ""
      }`
    : (body.customerName ?? null);

  // NOTE: aku sengaja TIDAK kirim customer_phone lagi,
  // biar aman kalau kolomnya tidak ada di tabel orders.
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      customer_name: customerName,
      note: body.note || null,
      total: gross_amount,
      status: "SETTLEMENT",
    })
    .select("*")
    .single();

  if (orderErr || !order) {
    return fail("INSERT_ORDER", "Gagal membuat order", 500, orderErr);
  }

  // ============= STEP: INSERT ORDER ITEMS =============
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
      status: "SETTLEMENT",
      total: gross_amount,
    },
    200,
  );
}
