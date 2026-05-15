#!/usr/bin/env python3
"""Scrapes teamrunbo.com/yaristakvimimiz/ and saves races to data/races.json."""

import json
import re
from datetime import datetime, date
from pathlib import Path

import requests
from bs4 import BeautifulSoup

URL = "https://teamrunbo.com/yaristakvimimiz/"
DATA_FILE = Path(__file__).parent.parent / "data" / "races.json"


def parse_date(raw: str) -> str | None:
    """Parse date strings like '16.05.2026' or '16-17.05.2026'. Returns ISO of start date."""
    raw = raw.strip()
    # dd-dd.mm.yyyy or dd.mm.yyyy
    m = re.match(r"(\d{1,2})[-–\d]*\.(\d{2})\.(\d{4})", raw)
    if m:
        return f"{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"
    # dd.mm (no year — assume current/next year)
    m = re.match(r"(\d{1,2})[-–\d]*\.(\d{2})\b", raw)
    if m:
        day, month = int(m.group(1)), int(m.group(2))
        year = datetime.now().year
        try:
            d = date(year, month, day)
            if d < date.today():
                year += 1
            return f"{year}-{month:02d}-{day:02d}"
        except ValueError:
            pass
    return None


def detect_status(text: str) -> str:
    t = text.lower()
    if "iptal" in t:
        return "cancelled"
    if "ertelend" in t:
        return "postponed"
    return "confirmed"


def detect_type(icon: str) -> str:
    if "🌳" in icon or "🌋" in icon:
        return "trail"
    if "🛣" in icon:
        return "road"
    if "🚵" in icon:
        return "cycling"
    if "🏊" in icon:
        return "swimming"
    if "🧭" in icon:
        return "orienteering"
    if "🎢" in icon:
        return "skyrace"
    return "other"


def scrape() -> list[dict]:
    headers = {"User-Agent": "Mozilla/5.0 (compatible; RaceCalendarBot/1.0)"}
    resp = requests.get(URL, headers=headers, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    races = []

    # The page uses a WordPress table with columns:
    # [0] Type icon | [1] Race name | [2] Date | [3] Location | [4] Distances | [5] Notes
    for row in soup.find_all("tr"):
        cells = row.find_all("td")
        if len(cells) < 4:
            continue

        type_cell = cells[0].get_text(strip=True)
        name_cell_el = cells[1]
        name = name_cell_el.get_text(strip=True)
        date_raw = cells[2].get_text(strip=True) if len(cells) > 2 else ""
        location = cells[3].get_text(strip=True) if len(cells) > 3 else ""
        distances_raw = cells[4].get_text(strip=True) if len(cells) > 4 else ""
        notes = cells[5].get_text(strip=True) if len(cells) > 5 else ""

        if not name or len(name) < 3:
            continue
        # Skip header rows
        if name.lower() in ("yarış adı", "race name", ""):
            continue

        date_str = parse_date(date_raw)
        status = detect_status(name + " " + notes + " " + date_raw)
        race_type = detect_type(type_cell)

        # Extract link from name cell
        link = None
        for a in name_cell_el.find_all("a", href=True):
            if a["href"].startswith("http"):
                link = a["href"]
                break

        # Parse distances
        distances = [d.strip() for d in re.split(r"[,،]", distances_raw) if d.strip()] if distances_raw else []

        # Country flag
        is_turkey = "🇹🇷" in notes or "🇹🇷" in (cells[5].get_text() if len(cells) > 5 else "")

        races.append({
            "date": date_str,
            "name": name,
            "location": location,
            "distances": distances,
            "status": status,
            "type": race_type,
            "link": link,
            "is_turkey": is_turkey,
            "notes": notes[:120] if notes else "",
        })

    return races


def main():
    print(f"Fetching {URL} ...")
    races = scrape()
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump({
            "updated": datetime.now().isoformat(),
            "count": len(races),
            "races": races,
        }, f, ensure_ascii=False, indent=2)

    # Quick stats
    dated = sum(1 for r in races if r["date"])
    today = date.today()
    upcoming = sum(1 for r in races if r["date"] and date.fromisoformat(r["date"]) >= today)
    print(f"Kaydedildi: {len(races)} yarış ({dated} tarihli, {upcoming} yaklaşan) → {DATA_FILE}")


if __name__ == "__main__":
    main()
