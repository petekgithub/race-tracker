export interface Race {
  date: string | null;
  name: string;
  location: string;
  distances: string[];
  status: "confirmed" | "postponed" | "cancelled";
  link: string | null;
  is_turkey?: boolean;
}

export type ScheduledRace = Omit<Race, "date"> & { date: string };

export interface RacesData {
  updated: string;
  count: number;
  races: Race[];
}
