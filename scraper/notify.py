#!/usr/bin/env python3
"""Sends upcoming TR race notifications via Telegram."""

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
SITE_URL = os.environ.get("SITE_URL", "")
DATA_FILE = Path(__file__).parent.parent / "data" / "races.json"
DAYS_AHEAD = int(os.environ.get("NOTIFY_DAYS_AHEAD", 7))
MAX_RACES = 10


def load_races() -> list[dict]:
    if not DATA_FILE.exists():
        print("races.json bulunamadı, önce scraper.py çalıştırın.")
        sys.exit(1)
    with open(DATA_FILE, encoding="utf-8") as f:
        data = json.load(f)
    return data.get("races", [])


def upcoming_tr(races: list[dict], days: int) -> list[dict]:
    today = date.today()
    cutoff = today + timedelta(days=days)
    result = []
    for r in races:
        if not r.get("date") or not r.get("is_turkey"):
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
        return f"Önümüzdeki {days} günde Türkiye'de yarış yok."

    total = len(races)
    shown = races[:MAX_RACES]

    lines = [f"🏃 *Bu Haftanın Türkiye Yarışları*\n"]

    current_date = None
    for r in shown:
        try:
            d = date.fromisoformat(r["date"])
            date_fmt = d.strftime("%-d %B")
        except Exception:
            date_fmt = r["date"]

        if date_fmt != current_date:
            if current_date is not None:
                lines.append("")
            lines.append(f"📅 *{date_fmt}*")
            current_date = date_fmt

        status = " ⚠️ _ertelendi_" if r.get("status") == "postponed" else ""
        distances = " · ".join(r["distances"][:4]) if r.get("distances") else ""
        dist_str = f"\n🏅 {distances}" if distances else ""
        location = r.get("location", "")
        loc_str = f"\n📍 {location}" if location else ""
        link = r.get("link")
        name = r["name"]
        name_str = f"[{name}]({link})" if link else f"*{name}*"

        lines.append(f"{name_str}{status}{loc_str}{dist_str}")

    if total > MAX_RACES:
        extra = total - MAX_RACES
        site_str = f" → {SITE_URL}" if SITE_URL else ""
        lines.append(f"\n_+{extra} yarış daha{site_str}_")

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
    upcoming_races = upcoming_tr(races, DAYS_AHEAD)
    msg = format_message(upcoming_races, DAYS_AHEAD)
    print(msg)
    send_telegram(msg)


if __name__ == "__main__":
    main()
