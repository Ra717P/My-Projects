import Link from "next/link";

export default function AdminNav() {
  return (
    <div className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="font-semibold">
            Admin Panel
          </Link>
          <Link
            href="/admin/menu"
            className="text-sm text-gray-700 hover:underline"
          >
            Menu
          </Link>
          <Link
            href="/admin/transaksi"
            className="text-sm text-gray-700 hover:underline"
          >
            Transaksi
          </Link>
        </div>

        <Link href="/" className="text-sm text-gray-700 hover:underline">
          Kembali ke Website
        </Link>
      </div>
    </div>
  );
}
