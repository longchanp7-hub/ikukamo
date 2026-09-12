import type { OutingEvent } from "@/lib/types";
function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "").replace(/[「」『』【】（）() ・ー−-]/g, "").replace(/サンプル|sample|仮/g, "");
}
export function eventFingerprint(title: string, city: string, startAt: string): string {
  return `${norm(title)}|${norm(city)}|${startAt.slice(0, 10)}`;
}
export function mergeDuplicateEvents(events: OutingEvent[]): OutingEvent[] {
  const map = new Map<string, OutingEvent>();
  for (const ev of events) {
    const key = eventFingerprint(ev.title, ev.city, ev.startAt);
    const existing = map.get(key);
    if (!existing) { map.set(key, ev); continue; }
    const sources = [...existing.sources];
    for (const s of ev.sources) {
      if (!sources.some((x) => x.sourceUrl === s.sourceUrl && x.sourceType === s.sourceType)) sources.push(s);
    }
    const better = ev.confidence === "confirmed" || (ev.confidence === "high" && existing.confidence === "unverified");
    map.set(key, {
      ...(better ? ev : existing), sources,
      officialUrl: existing.officialUrl || ev.officialUrl,
      xUrl: existing.xUrl || ev.xUrl,
      instagramUrl: existing.instagramUrl || ev.instagramUrl,
      imageUrl: existing.imageUrl || ev.imageUrl,
      score: Math.max(existing.score, ev.score),
    });
  }
  return [...map.values()];
}
