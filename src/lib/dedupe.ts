import type { EventStatus, OutingEvent } from "@/lib/types";

function norm(s: string): string {
  return s.normalize("NFKC").toLowerCase().replace(/\s+/g, "").replace(/[「」『』【】（）() ・ー−-]/g, "").replace(/サンプル|sample|仮/g, "");
}

function statusRank(status?: EventStatus): number {
  if (status === "cancelled") return 4;
  if (status === "postponed") return 3;
  if (status === "ended") return 2;
  if (status === "scheduled") return 1;
  return 0;
}

export function eventFingerprint(title: string, city: string, startAt: string): string {
  return `${norm(title)}|${norm(city)}|${startAt.slice(0, 10)}`;
}

export function mergeDuplicateEvents(events: OutingEvent[]): OutingEvent[] {
  const map = new Map<string, OutingEvent>();
  for (const ev of events) {
    const key = eventFingerprint(ev.title, ev.city, ev.startAt);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, ev);
      continue;
    }

    const sources = [...existing.sources];
    for (const s of ev.sources) {
      if (!sources.some((x) => x.sourceUrl === s.sourceUrl && x.sourceType === s.sourceType)) sources.push(s);
    }

    const better = !!ev.collectorSource && !ev.collectionWarning && Date.parse(ev.updatedAt) > Date.parse(existing.updatedAt) || !existing.collectorSource && (ev.confidence === "confirmed" || (ev.confidence === "high" && existing.confidence === "unverified"));
    const preferred = better ? ev : existing;
    const statusSource = existing.officialUrl && existing.officialUrl === ev.officialUrl && (existing.collectorSource || ev.collectorSource)
      ? Date.parse(existing.statusCheckedAt || existing.updatedAt) >= Date.parse(ev.statusCheckedAt || ev.updatedAt) ? existing : ev
      : statusRank(existing.status) >= statusRank(ev.status) ? existing : ev;
    const id = !existing.id.startsWith("auto-") ? existing.id : !ev.id.startsWith("auto-") ? ev.id : existing.id;

    map.set(key, {
      ...preferred,
      id,
      aliases: [...new Set([existing.id,ev.id,...(existing.aliases||[]),...(ev.aliases||[])])].filter(v=>v!==id),
      sources,
      officialUrl: existing.officialUrl || ev.officialUrl,
      xUrl: existing.xUrl || ev.xUrl,
      instagramUrl: existing.instagramUrl || ev.instagramUrl,
      imageUrl: existing.imageUrl || ev.imageUrl,
      score: Math.max(existing.score, ev.score),
      status: statusSource.status || preferred.status,
      statusText: statusSource.statusText || preferred.statusText,
      statusReason: statusSource.statusReason || preferred.statusReason,
      statusSourceUrl: statusSource.statusSourceUrl || preferred.statusSourceUrl,
      statusCheckedAt: statusSource.statusCheckedAt || preferred.statusCheckedAt,
    });
  }
  return [...map.values()];
}
