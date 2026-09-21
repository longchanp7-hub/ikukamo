import { officialInstagramEvents } from "@/adapters/instagram";
import { LIVE_EVENTS } from "@/data/live-events";
import { SEED_EVENTS } from "@/data/seed-events";
import { mergeDuplicateEvents } from "@/lib/dedupe";
import { passesRegionGate } from "@/lib/scoring";
import { upcomingEvents } from "@/lib/time-buckets";
import type { OutingEvent } from "@/lib/types";

export function loadLocalEvents(): OutingEvent[] {
  const samples = process.env.NEXT_PUBLIC_SHOW_SAMPLE_EVENTS === "true" ? SEED_EVENTS : [];
  const merged = mergeDuplicateEvents([...LIVE_EVENTS, ...officialInstagramEvents(), ...samples]);
  return merged.filter((e) => e.cadence !== "seasonal_series" && e.cadence !== "regular")
    .filter((e) => passesRegionGate(e) || e.isSample || e.sources.some((s) => s.sourceType === "instagram"));
}
export function visibleEvents(now = new Date()): OutingEvent[] {
  return upcomingEvents(loadLocalEvents(), now);
}
export function findEvent(id: string): OutingEvent | undefined {
  return loadLocalEvents().find((e) => e.id === id);
}
