export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import midtransClient from "midtrans-client";
import { createClient } from "@supabase/supabase-js";

const mask = (v?: string) => (v ? v.slice(0, 6) + "..." : "undefined");

// helper: supabase service role (server-only)
function supabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Supabase env tidak lengkap (URL/Service Role Key).");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const isProd = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();

    // Debug aman (jangan log full key)
    console.log("[midtrans] isProd=", isProd, " serverKey=", mask(serverKey));

    if (!serverKey) {
      return json({ message: "Server Key kosong/tidak terbaca di env" }, 500);
    }
    if (!Array.isArray(body?.items) || body.items.length === 0) {
      return json({ message: "Items wajib diisi (minimal 1)" }, 400);
    }

    // 1) Validasi & normalisasi payload minimal
    const itemsReq: { menuItemId: number; qty: number }[] = body.items.map(
      (it: any) => ({
        menuItemId: Number(it.menuItemId ?? it.id ?? it.menu_item_id),
        qty: Math.max(1, Math.round(Number(it.qty ?? it.quantity ?? 1))),
      })
    );
    if (
      itemsReq.some((x) => !Number.isFinite(x.menuItemId) || x.menuItemId <= 0)
    ) {
      return json({ message: "Item ID tidak valid" }, 400);
    }

    // 2) Ambil harga dari Supabase (anti manipulasi harga di client)
    const supabase = supabaseService();
    const ids = itemsReq.map((x) => x.menuItemId);
    const { data: menuRows, error: menuErr } = await supabase
      .from("menu_items")
      .select("id, name, price")
      .in("id", ids);

    if (menuErr) {
      console.error("[supabase] menu error:", menuErr);
      return json({ message: "Gagal mengambil data menu" }, 500);
    }
    if (!menuRows || menuRows.length === 0) {
      return json({ message: "Menu tidak ditemukan" }, 400);
    }

    const priceById = new Map(
      menuRows.map((m) => [Number(m.id), Number(m.price)])
    );
    const nameById = new Map(
      menuRows.map((m) => [Number(m.id), String(m.name)])
    );

    // 3) Bangun item_details untuk Midtrans & hitung total server-side
    const item_details = itemsReq.map((it) => ({
      id: String(it.menuItemId),
      price: Math.round(priceById.get(it.menuItemId) ?? 0),
      quantity: it.qty,
      name: String(
        nameById.get(it.menuItemId) ?? `Item ${it.menuItemId}`
      ).slice(0, 50),
    }));

    if (
      item_details.some((it) => !Number.isFinite(it.price) || it.price <= 0)
    ) {
      return json({ message: "Terdapat item dengan harga tidak valid" }, 400);
    }

    const gross_amount = item_details.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );
    if (!Number.isFinite(gross_amount) || gross_amount <= 0) {
      return json(
        { message: "Total tidak valid setelah perhitungan server" },
        400
      );
    }

    // 4) Buat order PENDING di Supabase (pakai total server-side)
    const customer = body.customer || {};
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        customer_name: customer.first_name
          ? `${customer.first_name}${
              customer.last_name ? " " + customer.last_name : ""
            }`
          : body.customerName ?? null,
        customer_phone: customer.phone || body.customerPhone || null,
        note: body.note || null,
        total: gross_amount,
        status: "PENDING",
      })
      .select("*")
      .single();

    if (orderErr || !order) {
      console.error("[supabase] create order error:", orderErr);
      return json({ message: "Gagal membuat order" }, 500);
    }

    // 5) Simpan order_items (snapshot harga)
    const itemsInsert = item_details.map((it) => ({
      order_id: order.id,
      menu_item_id: Number(it.id),
      qty: it.quantity,
      price: it.price,
    }));

    const { error: itemsErr } = await supabase
      .from("order_items")
      .insert(itemsInsert);
    if (itemsErr) {
      console.error("[supabase] insert order_items error:", itemsErr);
      return json({ message: "Gagal menyimpan item pesanan" }, 500);
    }

    // 6) Order ID untuk Midtrans → gunakan order_code dari DB agar rapi & unik
    const orderId = String(order.order_code ?? `ORD-${Date.now()}`);

    // 7) Buat transaksi Snap Midtrans (QRIS saja)
    const snap = new (midtransClient as any).Snap({
      isProduction: isProd,
      serverKey, // clientKey tidak diperlukan di server
    });

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount,
      },
      item_details,
      customer_details:
        customer.first_name || customer.phone ? customer : undefined,
      enabled_payments: ["other_qris"],
      expiry: { unit: "minutes", duration: 15 },
    };

    const tx = await snap.createTransaction(parameter);

    // (Opsional) simpan token/redirect_url ke kolom khusus bila kamu menambahkan field pada tabel orders
    // await supabase.from("orders").update({ midtrans_token: tx.token, midtrans_redirect: tx.redirect_url }).eq("id", order.id);

    return json(
      {
        message: "Token berhasil dibuat",
        token: tx.token,
        redirect_url: tx.redirect_url,
        orderId, // gunakan ini untuk tracking/redirect
      },
      200
    );
  } catch (e: any) {
    // Ambil pesan dari Midtrans jika ada
    const apiMsg =
      e?.ApiResponse?.error_messages?.[0] ||
      e?.ApiResponse?.status_message ||
      e?.message;

    console.error("[midtrans] error:", apiMsg, e);
    return json({ message: apiMsg || "Gagal membuat pesanan" }, 500);
  }
}

// Helper response JSON
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
