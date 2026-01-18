// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

export async function middleware(req: NextRequest) {
  const { supabase, res } = createSupabaseMiddlewareClient(req);

  const pathname = req.nextUrl.pathname;

  // Protect hanya area admin
  if (pathname.startsWith("/admin")) {
    const { data } = await supabase.auth.getUser();

    // Belum login
    if (!data.user) {
      const url = req.nextUrl.clone();
      url.pathname = "/"; // atau "/login"
      return NextResponse.redirect(url);
    }

    // Cek role di profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if ((profile?.role ?? "user") !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/"; // atau "/unauthorized"
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
