// components/FilterBar.jsx
"use client";
import { useMemo } from "react";

export default function FilterBar({
  items = [],
  value = { category: "All", q: "" },
  onChange,
}) {
  // Kategori unik
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [items]);

  const { category = "All", q = "" } = value || {};

  return (
    <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between mb-6">
      {/* Kategori - HP: scroll horizontal, Desktop: baris biasa */}
      <div className="flex gap-2 -mx-4 px-4 overflow-x-auto hide-scrollbar md:mx-0 md:px-0 md:overflow-visible md:flex-wrap">
        <div className="flex gap-2 whitespace-nowrap md:whitespace-normal">
          {categories.map((c) => {
            const active = (category || "All") === c;
            return (
              <button
                key={c}
                onClick={() => onChange?.({ ...value, category: c })}
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm sm:text-base transition
                  ${
                    active
                      ? "bg-[#d4a373] text-white border-[#d4a373]"
                      : "bg-white hover:bg-gray-50"
                  }`}
                aria-pressed={active}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full md:w-72">
        <input
          type="text"
          value={q}
          placeholder="Cari menu…"
          onChange={(e) => onChange?.({ ...value, q: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-[#d4a373]"
          aria-label="Pencarian menu"
        />
      </div>
    </div>
  );
}
