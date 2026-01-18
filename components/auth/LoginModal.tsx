// components/auth/LoginModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  open: boolean;
  onClose: () => void;
};

const ADMIN_DOMAIN = "admin.local";

export default function LoginModal({ open, onClose }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) setErrorMsg(null);
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return; // cegah double submit

    setLoading(true);
    setErrorMsg(null);

    try {
      const id = adminId.trim().toLowerCase();
      if (!id) {
        setErrorMsg("ID Admin wajib diisi.");
        return;
      }

      const email = `${id}@${ADMIN_DOMAIN}`;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      onClose();
      router.refresh();
    } catch (err: any) {
      // AbortError bisa muncul saat request dibatalkan, jangan bikin crash
      if (err?.name === "AbortError") return;
      setErrorMsg(err?.message ?? "Terjadi error saat login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24">
      <div className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Login Admin</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
          >
            Tutup
          </button>
        </div>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm">ID Admin</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="admin1"
              required
            />
            <p className="mt-1 text-xs text-gray-500">(ID)@{ADMIN_DOMAIN}</p>
          </div>

          <div>
            <label className="text-sm">Password</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>

          <div className="text-xs text-gray-500">
            Setelah login berhasil, tombol <b>Admin Panel</b> akan muncul di
            navbar.
          </div>
        </form>
      </div>
    </div>
  );
}
