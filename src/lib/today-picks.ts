import type { OutingEvent, UserFeedback } from "@/lib/types";
import { isEnded } from "@/lib/time-buckets";

const MIN_STRONG_SCORE = 54;

export function pickTodayGo(events: OutingEvent[], feedback: UserFeedback[] = [], now = new Date(), limit = 5): OutingEvent[] {
  const hour = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" })).getHours();
  const dismissed = new Set(feedback.filter((f) => f.action === "dismiss").map((f) => f.eventId));
  const boosted = new Set(feedback.filter((f) => f.action === "want" || f.action === "save").map((f) => f.eventId));
  return events
    .filter((e) => !isEnded(e, now) && !dismissed.has(e.id))
    .filter((e) => new Date(e.startAt).getTime() <= now.getTime() + 12 * 3600_000)
    .filter((e) => new Date(e.endAt).getTime() > now.getTime() + 30 * 60_000)
    .filter((e) => now.getTime() + (e.driveMinutes + 10) * 60_000 < new Date(e.endAt).getTime())
    .map((e) => {
      let s = e.score;
      if (boosted.has(e.id)) s += 8;
      if (e.limitedPeriod) s += 4;
      if (e.weatherDependent) s -= 6;
      if (e.driveMinutes > 90) s -= 12;
      if (e.driveMinutes <= 30) s += 5;
      if (hour >= 18 && (e.category === "night_market" || e.category === "beer")) s += 6;
      if (hour < 11 && e.category === "morning_market") s += 8;
      return { e, s };
    })
    .filter((x) => x.s >= MIN_STRONG_SCORE)
    .sort((a, b) => b.s - a.s || a.e.driveMinutes - b.e.driveMinutes)
    .slice(0, limit)
    .map((x) => x.e);
}
