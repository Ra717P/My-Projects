// app/api/admin/menu/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

const MENU_TABLE = "menu_items"; // <--- sesuaikan jika nama tabelmu beda

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.message },
      { status: guard.status }
    );
  }

  const body = await req.json();

  const payload = {
    name: body.name ?? body.title, // fleksibel
    price: body.price ?? 0,
    category: body.category ?? "Uncategorized",
    image_url: body.image_url ?? null,
    description: body.description ?? null,
    is_available: body.is_available ?? true,
  };

  // Validasi minimal
  if (!payload.name || typeof payload.name !== "string") {
    return NextResponse.json({ error: "name wajib diisi" }, { status: 400 });
  }

  const { data, error } = await guard.supabase
    .from(MENU_TABLE)
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
