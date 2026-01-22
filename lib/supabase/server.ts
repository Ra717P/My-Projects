// /lib/supabase/server.ts
import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

const SUPABASE_URL = requireEnv(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

/**
 * Supabase public key untuk SSR/browser.
 * Rekomendasi terbaru umumnya pakai variable NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
 * tapi value "anon key" juga boleh dipakai selama masa transisi. :contentReference[oaicite:3]{index=3}
 */
const SUPABASE_PUBLIC_KEY = requireEnv(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/**
 * Client untuk Server Components / Route Handlers (pakai cookies session).
 * Konsepnya mengikuti panduan Supabase SSR createServerClient + cookies getAll/setAll. :contentReference[oaicite:4]{index=4}
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
          // Di Server Components tertentu cookies bisa read-only; ini aman diabaikan.
        }
      },
    },
  });
}

/**
 * Client "service role/secret" untuk operasi admin backend (TANPA session cookies).
 * Gunakan hanya di server (Route Handler / Server Action), jangan pernah expose ke client. :contentReference[oaicite:5]{index=5}
 */
export function createSupabaseServiceClient() {
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!serviceKey) {
    throw new Error(
      "Missing env SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)",
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

// Backward-compatible exports (kalau terlanjur import nama ini)
export const supabaseServer = createSupabaseServerClient;
export const supabaseService = createSupabaseServiceClient;
