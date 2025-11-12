import { NextResponse } from "next/server";
import { supabaseServer, supabaseService } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("id", numId)
    .single();

  if (error) {
    const notFound =
      (error as any)?.code === "PGRST116" ||
      /No rows|Results contain 0 rows/i.test((error as any)?.message || "");
    return NextResponse.json(
      { message: notFound ? "Not found" : error.message },
      { status: notFound ? 404 : 500 }
    );
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  const svc = supabaseService();
  const { error } = await svc.from("menu_items").delete().eq("id", numId);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
