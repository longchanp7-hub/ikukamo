import type { FeedbackAction, UserFeedback } from "@/lib/types";
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
export function latestActionMap(list: UserFeedback[]): Record<string, FeedbackAction> {
  const map: Record<string, FeedbackAction> = Object.create(null);
  for (const f of list) if (f.action !== "open_detail") { if (f.action === "clear") delete map[f.eventId]; else map[f.eventId] = f.action; }
  return map;
}
