import { NextResponse } from "next/server";
import { supabaseServer, supabaseService } from "@/lib/supabase/server";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const id = Number(params.id);
  if (Number.isNaN(id))
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("id", id)
    .single();
  if (error)
    return NextResponse.json({ message: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const id = Number(params.id);
  if (Number.isNaN(id))
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });

  const svc = supabaseService();
  const { error } = await svc.from("menu_items").delete().eq("id", id);
  if (error)
    return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
