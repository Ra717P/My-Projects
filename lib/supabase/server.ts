// /lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!; // support key baru supabase
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Client untuk Server Components / Route Handlers (pakai cookies session).
 * Next.js 15: cookies() adalah async -> wajib await cookies()
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Kalau kepanggil di Server Component yang tidak boleh set cookies, abaikan.
          // (Route Handler boleh set)
        }
      },
    },
  });
}

/**
 * Client "service role" untuk operasi admin backend (TANPA session cookies).
 * Pakai hanya di server (Route Handler), jangan pernah expose ke client.
 */
export function createSupabaseServiceClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing env SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

// Backward-compatible exports (kalau kamu terlanjur import nama ini)
export const supabaseServer = createSupabaseServerClient;
export const supabaseService = createSupabaseServiceClient;
