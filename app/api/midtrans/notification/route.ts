// Midtrans sudah tidak dipakai.
// Webhook notification ini dinonaktifkan.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return new Response(
    JSON.stringify({
      message: "Midtrans notification dinonaktifkan (Midtrans dihapus).",
    }),
    {
      status: 410,
      headers: { "content-type": "application/json" },
    }
  );
}
