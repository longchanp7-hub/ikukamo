import type { OutingEvent, UserFeedback } from "@/lib/types";
import { latestActionMap } from "./feedback";
import { jstInput } from "./jst";
import { isEnded } from "./time-buckets";
import { ORIGINS, confirmedIndoor, distanceKm, isRainy, visitTime, weatherAt, type Origin, type Forecasts } from "./outing-context";

export function pickTodayGo(events: OutingEvent[], feedback: UserFeedback[] = [], now = new Date(), limit = 3, origin: Origin = ORIGINS[0], forecasts: Forecasts = {}, selected = jstInput(now)): OutingEvent[] {
  const actions = latestActionMap(feedback);
  return events.filter(e => !isEnded(e, now) && e.status !== "cancelled" && e.status !== "postponed" && actions[e.id] !== "dismiss" && !!visitTime(e, selected))
    .map(e => {
      const km = distanceKm(origin, e);
      let score = e.score + (actions[e.id] === "want" || actions[e.id] === "save" ? 8 : 0);
      if (km !== null) score += Math.max(-20, 8 - km / 4);
      if (isRainy(weatherAt(e, selected, forecasts))) score += confirmedIndoor(e) ? 18 : e.venueKind === "outdoor" ? -15 : -3;
      return { e, score };
    })
    .filter(x => x.score >= 54)
    .sort((a,b) => b.score - a.score || Date.parse(a.e.startAt) - Date.parse(b.e.startAt))
    .slice(0, Math.max(0,Math.min(3,limit))).map(x => x.e);
}
