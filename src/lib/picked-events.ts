import { computeScore } from "@/lib/scoring";
import { mapsUrl } from "@/lib/region";
import type { CategoryId, OutingEvent } from "@/lib/types";
import { parseInstagramUrl } from "@/lib/instagram";

const KEY = "ikukamo.picked.v1";

const CITY_META: Record<string, { pref: string; lat: number; lng: number; km: number; drive: number }> = {
  "豊橋市": { pref: "愛知県", lat: 34.7692, lng: 137.3915, km: 1, drive: 8 },
  "豊川市": { pref: "愛知県", lat: 34.8268, lng: 137.3756, km: 9, drive: 22 },
  "蒲郡市": { pref: "愛知県", lat: 34.826, lng: 137.226, km: 22, drive: 35 },
  "田原市": { pref: "愛知県", lat: 34.669, lng: 137.273, km: 28, drive: 42 },
  "新城市": { pref: "愛知県", lat: 34.954, lng: 137.5, km: 32, drive: 50 },
  "岡崎市": { pref: "愛知県", lat: 34.956, lng: 137.159, km: 38, drive: 55 },
  "浜松市": { pref: "静岡県", lat: 34.7108, lng: 137.7261, km: 36, drive: 50 },
};

export function loadPickedEvents(): OutingEvent[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function savePickedEvents(events: OutingEvent[]) {
  window.localStorage.setItem(KEY, JSON.stringify(events));
}

export function createPickedEvent(input: {
  url: string; title: string; startAt: string; endAt: string; city: string; venueName: string; category: CategoryId; note?: string;
}): OutingEvent | null {
  const parsed = parseInstagramUrl(input.url);
  if (!parsed) return null;
  const city = input.city || "豊橋市";
  const meta = CITY_META[city] ?? CITY_META["豊橋市"];
  const now = new Date().toISOString();
  const id = `ig-${Date.now().toString(36)}`;
  const title = input.title.trim() || (parsed.type === "profile" ? `@${parsed.user}` : parsed.type === "tag" ? `#${parsed.tag}` : "インスタから拾った予定");
  const score = computeScore({
    category: input.category, city, prefecture: meta.pref,
    distanceFromToyohashiKm: meta.km, driveMinutes: meta.drive, limitedPeriod: true,
    foodAppeal: 55, adultOriented: true, snsBuzz: 60, rarity: 50,
  });
  return {
    id, title, description: input.note?.trim() || "インスタグラムから手動で拾った候補です。",
    category: input.category, startAt: input.startAt, endAt: input.endAt,
    venueName: input.venueName.trim() || "未記載", city, prefecture: meta.pref,
    latitude: meta.lat, longitude: meta.lng, distanceFromToyohashiKm: meta.km, driveMinutes: meta.drive,
    score, confidence: "unverified", instagramUrl: parsed.url, mapUrl: mapsUrl(meta.lat, meta.lng, city),
    aiComment: "自分で拾ったインスタの情報です。", goNowReason: "インスタで見つけた。",
    recommendReason: "自分が気になった投稿を予定に残しています。",
    isSample: false, weatherDependent: false, limitedPeriod: true, adultOriented: true,
    foodAppeal: 55, rarity: 50, snsBuzz: 60,
    sources: [{ id: `src-${id}`, eventId: id, sourceType: "instagram", sourceUrl: parsed.url, sourceName: "Instagram", fetchedAt: now }],
    createdAt: now, updatedAt: now,
  };
}

export function addPickedEvent(event: OutingEvent): OutingEvent[] {
  const next = [event, ...loadPickedEvents().filter((e) => e.instagramUrl !== event.instagramUrl)];
  savePickedEvents(next);
  return next;
}

export function removePickedEvent(id: string): OutingEvent[] {
  const next = loadPickedEvents().filter((e) => e.id !== id);
  savePickedEvents(next);
  return next;
}
