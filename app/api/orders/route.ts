export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import midtransClient from "midtrans-client";

const mask = (v?: string) => (v ? v.slice(0, 6) + "..." : "undefined");

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

    // Normalisasi total/gross_amount → integer IDR
    const gross_amount = Math.round(Number(body.total ?? 0));
    if (!Number.isFinite(gross_amount) || gross_amount <= 0) {
      return json({ message: "Total tidak valid" }, 400);
    }

    // Normalisasi item_details
    const item_details = body.items.map((it: any) => ({
      id: String(it.id),
      price: Math.round(Number(it.price)),
      quantity: Math.max(1, Math.round(Number(it.quantity))),
      name: String(it.name).slice(0, 50),
    }));

    const snap = new (midtransClient as any).Snap({
      isProduction: isProd,
      serverKey, // clientKey tidak diperlukan di server
    });

    // Order ID unik
    const orderId = `ORD-${Date.now()}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount,
      },
      item_details,
      customer_details: body.customer || undefined,

      // HANYA QRIS
      enabled_payments: ["other_qris"],

      // (Opsional) expiry 15 menit dari sekarang
      expiry: {
        unit: "minutes",
        duration: 15,
      },
    };

    const tx = await snap.createTransaction(parameter);

    // TODO: simpan order pending ke DB (orderId, gross_amount, item_details, status: 'pending')

    return json(
      {
        message: "Token berhasil dibuat",
        token: tx.token,
        redirect_url: tx.redirect_url,
        orderId,
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
