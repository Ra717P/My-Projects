// /pages/api/midtrans.ts
import type { NextApiRequest, NextApiResponse } from "next";
import midtransClient from "midtrans-client";
import { createClient } from "@supabase/supabase-js";

const mask = (v?: string) => (v ? v.slice(0, 6) + "..." : "undefined");

// Supabase service-role client (server only)
function supabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Supabase env tidak lengkap (URL/Service Role Key).");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // === Parse body ===
    const {
      items = [],
      customer,
      customerName,
      customerPhone,
      note,
    } = (req.body || {}) as {
      items: Array<{
        menuItemId?: number | string;
        id?: number | string;
        qty?: number | string;
        quantity?: number | string;
      }>;
      customer?: {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
      };
      customerName?: string;
      customerPhone?: string;
      note?: string;
    };

    // === ENV check ===
    const isProd = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
    console.log("[midtrans] isProd=", isProd, " serverKey=", mask(serverKey));
    if (!serverKey) {
      return res
        .status(500)
        .json({ message: "Server Key kosong/tidak terbaca di env" });
    }

    // === Validasi payload minimal ===
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items wajib diisi (minimal 1)" });
    }

    // Normalisasi item dari client -> {menuItemId, qty}
    const itemsReq = items.map((it) => ({
      menuItemId: Number(it.menuItemId ?? it.id),
      qty: Math.max(1, Math.round(Number(it.qty ?? it.quantity ?? 1))),
    }));
    if (
      itemsReq.some((x) => !Number.isFinite(x.menuItemId) || x.menuItemId <= 0)
    ) {
      return res.status(400).json({ message: "Item ID tidak valid" });
    }

    // === Ambil harga dari Supabase (anti manipulasi dari client) ===
    const supabase = supabaseService();
    const ids = itemsReq.map((x) => x.menuItemId);
    const { data: menuRows, error: menuErr } = await supabase
      .from("menu_items")
      .select("id, name, price")
      .in("id", ids);

    if (menuErr) {
      console.error("[supabase] menu error:", menuErr);
      return res.status(500).json({ message: "Gagal mengambil data menu" });
    }
    if (!menuRows || menuRows.length === 0) {
      return res.status(400).json({ message: "Menu tidak ditemukan" });
    }

    const priceById = new Map(
      menuRows.map((m) => [Number(m.id), Number(m.price)])
    );
    const nameById = new Map(
      menuRows.map((m) => [Number(m.id), String(m.name)])
    );

    // === Bangun item_details untuk Midtrans & hitung total server-side ===
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
      return res
        .status(400)
        .json({ message: "Terdapat item dengan harga tidak valid" });
    }

    const gross_amount = item_details.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );
    if (!Number.isFinite(gross_amount) || gross_amount <= 0) {
      return res
        .status(400)
        .json({ message: "Total tidak valid setelah perhitungan server" });
    }

    // === Buat order PENDING di Supabase ===
    const fullName = customer?.first_name
      ? `${customer.first_name}${
          customer.last_name ? " " + customer.last_name : ""
        }`
      : customerName ?? null;

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        customer_name: fullName,
        customer_phone: customer?.phone || customerPhone || null,
        note: note || null,
        total: gross_amount,
        status: "PENDING",
      })
      .select("*")
      .single();

    if (orderErr || !order) {
      console.error("[supabase] create order error:", orderErr);
      return res.status(500).json({ message: "Gagal membuat order" });
    }

    // === Simpan order_items (snapshot) ===
    const orderItems = item_details.map((it) => ({
      order_id: order.id,
      menu_item_id: Number(it.id),
      qty: it.quantity,
      price: it.price,
    }));
    const { error: itemsErr } = await supabase
      .from("order_items")
      .insert(orderItems);
    if (itemsErr) {
      console.error("[supabase] insert order_items error:", itemsErr);
      return res.status(500).json({ message: "Gagal menyimpan item pesanan" });
    }

    // === Gunakan order_code dari DB sebagai order_id di Midtrans ===
    const orderId = String(order.order_code ?? `ORD-${Date.now()}`);

    // === Buat transaksi Snap (QRIS only) ===
    const snap = new (midtransClient as any).Snap({
      isProduction: isProd,
      serverKey, // clientKey TIDAK diperlukan di backend
    });

    const parameter = {
      transaction_details: { order_id: orderId, gross_amount },
      item_details,
      customer_details: customer || undefined,
      enabled_payments: ["other_qris"],
      // expiry: { unit: "minutes", duration: 15 }, // aktifkan jika ingin
      // callbacks: { finish: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/order/finish` },
    };

    const tx = await snap.createTransaction(parameter);

    // (Opsional) simpan token/redirect ke orders bila kamu menambah kolomnya
    // await supabase.from("orders").update({ midtrans_token: tx.token, midtrans_redirect: tx.redirect_url }).eq("id", order.id);

    return res.status(200).json({
      message: "Token berhasil dibuat",
      token: tx.token,
      redirect_url: tx.redirect_url,
      orderId,
    });
  } catch (e: any) {
    const apiMsg =
      e?.ApiResponse?.error_messages?.[0] ||
      e?.ApiResponse?.status_message ||
      e?.message;

    console.error("[midtrans] error:", apiMsg, e);
    return res.status(500).json({ message: apiMsg || "Gagal membuat pesanan" });
  }
}
