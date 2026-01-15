import { NextResponse } from "next/server";

// Midtrans sudah tidak dipakai.
// Webhook callback ini dinonaktifkan untuk mencegah pemanggilan yang tidak perlu.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    { message: "Midtrans callback dinonaktifkan (Midtrans dihapus)." },
    { status: 410 }
  );
}
