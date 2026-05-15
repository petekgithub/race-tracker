import { Trophy, RefreshCw } from "lucide-react";
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
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-600/20 rounded-lg border border-indigo-200 dark:border-indigo-500/30">
                <Trophy size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">teamrunbo.com verisi</span>
            </div>
            <ThemeToggle />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Yarış Takvimi</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg mb-6">
            Türkiye ve dünya trail, ultra, maraton yarışları
          </p>

          <div className="flex gap-6">
            <div>
              <div className="text-2xl font-bold">{upcoming.length}</div>
              <div className="text-xs text-zinc-500">Yaklaşan yarış</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{thisWeekCount}</div>
              <div className="text-xs text-zinc-500">Bu hafta</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{races.length}</div>
              <div className="text-xs text-zinc-500">Toplam</div>
            </div>
          </div>

          {updated && (
            <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-600 flex items-center gap-1">
              <RefreshCw size={10} />
              Son güncelleme: {new Date(updated).toLocaleString("tr-TR")}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
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
    </main>
  );
}
