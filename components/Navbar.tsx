// /components/Navbar.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CartIcon from "@/components/CartIcon";
import LoginModal from "@/components/auth/LoginModal";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function isAbortError(err: any) {
  return (
    err?.name === "AbortError" || String(err?.message ?? "").includes("aborted")
  );
}

export default function Navbar() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [openLogin, setOpenLogin] = useState(false);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  async function fetchRole(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        setIsAdmin(false);
        return;
      }

      setIsAdmin((data?.role ?? "user") === "admin");
    } catch (e) {
      if (!isAbortError(e)) console.error("fetchRole error:", e);
      setIsAdmin(false);
    }
  }

  async function loadAuth() {
    setLoadingAuth(true);
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      const json = await res.json();

      setUserEmail(json.user?.email ?? null);
      setIsAdmin(Boolean(json.isAdmin));
    } finally {
      setLoadingAuth(false);
    }
  }

  useEffect(() => {
    // jangan biarkan Promise reject tanpa catch
    void loadAuth().catch((e) => {
      if (!isAbortError(e)) console.error("loadAuth uncaught:", e);
      setLoadingAuth(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // callback ini jangan async langsung (biar tidak ada unhandled rejection)
      void (async () => {
        const user = session?.user ?? null;

        if (!user) {
          setUserEmail(null);
          setIsAdmin(false);
          setLoadingAuth(false);
          return;
        }

        setUserEmail(user.email ?? null);
        await fetchRole(user.id);
        setLoadingAuth(false);
      })().catch((e) => {
        if (!isAbortError(e)) console.error("onAuthStateChange error:", e);
        setLoadingAuth(false);
      });
    });

    return () => {
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
      setIsAdmin(false);
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
