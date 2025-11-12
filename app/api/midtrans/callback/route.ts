// POST /api/midtrans/callback -> webhook dari Midtrans
import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";
import crypto from "crypto";

function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
) {
  const expected = crypto
    .createHash("sha512")
    .update(
      orderId + statusCode + grossAmount + process.env.MIDTRANS_SERVER_KEY!
    )
    .digest("hex");
  return expected === signatureKey;
}

export async function POST(req: Request) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const {
    order_id,
    status_code,
    gross_amount,
    signature_key,
    transaction_status,
  } = payload || {};

  // Validasi minimal
  if (!order_id || !signature_key) {
    return NextResponse.json({ message: "Missing fields" }, { status: 400 });
  }

  // Verifikasi signature
  const isValid = verifySignature(
    String(order_id),
    String(status_code),
    String(gross_amount),
    String(signature_key)
  );
  if (!isValid) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 403 });
  }

  // Map status Midtrans ke status internal
  const map: Record<string, string> = {
    capture: "SETTLEMENT",
    settlement: "SETTLEMENT",
    pending: "PENDING",
    cancel: "CANCEL",
    deny: "DENY",
    expire: "EXPIRE",
    refund: "REFUND",
    chargeback: "REFUND",
    partial_refund: "REFUND",
  };
  const newStatus = map[transaction_status] || "PENDING";

  // Update ke Supabase
  const svc = supabaseService();
  const { error } = await svc
    .from("orders")
    .update({ status: newStatus })
    .eq("order_id", order_id);

  if (error) {
    return NextResponse.json({ message: "DB update failed" }, { status: 500 });
  }

  // Midtrans anggap sukses kalau return 200 OK
  return NextResponse.json({ ok: true });
}
