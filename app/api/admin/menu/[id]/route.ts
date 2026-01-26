import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// SESUAIKAN kalau tabelmu bukan "menu"
const MENU_TABLE = "menu_items";
const PROFILE_TABLE = "profiles";

type Ctx = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user) {
    return {
      ok: false as const,
      status: 401,
      error: authErr?.message ?? "Unauthorized",
    };
  }

  const { data: profile, error: profErr } = await supabase
    .from(PROFILE_TABLE)
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle(); // ✅ jangan single() biar "0 row" tidak jadi 500

  if (profErr) {
    return {
      ok: false as const,
      status: 500,
      error: "Gagal baca profiles",
      details: profErr,
    };
  }

  if (!profile) {
    // ✅ user login tapi belum punya row di profiles
    return {
      ok: false as const,
      status: 403,
      error: "Role belum diset di profiles",
    };
  }

  if (profile.role !== "admin") {
    return { ok: false as const, status: 403, error: "Forbidden (admin only)" };
  }

  return { ok: true as const };
}

function normalizeId(idRaw: string) {
  // kalau id kamu integer (contoh /4 /44), ubah ke number biar cocok kolom int
  return /^\d+$/.test(idRaw) ? Number(idRaw) : idRaw;
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const guard = await requireAdmin();
    if (!guard.ok) return NextResponse.json(guard, { status: guard.status });

    const { id: idRaw } = await ctx.params;
    if (!idRaw)
      return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await req.json().catch(() => null);
    if (!body)
      return NextResponse.json(
        { error: "Body JSON kosong/invalid" },
        { status: 400 },
      );

    // ambil field yang boleh diupdate
    const updates: Record<string, any> = {};
    const allowed = ["name", "price", "category"] as const;

    for (const k of allowed) {
      if (body[k] !== undefined) updates[k] = body[k];
    }

    // normalisasi tipe
    if (updates.price !== undefined) updates.price = Number(updates.price);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada field untuk diupdate" },
        { status: 400 },
      );
    }

    const service = createSupabaseServiceClient();
    const id = normalizeId(idRaw);

    const { data, error } = await service
      .from(MENU_TABLE)
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      // ✅ balikin detail biar ketahuan akar masalah
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
    if (!idRaw)
      return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const service = createSupabaseServiceClient();
    const id = normalizeId(idRaw);

    const { error } = await service.from(MENU_TABLE).delete().eq("id", id);

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

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 },
    );
  }
}
