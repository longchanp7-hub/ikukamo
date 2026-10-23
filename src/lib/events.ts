import { DAILY_CURATED_EVENTS } from "@/data/daily-curated-events";
import { LIVE_EVENTS } from "@/data/live-events";
import { LATE_OCTOBER_2026_EVENTS } from "@/data/late-october-2026-events";
import { SEED_EVENTS } from "@/data/seed-events";
import { mergeDuplicateEvents } from "@/lib/dedupe";
import { upcomingEvents } from "@/lib/time-buckets";
import type { OutingEvent } from "@/lib/types";
import { withVenueEvidence } from "@/data/venue-evidence";
import collected from "@/data/collected-events.json";

export function loadLocalEvents(): OutingEvent[] {
  const samples = process.env.NEXT_PUBLIC_SHOW_SAMPLE_EVENTS === "true" ? SEED_EVENTS : [];
  const merged = mergeDuplicateEvents([
    ...(collected.events as OutingEvent[]),
    ...DAILY_CURATED_EVENTS,
    ...LATE_OCTOBER_2026_EVENTS,
    ...LIVE_EVENTS,
    ...samples,
  ]);
  return merged.map(withVenueEvidence);
}
export function visibleEvents(now = new Date()): OutingEvent[] {
  return upcomingEvents(loadLocalEvents(), now);
}
export function findEvent(id: string): OutingEvent | undefined {
  return loadLocalEvents().find((e) => e.id === id || e.aliases?.includes(id));
}
