// /components/Navbar.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CartIcon from "@/components/CartIcon";
import LoginModal from "@/components/auth/LoginModal";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Role = "admin" | "user" | null;

function isAbortError(err: any) {
  return (
    err?.name === "AbortError" || String(err?.message ?? "").includes("aborted")
  );
}

export default function Navbar({ initialRole }: { initialRole: Role }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [openLogin, setOpenLogin] = useState(false);

  // ✅ render awal konsisten dari server
  const [role, setRole] = useState<Role>(initialRole);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const isAdmin = role === "admin";

  async function fetchRole(userId: string): Promise<Role> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (error) return "user";
      return (data?.role ?? "user") === "admin" ? "admin" : "user";
    } catch (e) {
      if (!isAbortError(e)) console.error("fetchRole error:", e);
      return "user";
    }
  }

  useEffect(() => {
    let active = true;

    async function syncFromSession() {
      setLoadingAuth(true);
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!active) return;

        if (error || !data?.user) {
          setUserEmail(null);
          setRole(null);
          return;
        }

        const user = data.user;
        setUserEmail(user.email ?? null);

        const newRole = await fetchRole(user.id);
        if (!active) return;
        setRole(newRole);
      } catch (e) {
        if (!isAbortError(e)) console.error("syncFromSession error:", e);
      } finally {
        if (active) setLoadingAuth(false);
      }
    }

    // ✅ isi email/role dari session client (tanpa /api/me)
    void syncFromSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        if (!active) return;

        const user = session?.user ?? null;
        if (!user) {
          setUserEmail(null);
          setRole(null);
          setLoadingAuth(false);
          return;
        }

        setLoadingAuth(true);
        setUserEmail(user.email ?? null);
        const newRole = await fetchRole(user.id);
        if (!active) return;
        setRole(newRole);
        setLoadingAuth(false);
      })().catch((e) => {
        if (!isAbortError(e)) console.error("onAuthStateChange error:", e);
        if (active) setLoadingAuth(false);
      });
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      if (!isAbortError(e)) console.error("logout error:", e);
    } finally {
      setUserEmail(null);
      setRole(null);
    }
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-dancing text-xl sm:text-2xl leading-none"
        >
          Sisi Kopi
        </Link>

        <nav className="flex items-center gap-3">
          <Link href="/menu" className="hover:underline">
            Menu
          </Link>

          <CartIcon />

          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-white"
            >
              Admin Panel
            </Link>
          )}

          {!loadingAuth && !userEmail ? (
            <button
              type="button"
              onClick={() => setOpenLogin(true)}
              className="rounded-lg bg-black px-3 py-1.5 text-sm text-white"
            >
              Login Admin
            </button>
          ) : null}

          {!loadingAuth && userEmail ? (
            <>
              <span className="hidden sm:inline text-xs text-gray-600 max-w-[180px] truncate">
                {userEmail}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-white"
              >
                Logout
              </button>
            </>
          ) : null}
        </nav>
      </div>

      <div className="pt-[env(safe-area-inset-top)]" />

      <LoginModal open={openLogin} onClose={() => setOpenLogin(false)} />
    </header>
  );
}
