// POST /api/checkout -> buat transaksi Midtrans Snap
import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";
import midtransClient from "midtrans-client";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const { amount, table_no, customer_name, items } = body || {};

  // Validasi dasar
  if (!Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
  }
  if (!Number.isInteger(table_no) || table_no <= 0) {
    return NextResponse.json(
      { message: "Invalid table number" },
      { status: 400 }
    );
  }
  if (!customer_name || typeof customer_name !== "string") {
    return NextResponse.json(
      { message: "Invalid customer name" },
      { status: 400 }
    );
  }

  // Cek env Midtrans
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const baseUrl = process.env.APP_BASE_URL;
  if (!serverKey || !clientKey || !baseUrl) {
    return NextResponse.json(
      { message: "Missing Midtrans configuration" },
      { status: 500 }
    );
  }

  // 1️⃣ Simpan order PENDING di Supabase
  const orderId = `ORDER-${Date.now()}`;
  const svc = supabaseService();
  const { data: saved, error: saveErr } = await svc
    .from("orders")
    .insert({
      order_id: orderId,
      table_no,
      customer_name,
      amount,
      status: "PENDING",
      raw_payload: body,
    })
    .select("*")
    .single();

  if (saveErr) {
    return NextResponse.json({ message: saveErr.message }, { status: 500 });
  }

  // 2️⃣ Buat transaksi Snap Midtrans
  const snap = new midtransClient.Snap({
    isProduction,
    serverKey,
    clientKey,
  });

  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    item_details: (items || []).map((it: any) => ({
      id: it.id,
      name: it.name,
      price: it.price,
      quantity: it.qty,
    })),
    customer_details: {
      first_name: customer_name,
      email: "guest@sisikopi.app", // dummy
    },
    callbacks: {
      finish: `${baseUrl}/payment/finish?order_id=${orderId}`,
      error: `${baseUrl}/payment/error?order_id=${orderId}`,
      pending: `${baseUrl}/payment/pending?order_id=${orderId}`,
    },
    credit_card: { secure: true },
  };

  try {
    const trx = await snap.createTransaction(parameter);

    // Update token & redirect_url
    await svc
      .from("orders")
      .update({ snap_token: trx.token, snap_redirect_url: trx.redirect_url })
      .eq("id", saved.id);

    return NextResponse.json({
      token: trx.token,
      redirect_url: trx.redirect_url,
      orderId,
    });
  } catch (e: any) {
    await svc.from("orders").update({ status: "CANCEL" }).eq("id", saved.id);
    return NextResponse.json(
      { message: e?.message || "Midtrans transaction failed" },
      { status: 500 }
    );
  }
}
