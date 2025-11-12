import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Verifikasi signature sesuai docs:
    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const checkRaw = `${body.order_id}${body.status_code}${body.gross_amount}${serverKey}`;
    const expected = crypto.createHash("sha512").update(checkRaw).digest("hex");

    if (expected !== body.signature_key) {
      return new Response("Invalid signature", { status: 401 });
    }

    const { transaction_status, fraud_status, order_id } = body;

    // Contoh mapping status
    // settlement (paid), capture (CC), pending, cancel, deny, expire, refund, partial_refund, chargeback
    // fraud_status: accept / challenge / deny

    // TODO: Update status di DB berdasarkan order_id
    // e.g., if (transaction_status === "settlement") setPaid(order_id)

    return new Response("OK");
  } catch (e) {
    console.error(e);
    return new Response("Error", { status: 500 });
  }
}
