import Link from "next/link";

export default function AdminHome() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Dashboard Admin</h1>
      <p className="text-sm text-gray-600">Kelola menu dan lihat transaksi.</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          className="rounded-xl border bg-white p-4 hover:bg-gray-50"
          href="/admin/menu"
        >
          <div className="font-medium">Kelola Menu</div>
          <div className="text-sm text-gray-600">Tambah, edit, hapus menu</div>
        </Link>

        <Link
          className="rounded-xl border bg-white p-4 hover:bg-gray-50"
          href="/admin/transaksi"
        >
          <div className="font-medium">Lihat Transaksi</div>
          <div className="text-sm text-gray-600">Daftar pesanan & item</div>
        </Link>
      </div>
    </div>
  );
}
