// lib/supabase/server.ts
import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string, value: string | undefined) {
  const v = value?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const SUPABASE_URL = requireEnv(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

// Supabase publishable/anon key (untuk SSR/session)
const SUPABASE_PUBLIC_KEY = requireEnv(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/**
 * Client untuk Server Components / Route Handlers (pakai cookies session).
 * Next.js 15: cookies() async -> WAJIB await cookies()
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
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
          // Di beberapa konteks (mis. Server Components tertentu) cookies read-only; aman diabaikan.
        }
      },
    },
  });
}

/**
 * Client service role untuk operasi admin backend (tanpa session cookies).
 * Gunakan hanya di server (Route Handler / Server Action). Jangan expose ke client.
 */
export function createSupabaseServiceClient() {
  const serviceKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
  )?.trim();

  if (!serviceKey) {
    throw new Error(
      "Missing env: SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)",
    );
  }

  return createClient(SUPABASE_URL, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

// Backward-compatible exports (kalau terlanjur dipakai di file lain)
export const supabaseServer = createSupabaseServerClient;
export const supabaseService = createSupabaseServiceClient;
