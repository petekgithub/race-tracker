"use client";

import { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import RaceCard from "./RaceCard";
import type { ScheduledRace } from "@/types";

const TYPE_FILTERS = ["Tümü", "Bu Hafta", "Bu Ay", "Trail", "Yol", "Ultra"] as const;
type TypeFilter = typeof TYPE_FILTERS[number];

type Region = "all" | "tr" | "world";

const REGIONS: { value: Region; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "tr", label: "🇹🇷 Türkiye" },
  { value: "world", label: "🌍 Dünya" },
];

const PAGE_SIZE = 12;

function matchesTypeFilter(race: ScheduledRace, filter: TypeFilter): boolean {
  if (filter === "Tümü") return true;

  const raceDate = new Date(race.date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (filter === "Bu Hafta") {
    const diff = (raceDate.getTime() - today.getTime()) / 86400000;
    return diff >= 0 && diff <= 7;
  }

  if (filter === "Bu Ay") {
    return raceDate.getFullYear() === today.getFullYear() && raceDate.getMonth() === today.getMonth();
  }

  const name = race.name.toLowerCase();
  if (filter === "Trail") return name.includes("trail") || name.includes("dağ") || name.includes("ultra");
  if (filter === "Yol") return name.includes("maraton") || name.includes("koşu") || name.includes("run");
  if (filter === "Ultra") return name.includes("ultra") || race.distances.some(d => parseFloat(d) >= 50);

  return true;
}

export default function RaceList({ races }: { races: ScheduledRace[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("Tümü");
  const [region, setRegion] = useState<Region>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return races
      .filter(r => region === "all" || (region === "tr" ? r.is_turkey : !r.is_turkey))
      .filter(r => matchesTypeFilter(r, typeFilter))
      .filter(r => {
        if (!search) return true;
        const q = search.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.location.toLowerCase().includes(q);
      });
  }, [races, search, typeFilter, region]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetPage() { setPage(1); }

  return (
    <div className="flex flex-col gap-4">
      {/* Region tabs */}
      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-fit">
        {REGIONS.map(r => (
          <button
            key={r.value}
            onClick={() => { setRegion(r.value); resetPage(); }}
            className={`text-xs px-3 py-1.5 rounded-md transition-all cursor-pointer font-medium ${
              region === r.value
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); resetPage(); }}
          placeholder="Yarış veya şehir ara..."
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Type filters */}
      <div className="flex gap-2 flex-wrap">
        {TYPE_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => { setTypeFilter(f); resetPage(); }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
              typeFilter === f
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500">{filtered.length} yarış bulundu</p>

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-12">Kriterlere uyan yarış bulunamadı.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visible.map((r, i) => (
              <RaceCard key={i} race={r} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="text-sm text-zinc-600 dark:text-zinc-400 min-w-[80px] text-center">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
