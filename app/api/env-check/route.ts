// /app/api/env-check/route.ts
export const runtime = "nodejs"; // pastikan Node.js runtime

import { NextResponse } from "next/server";

const mask = (v?: string | null) =>
  v ? v.slice(0, 6) + "..." + v.slice(-4) : "undefined";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? null;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? null;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? null;

  return NextResponse.json({
    // boolean flags
    ok: !!url && !!anon && !!svc,
    NEXT_PUBLIC_SUPABASE_URL: Boolean(url),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(anon),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(svc),

    // info tambahan (aman, ter-mask)
    meta: {
      url_preview: mask(url),
      anon_len: anon?.length ?? 0,
      svc_len: svc?.length ?? 0,
    },
  });
}
