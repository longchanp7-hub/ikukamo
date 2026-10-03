import type { FeedbackAction, UserFeedback, OutingEvent } from "@/lib/types";
import { loadPersonal, updatePersonal } from "./personal-store";
export function loadFeedback(): UserFeedback[] {
  if (typeof window === "undefined") return [];
  return loadPersonal().feedback;
}
export function saveFeedbackRecord(eventId: string, action: FeedbackAction): UserFeedback {
  const item: UserFeedback = { id: crypto.randomUUID(), eventId, action, createdAt: new Date().toISOString() };
  updatePersonal(data => ({ ...data, feedback: [...data.feedback, item] }));
  return item;
}
export function latestActionMap(list: UserFeedback[], events: Pick<OutingEvent,"id"|"aliases">[] = []): Record<string, FeedbackAction> {
  const canonical = new Map(events.flatMap(e => (e.aliases || []).map(a => [a,e.id] as const)));
  const map: Record<string, FeedbackAction> = Object.create(null);
  for (const f of list) if (f.action !== "open_detail") { const id = canonical.get(f.eventId) || f.eventId; if (f.action === "clear") delete map[id]; else map[id] = f.action; }
  return map;
}
