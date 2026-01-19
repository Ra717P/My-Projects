import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) return NextResponse.json({ user: null, isAdmin: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    isAdmin: (profile?.role ?? "user") === "admin",
  });
}
