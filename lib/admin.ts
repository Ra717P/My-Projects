// lib/admin.ts
import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Role = "admin" | "user";
const PROFILE_TABLE = "profiles";

function normalizeRole(role: unknown): Role {
  return role === "admin" ? "admin" : "user";
}

export async function getUserRole(): Promise<Role | null> {
  const supabase = await createSupabaseServerClient();

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData.user) return null;

  const userId = authData.user.id;

  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) return "user";
  return normalizeRole(data?.role);
}

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData.user) {
    return {
      ok: false as const,
      status: 401,
      message: "Unauthorized: kamu belum login.",
      supabase,
      userId: null,
      role: null,
    };
  }

  const userId = authData.user.id;

  const { data: profile, error: profErr } = await supabase
    .from(PROFILE_TABLE)
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  const role = normalizeRole(profile?.role);

  if (profErr || role !== "admin") {
    return {
      ok: false as const,
      status: 403,
      message: "Forbidden: khusus admin.",
      supabase,
      userId,
      role,
    };
  }

  return {
    ok: true as const,
    status: 200,
    message: "OK",
    supabase,
    userId,
    role,
  };
}
