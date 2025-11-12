// app/menu/page.jsx
"use client";
import { useMemo, useState } from "react";
import MenuCard from "@/components/MenuCard";
import FilterBar from "@/components/FilterBar";
import menu from "@/data/menu";

export default function MenuPage() {
  const [filters, setFilters] = useState({ category: "All", q: "" });

  const filtered = useMemo(() => {
    const q = (filters.q || "").toLowerCase().trim();

    return menu.filter((item) => {
      const byCategory =
        !filters.category || filters.category === "All"
          ? true
          : item.category === filters.category;

      const byQuery = !q
        ? true
        : (item.name || "").toLowerCase().includes(q) ||
          (item.category || "").toLowerCase().includes(q);

      return byCategory && byQuery;
    });
  }, [filters]); // menu adalah import statis, tak perlu di-deps

  return (
    // gunakan section + spacing; container/padding sudah dari layout.tsx
    <section className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-semibold">Menu</h1>

      <FilterBar items={menu} value={filters} onChange={setFilters} />

      {/* Ringkasan hasil */}
      <p className="text-sm text-gray-600">
        Menampilkan {filtered.length} dari {menu.length} item
        {filters.category && filters.category !== "All"
          ? ` • Kategori: ${filters.category}`
          : ""}
        {filters.q ? ` • Pencarian: “${filters.q}”` : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-center text-gray-600">
          Tidak ada menu yang cocok.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map((item) => (
            <MenuCard key={item.id} data={item} />
          ))}
        </div>
      )}
    </section>
  );
}
