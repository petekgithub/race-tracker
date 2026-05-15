"use client";

import { useState, useMemo, useRef } from "react";
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
  const gridRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() =>
    races
      .filter(r => region === "all" || (region === "tr" ? r.is_turkey : !r.is_turkey))
      .filter(r => matchesTypeFilter(r, typeFilter))
      .filter(r => {
        if (!search) return true;
        const q = search.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.location.toLowerCase().includes(q);
      }),
    [races, search, typeFilter, region]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetPage() { setPage(1); }

  function changePage(next: number) {
    setPage(next);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Sticky filter bar */}
      <div className="sticky top-14 z-10 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-900 -mx-4 px-4 py-4 flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
            {REGIONS.map(r => (
              <button
                key={r.value}
                onClick={() => { setRegion(r.value); resetPage(); }}
                className={`text-sm px-4 py-2 rounded-lg transition-all cursor-pointer font-medium ${
                  region === r.value
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); resetPage(); }}
              placeholder="Yarış veya şehir ara..."
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg pl-8 pr-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

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
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500">{filtered.length} yarış bulundu</p>

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-12">Kriterlere uyan yarış bulunamadı.</p>
      ) : (
        <>
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 gap-4 scroll-mt-4">
            {visible.map((r, i) => (
              <RaceCard key={i} race={r} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => changePage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="text-sm text-zinc-600 dark:text-zinc-400 min-w-[80px] text-center">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
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
