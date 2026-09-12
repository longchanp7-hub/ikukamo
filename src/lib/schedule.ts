import type { OutingEvent } from "@/lib/types";
import { upcomingEvents } from "@/lib/time-buckets";

const JST = "Asia/Tokyo";

export function jstDateKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function formatDayHeading(iso: string, now = new Date()): string {
  const date = new Intl.DateTimeFormat("ja-JP", {
    timeZone: JST,
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(new Date(iso));
  const year = new Intl.DateTimeFormat("ja-JP", { timeZone: JST, year: "numeric" }).format(new Date(iso));
  const nowYear = new Intl.DateTimeFormat("ja-JP", { timeZone: JST, year: "numeric" }).format(now);
  const todayKey = jstDateKey(now.toISOString());
  const key = jstDateKey(iso);
  const tomorrow = new Date(now.getTime() + 24 * 3600_000);
  const tomKey = jstDateKey(tomorrow.toISOString());
  const prefix = key === todayKey ? "今日 " : key === tomKey ? "明日 " : "";
  return year === nowYear ? `${prefix}${date}` : `${prefix}${year}${date}`;
}

export function upcomingByDate(events: OutingEvent[], now = new Date()): { key: string; label: string; events: OutingEvent[] }[] {
  const sorted = upcomingEvents(events, now).slice().sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt) || b.score - a.score);
  const groups = new Map<string, OutingEvent[]>();
  for (const e of sorted) {
    const key = jstDateKey(e.startAt);
    const list = groups.get(key) ?? [];
    list.push(e);
    groups.set(key, list);
  }
  return [...groups.entries()].map(([key, list]) => ({
    key,
    label: formatDayHeading(list[0].startAt, now),
    events: list,
  }));
}
