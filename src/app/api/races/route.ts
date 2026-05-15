import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { RacesData } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const dataPath = join(process.cwd(), "data", "races.json");

  if (!existsSync(dataPath)) {
    return NextResponse.json(
      { error: "Veri henüz hazır değil. python3 scraper/scraper.py çalıştırın." },
      { status: 503 }
    );
  }

  const data: RacesData = JSON.parse(readFileSync(dataPath, "utf-8"));
  return NextResponse.json(data);
}
