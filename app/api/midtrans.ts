import type { NextApiRequest, NextApiResponse } from "next";

// Midtrans sudah tidak dipakai.
// Endpoint ini dinonaktifkan agar tidak ada pemanggilan lama yang nyasar.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return res.status(410).json({
    message:
      "Endpoint /pages/api/midtrans sudah dinonaktifkan (Midtrans dihapus). Gunakan POST /api/orders.",
  });
}
