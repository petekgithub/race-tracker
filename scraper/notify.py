#!/usr/bin/env python3
"""Sends upcoming race notifications via Telegram."""

import json
import os
import sys
from datetime import date, timedelta
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

TOKEN = os.environ.get("TELEGRAM_TOKEN")
CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")
DATA_FILE = Path(__file__).parent.parent / "data" / "races.json"

DAYS_AHEAD = int(os.environ.get("NOTIFY_DAYS_AHEAD", 7))


def load_races() -> list[dict]:
    if not DATA_FILE.exists():
        print("races.json bulunamadı, önce scraper.py çalıştırın.")
        sys.exit(1)
    with open(DATA_FILE, encoding="utf-8") as f:
        data = json.load(f)
    return data.get("races", [])


def upcoming(races: list[dict], days: int) -> list[dict]:
    today = date.today()
    cutoff = today + timedelta(days=days)
    result = []
    for r in races:
        if not r.get("date"):
            continue
        try:
            race_date = date.fromisoformat(r["date"])
        except ValueError:
            continue
        if today <= race_date <= cutoff and r.get("status") != "cancelled":
            result.append(r)
    result.sort(key=lambda x: x["date"])
    return result


def format_message(races: list[dict], days: int) -> str:
    if not races:
        return f"Önümüzdeki {days} günde kayda değer bir yarış yok."

    lines = [f"🏃 *Önümüzdeki {days} Günün Yarışları*\n"]
    for r in races:
        try:
            d = date.fromisoformat(r["date"])
            date_fmt = d.strftime("%-d %B")
        except Exception:
            date_fmt = r["date"]

        status = " ⚠️ ERTELENDİ" if r.get("status") == "postponed" else ""
        distances = ", ".join(r["distances"][:4]) if r.get("distances") else ""
        dist_str = f" — {distances}" if distances else ""
        location = r.get("location", "")
        loc_str = f" 📍 {location}" if location else ""
        link = r.get("link")
        name = r["name"]
        name_str = f"[{name}]({link})" if link else name

        lines.append(f"*{date_fmt}*{status}\n{name_str}{dist_str}{loc_str}\n")

    return "\n".join(lines)


def send_telegram(text: str):
    if not TOKEN or not CHAT_ID:
        print("TELEGRAM_TOKEN veya TELEGRAM_CHAT_ID eksik.")
        sys.exit(1)

    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    resp = requests.post(url, json={
        "chat_id": int(CHAT_ID),
        "text": text,
        "parse_mode": "Markdown",
        "disable_web_page_preview": True,
    }, timeout=10)
    resp.raise_for_status()
    print("Telegram bildirimi gönderildi.")


def main():
    races = load_races()
    upcoming_races = upcoming(races, DAYS_AHEAD)
    msg = format_message(upcoming_races, DAYS_AHEAD)
    print(msg)
    send_telegram(msg)


if __name__ == "__main__":
    main()
