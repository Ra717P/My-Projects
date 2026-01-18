// lib/admin.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Role = "admin" | "user";

const PROFILE_TABLE = "profiles"; // sesuaikan jika beda

export async function getUserRole(): Promise<Role | null> {
  const supabase = createSupabaseServerClient();

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData.user) return null;

  const userId = authData.user.id;

  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data?.role) return "user"; // default aman: anggap user biasa
  return data.role as Role;
}

export async function requireAdmin() {
  const supabase = createSupabaseServerClient();

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
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const role = (profile?.role ?? "user") as Role;

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
