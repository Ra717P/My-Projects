// app/api/admin/menu/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MENU_TABLE = "menu_items";

export async function GET() {
  const service = createSupabaseServiceClient();
  const { data, error } = await service
    .from(MENU_TABLE)
    .select("*")
    .order("id", { ascending: true });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// (opsional) POST untuk tambah menu
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: "Body JSON invalid" }, { status: 400 });

  const service = createSupabaseServiceClient();
  const { data, error } = await service
    .from(MENU_TABLE)
    .insert({
      name: body.name,
      price: Number(body.price),
      category: body.category ?? null,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}
