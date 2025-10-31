// GET /api/menu  -> list
// POST /api/menu -> create (butuh service role di server)
import { NextResponse } from "next/server";
import { supabaseServer, supabaseService } from "@/lib/supabase/server";
import { createMenuSchema } from "@/lib/validators";

export async function GET() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .order("id", { ascending: true });
  if (error)
    return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = createMenuSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const svc = supabaseService(); // gunakan service role untuk write admin
  const { data, error } = await svc
    .from("menu_items")
    .insert(parsed.data)
    .select("*")
    .single();
  if (error)
    return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
