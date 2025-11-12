// GET /api/menu  -> list
// POST /api/menu -> create (butuh service role di server)
import { NextResponse } from "next/server";
import { supabaseServer, supabaseService } from "@/lib/supabase/server";
import { createMenuSchema } from "@/lib/validators";

export async function GET() {
  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    // Cache edge (60s) + stale-while-revalidate (5 menit) — aman untuk katalog
    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createMenuSchema.safeParse(body);
  if (!parsed.success) {
    // stringify supaya field `message` tetap string dan aman untuk typing/log
    return NextResponse.json(
      { message: JSON.stringify(parsed.error.flatten()) },
      { status: 400 }
    );
  }

  // Guard env service role agar jelas jika belum diset
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { message: "Missing SUPABASE_SERVICE_ROLE_KEY on server" },
      { status: 500 }
    );
  }

  try {
    const svc = supabaseService(); // gunakan service role untuk write admin
    const { data, error } = await svc
      .from("menu_items")
      .insert(parsed.data)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message || "Insert failed" },
      { status: 500 }
    );
  }
}
