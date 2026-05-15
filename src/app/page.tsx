import RaceList from "@/components/RaceList";
import ThemeToggle from "@/components/ThemeToggle";
import type { Race, RacesData, ScheduledRace } from "@/types";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

async function getRaces(): Promise<{ races: Race[]; updated: string | null }> {
  const dataPath = join(process.cwd(), "data", "races.json");
  if (!existsSync(dataPath)) return { races: [], updated: null };
  try {
    const data: RacesData = JSON.parse(readFileSync(dataPath, "utf-8"));
    return { races: data.races, updated: data.updated };
  } catch {
    return { races: [], updated: null };
  }
}

export default async function HomePage() {
  const { races, updated } = await getRaces();
  const today = new Date(new Date().setHours(0, 0, 0, 0));

  const upcoming = races.filter((r): r is ScheduledRace =>
    r.date !== null &&
    r.status !== "cancelled" &&
    new Date(r.date + "T00:00:00") >= today
  );

  const thisWeekCount = upcoming.filter(
    r => (new Date(r.date + "T00:00:00").getTime() - today.getTime()) / 86400000 <= 7
  ).length;

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
      {/* Compact sticky header */}
      <header className="sticky top-0 z-20 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🏃</span>
            <span className="font-bold text-base tracking-tight">Yarış Takvimi</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 shrink-0" />
                {upcoming.length} yaklaşan
              </span>
              <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                {thisWeekCount} bu hafta
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {races.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-lg mb-2">Veri bulunamadı</p>
            <p className="text-sm">Önce scraper&apos;ı çalıştırın:</p>
            <code className="text-xs bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded mt-2 inline-block">
              python3 scraper/scraper.py
            </code>
          </div>
        ) : (
          <RaceList races={upcoming} />
        )}
      </div>

      <footer className="border-t border-zinc-100 dark:border-zinc-900 mt-8">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-600">
          <span>Veri kaynağı: teamrunbo.com</span>
          <span>made by hellopettek</span>
          {updated && <span>Son güncelleme: {new Date(updated).toLocaleString("tr-TR")}</span>}
        </div>
      </footer>
    </main>
  );
}
