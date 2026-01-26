// app/api/admin/transaksi/route.ts
import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROFILE_TABLE = "profiles";
const ORDERS_TABLE = "orders";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authErr } = await supabase.auth.getUser();

  if (authErr || !authData?.user) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  const { data: profile, error: profErr } = await supabase
    .from(PROFILE_TABLE)
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profErr) {
    return {
      ok: false as const,
      status: 500,
      error: "Gagal baca profiles",
      details: profErr.message,
    };
  }

  if (!profile || profile.role !== "admin") {
    return { ok: false as const, status: 403, error: "Forbidden (admin only)" };
  }

  return { ok: true as const };
}

export async function GET() {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) return NextResponse.json(guard, { status: guard.status });

    const service = createSupabaseServiceClient();

    // ✅ 1 query: orders + order_items + menu_items(name)
    // NOTE: memakai FK yang sudah ada: order_items_menu_item_id_fkey
    const { data, error } = await service
      .from(ORDERS_TABLE)
      .select(
        `
        *,
        items:order_items (
          *,
          menu:menu_items!order_items_menu_item_id_fkey (
            id,
            name
          )
        )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 },
    );
  }
}
