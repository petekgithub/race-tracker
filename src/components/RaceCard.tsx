import { MapPin, Calendar, ExternalLink, Clock } from "lucide-react";
import type { ScheduledRace } from "@/types";

function formatDate(iso: string): string {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("tr-TR", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return iso;
  }
}

function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(iso + "T00:00:00").getTime() - today.getTime()) / 86400000);
}

function DaysChip({ days }: { days: number }) {
  if (days === 0) return <span className="text-xs font-bold text-green-600 dark:text-green-400">Bugün!</span>;
  if (days <= 7) return <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">{days} gün kaldı</span>;
  return <span className="text-xs text-zinc-500 dark:text-zinc-400">{days} gün kaldı</span>;
}

export default function RaceCard({ race }: { race: ScheduledRace }) {
  const days = daysUntil(race.date);
  const isPostponed = race.status === "postponed";
  const isSoon = days <= 7;

  return (
    <div className={`relative rounded-xl border p-5 flex flex-col gap-3 transition-all ${
      isPostponed
        ? "border-yellow-300/60 dark:border-yellow-800/40 bg-yellow-50/50 dark:bg-yellow-950/10 opacity-70"
        : isSoon
        ? "border-green-300/60 dark:border-green-700/60 bg-green-50/30 dark:bg-green-950/20"
        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-zinc-400 dark:hover:border-zinc-600"
    }`}>
      {isPostponed && (
        <span className="absolute top-3 right-3 text-xs bg-yellow-100 dark:bg-yellow-900/60 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full">
          Ertelendi
        </span>
      )}

      <h3 className="font-semibold text-base leading-snug text-zinc-900 dark:text-white">{race.name}</h3>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Calendar size={13} />
          {formatDate(race.date)}
        </span>
        {race.location && (
          <span className="flex items-center gap-1.5">
            <MapPin size={13} />
            {race.location}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Clock size={13} />
          <DaysChip days={days} />
        </span>
      </div>

      {race.distances.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {race.distances.slice(0, 5).map((d, i) => (
            <span key={i} className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2.5 py-1 rounded-full">
              {d}
            </span>
          ))}
        </div>
      )}

      {race.link && (
        <a
          href={race.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto pt-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-1 w-fit"
        >
          Kayıt / Detay <ExternalLink size={13} />
        </a>
      )}
    </div>
  );
}
