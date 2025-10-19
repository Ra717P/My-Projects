import type { NextApiRequest, NextApiResponse } from "next";
import midtransClient from "midtrans-client";

const mask = (v?: string) => (v ? v.slice(0, 6) + "..." : "undefined");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const {
      items = [],
      total,
      customer,
    } = (req.body || {}) as {
      items: Array<{
        id: string | number;
        name: string;
        price: number | string;
        quantity?: number | string;
      }>;
      total: number | string;
      customer?: {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
      };
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

    // === Payload validation ===
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items wajib diisi (minimal 1)" });
    }
    const gross_amount = Math.round(Number(total ?? 0));
    if (!Number.isFinite(gross_amount) || gross_amount <= 0) {
      return res.status(400).json({ message: "Total tidak valid" });
    }

    // Normalisasi item_details → angka bulat & quantity minimal 1
    const item_details = items.map((it) => ({
      id: String(it.id),
      price: Math.round(Number(it.price ?? 0)),
      quantity: Math.max(1, Math.round(Number(it.quantity ?? 1))),
      name: String(it.name).slice(0, 50),
    }));

    const snap = new (midtransClient as any).Snap({
      isProduction: isProd,
      serverKey, // clientKey TIDAK diperlukan di backend
    });

    const orderId = `ORD-${Date.now()}`;

    const parameter = {
      transaction_details: { order_id: orderId, gross_amount },
      item_details,
      customer_details: customer || undefined,

      // 🔒 HANYA QRIS (Snap)
      enabled_payments: ["other_qris"],

      // ⏳ (Opsional) Expiry 15 menit dari sekarang — hapus blok ini jika tidak perlu
      // expiry: { unit: "minutes", duration: 15 },

      // (Opsional) redirect setelah selesai
      // callbacks: { finish: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/order/finish` },
    };

    const tx = await snap.createTransaction(parameter);

    // TODO: simpan order pending ke DB: { orderId, gross_amount, item_details, status:'pending' }

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
