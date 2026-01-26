// app/api/admin/menu/[id]/route.ts
import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MENU_TABLE = "menu_items";
const PROFILE_TABLE = "profiles";

type Ctx = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user)
    return { ok: false as const, status: 401, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from(PROFILE_TABLE)
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return { ok: false as const, status: 403, error: "Forbidden (admin only)" };
  }
  return { ok: true as const };
}

function normalizeId(idRaw: string) {
  return /^\d+$/.test(idRaw) ? Number(idRaw) : idRaw;
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) return NextResponse.json(guard, { status: guard.status });

    const { id: idRaw } = await ctx.params;
    const id = normalizeId(idRaw);

    const body = await req.json().catch(() => null);
    if (!body)
      return NextResponse.json({ error: "Body JSON invalid" }, { status: 400 });

    const updates: Record<string, any> = {};
    const allowed = ["name", "price", "category"] as const;
    for (const k of allowed) if (body[k] !== undefined) updates[k] = body[k];
    if (updates.price !== undefined) updates.price = Number(updates.price);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada field untuk diupdate" },
        { status: 400 },
      );
    }

    const service = createSupabaseServiceClient();
    const { data, error } = await service
      .from(MENU_TABLE)
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) return NextResponse.json(guard, { status: guard.status });

    const { id: idRaw } = await ctx.params;
    const id = normalizeId(idRaw);

    const service = createSupabaseServiceClient();
    const { error } = await service.from(MENU_TABLE).delete().eq("id", id);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 },
    );
  }
}
