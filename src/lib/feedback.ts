import type { FeedbackAction, UserFeedback } from "@/lib/types";
const KEY = "ikukamo.feedback.v1";
const CAT_KEY = "ikukamo.categoryWeights.v1";
export function loadFeedback(): UserFeedback[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
export function saveFeedbackRecord(eventId: string, action: FeedbackAction): UserFeedback {
  const item: UserFeedback = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, eventId, action, createdAt: new Date().toISOString() };
  window.localStorage.setItem(KEY, JSON.stringify([...loadFeedback(), item]));
  try {
    const map = JSON.parse(window.localStorage.getItem(CAT_KEY) || "{}");
    const delta = action === "dismiss" ? -0.06 : action === "want" || action === "went" ? 0.05 : 0.02;
    map[eventId] = (map[eventId] ?? 1) + delta;
    window.localStorage.setItem(CAT_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
  return item;
}
export function latestActionMap(list: UserFeedback[]): Record<string, FeedbackAction> {
  const map: Record<string, FeedbackAction> = {};
  for (const f of list) map[f.eventId] = f.action;
  return map;
}
