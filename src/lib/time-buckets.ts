import type { OutingEvent, TimeBucket } from "@/lib/types";
import { addDays, jstWeekday, startOfDay } from "@/lib/jst";

function statusRank(event: Pick<OutingEvent, "status">): number {
  if (event.status === "cancelled") return 2;
  if (event.status === "postponed") return 1;
  return 0;
}

export const BUCKET_LABELS: Record<TimeBucket, string> = {
  today: "今日", tomorrow: "明日", this_week: "今週", this_weekend: "今週末", next_week: "来週", later: "その先",
};

export function isEnded(event: Pick<OutingEvent, "endAt"> & { status?: string }, now = new Date()): boolean {
  return event.status === "ended" || !Number.isFinite(Date.parse(event.endAt)) || Date.parse(event.endAt) <= now.getTime();
}
export function upcomingEvents<T extends Pick<OutingEvent, "endAt">>(events: T[], now = new Date()): T[] {
  return events.filter((e) => !isEnded(e, now));
}
export function classifyBucket(event: Pick<OutingEvent, "startAt" | "endAt">, now = new Date()): TimeBucket | "ended" {
  if (isEnded(event, now)) return "ended";
  const today0 = startOfDay(now);
  const tomorrow0 = addDays(today0, 1);
  const dayAfter0 = addDays(today0, 2);
  const dow = jstWeekday(today0);
  const thisSat = addDays(today0, dow === 0 ? -1 : 6 - dow);
  const thisSunEnd = addDays(thisSat, 2);
  const thisWeekEnd = addDays(today0, dow === 0 ? 1 : 8 - dow);
  const nextWeekEnd = addDays(thisWeekEnd, 7);
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const overlaps = (from: Date, to: Date) => start.getTime() < to.getTime() && end.getTime() > from.getTime();
  if (overlaps(today0, tomorrow0)) return "today";
  if (overlaps(tomorrow0, dayAfter0)) return "tomorrow";
  if (overlaps(thisSat, thisSunEnd)) return "this_weekend";
  if (overlaps(today0, thisWeekEnd)) return "this_week";
  if (overlaps(thisWeekEnd, nextWeekEnd)) return "next_week";
  return "later";
}
export function eventsInBucket(events: OutingEvent[], bucket: TimeBucket, now = new Date()): OutingEvent[] {
  return upcomingEvents(events, now)
    .filter((e) => classifyBucket(e, now) === bucket)
    .sort((a, b) => statusRank(a) - statusRank(b) || b.score - a.score || +new Date(a.startAt) - +new Date(b.startAt));
}
