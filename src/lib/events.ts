import { SEED_EVENTS } from "@/data/seed-events";
import { mergeDuplicateEvents } from "@/lib/dedupe";
import { passesRegionGate } from "@/lib/scoring";
import { upcomingEvents } from "@/lib/time-buckets";
import type { OutingEvent } from "@/lib/types";
export function loadLocalEvents(): OutingEvent[] {
  return mergeDuplicateEvents(SEED_EVENTS).filter((e) => passesRegionGate(e) || e.isSample);
}
export function visibleEvents(now = new Date()): OutingEvent[] {
  return upcomingEvents(loadLocalEvents(), now);
}
export function findEvent(id: string): OutingEvent | undefined {
  return loadLocalEvents().find((e) => e.id === id);
}
