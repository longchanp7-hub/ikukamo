import type { OutingEvent } from "./types";
import { jstInput } from "./jst";
import regions from "../../config/regions.json";

export type Origin = { name: string; latitude: number; longitude: number };
const CORE_ORIGINS: Origin[] = [
  { name: "豊橋市", latitude: 34.7692, longitude: 137.3915 },
  { name: "豊川市", latitude: 34.8268, longitude: 137.3756 },
  { name: "蒲郡市", latitude: 34.826, longitude: 137.226 },
  { name: "田原市", latitude: 34.669, longitude: 137.273 },
  { name: "新城市", latitude: 34.954, longitude: 137.5 },
  { name: "岡崎市", latitude: 34.956, longitude: 137.159 },
  { name: "浜松市", latitude: 34.7108, longitude: 137.7261 },
];
export const ORIGINS: Origin[] = [...CORE_ORIGINS, ...regions.cities.filter(c => !CORE_ORIGINS.some(o => o.name === c.name))];
export function inCollectionRegion(event: Pick<OutingEvent, "city">) { return regions.cities.some(c => c.name === event.city); }
export function freshForRecommendation(event: OutingEvent, now = Date.now()) {
  return !event.collectorSource || !event.collectionExpired && now - Date.parse(event.statusCheckedAt || event.updatedAt) <= 7 * 86400000;
}

const CHILD_CENTRIC_RE = /(子育て|育児|親子|幼児|児童|キッズ|こども|子ども|赤ちゃん|ベビー|読み聞かせ|ちびっこ|小学生向け|小学生対象)/;
const COMPETITIVE_SPORT_RE = /(野球|サッカー|フットサル|バスケット(?:ボール)?|バレーボール|バドミントン|卓球|テニス大会|陸上競技|マラソン|リレーマラソン|トライアスロン|自転車競技|ロードレース|柔道大会|剣道大会|空手大会|格闘技|新体操|くるくるスポーツ)/;
const BUSINESS_NOISE_RE = /(就職|求人|採用説明|事業者向け|企業向け|経営相談|創業相談|まちづくりセミナー|セミナー&ワークショップ)/;

export function recommendationEligible(event: OutingEvent): boolean {
  if (!event.collectorSource) return true;
  const text = `${event.title} ${event.description} ${event.venueName}`.normalize("NFKC");
  if (CHILD_CENTRIC_RE.test(text) || COMPETITIVE_SPORT_RE.test(text) || BUSINESS_NOISE_RE.test(text)) return false;
  const start = Date.parse(event.startAt), end = Date.parse(event.endAt);
  const durationDays = Number.isFinite(start) && Number.isFinite(end) ? (end - start) / 86400000 : 0;
  if (durationDays > 35 && event.adultOriented === false && (event.category === "local" || event.category === "other")) return false;
  return true;
}
export function validCoordinates(lat: number, lon: number) { return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180; }
export function distanceKm(a: Origin, b: Pick<OutingEvent, "latitude" | "longitude">): number | null {
  if (!validCoordinates(a.latitude, a.longitude) || !validCoordinates(b.latitude, b.longitude)) return null;
  const r = Math.PI / 180, dlat = (b.latitude - a.latitude) * r, dlon = (b.longitude - a.longitude) * r;
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(a.latitude * r) * Math.cos(b.latitude * r) * Math.sin(dlon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}
export type WeatherPoint = { time: string; temperature: number | null; probability: number | null; code: number | null };
export type Forecast = { fetchedAt: number; points: WeatherPoint[]; error?: string };
export type Forecasts = Record<string, Forecast>;
export function venueKey(e: Pick<OutingEvent, "latitude" | "longitude">) { return `${e.latitude.toFixed(2)},${e.longitude.toFixed(2)}`; }
export function visitTime(e: OutingEvent, selected: string): string | null {
  if (e.timePrecision === "date") return null;
  const t = Date.parse(`${selected}:00+09:00`), start = Date.parse(e.startAt), end = Date.parse(e.endAt);
  if (![t, start, end].every(Number.isFinite) || t >= end || jstInput(new Date(start)).slice(0, 10) > selected.slice(0, 10)) return null;
  return jstInput(new Date(Math.max(t, start))).slice(0, 13) + ":00";
}
export function weatherAt(e: OutingEvent, selected: string, forecasts: Forecasts): WeatherPoint | null {
  const f = forecasts[venueKey(e)], time = visitTime(e, selected);
  if (!time || !f || Date.now() - f.fetchedAt > 3600000 || f.error) return null;
  return f.points.find(p => p.time === time) ?? null;
}
export function isRainy(p: WeatherPoint | null) { return !!p && ((p.probability !== null && p.probability >= 50) || (p.code !== null && p.code >= 51)); }
export function venueLabel(e: OutingEvent) { return ({ indoor: "屋内", outdoor: "屋外", mixed: "屋内・屋外", unknown: "屋内外未確認" } as const)[e.venueKind ?? "unknown"]; }
export function confirmedIndoor(e: OutingEvent) { return e.venueKind === "indoor" && !!e.venueEvidenceUrl; }
export function weatherLabel(p: WeatherPoint | null) {
  if (!p || (p.code === null && p.probability === null && p.temperature === null)) return "予報不明";
  const sky = p.code === null ? "天候不明" : p.code <= 1 ? "晴れ" : p.code <= 3 ? "曇り" : p.code < 51 ? "霧" : p.code >= 95 ? "雷雨" : p.code >= 71 && p.code <= 77 ? "雪" : "雨・降水";
  return `${sky}${p.temperature === null ? "" : ` ${p.temperature}℃`}${p.probability === null ? "" : ` / 降水確率${p.probability}%`}`;
}
export function parseForecast(value: unknown, now = Date.now()): Forecast {
  const v = value as { hourly?: { time?: unknown[]; temperature_2m?: unknown[]; precipitation_probability?: unknown[]; weather_code?: unknown[] } };
  const h = v?.hourly;
  if (!h || !Array.isArray(h.time) || h.time.length < 1 || h.time.length > 400 || ![h.temperature_2m, h.precipitation_probability, h.weather_code].every(a => Array.isArray(a) && a.length === h.time!.length)) throw new Error("天気データの形式が変わりました");
  const num = (v: unknown, min: number, max: number) => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : null;
  return { fetchedAt: now, points: h.time.map((t, i) => {
    if (typeof t !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:00$/.test(t)) throw new Error("天気の時刻が不正です");
    return { time: t, temperature: num(h.temperature_2m![i], -100, 70), probability: num(h.precipitation_probability![i], 0, 100), code: num(h.weather_code![i], 0, 99) };
  }) };
}
const CACHE_KEY = "ikukamo.venueWeather.v1";
const memoryCache: Forecasts = {};
let pending: Promise<Forecasts> | null = null;
async function fetchForecasts(events: OutingEvent[]): Promise<Forecasts> {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "{}");
    if (cached && typeof cached === "object" && !Array.isArray(cached)) {
      for (const [key, value] of Object.entries(cached).slice(0,20)) {
        const f = value as Forecast;
        if (!/^-?\d+\.\d{2},-?\d+\.\d{2}$/.test(key) || !f || !Number.isFinite(f.fetchedAt) || f.fetchedAt > Date.now() || !Array.isArray(f.points) || f.points.length > 400) continue;
        if (f.error !== undefined && typeof f.error !== "string") continue;
        if (!f.points.every(p => p && typeof p.time === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:00$/.test(p.time) && [p.temperature,p.probability,p.code].every(n => n === null || typeof n === "number" && Number.isFinite(n)))) continue;
        memoryCache[key] = f;
      }
    }
  } catch { /* Corrupt optional cache is ignored; saved personal data is unaffected. */ }
  const keys = [...new Set(events.filter(e => validCoordinates(e.latitude, e.longitude)).map(venueKey))].slice(0, 20);
  const now = Date.now();
  const missing = keys.filter(k => !memoryCache[k] || now - memoryCache[k].fetchedAt >= 1800000);
  // One bounded multi-location request; no background polling or paid fallback.
  if (missing.length) {
    try {
      const query = new URLSearchParams({ latitude: missing.map(k => k.split(",")[0]).join(","), longitude: missing.map(k => k.split(",")[1]).join(","), hourly: "temperature_2m,precipitation_probability,weather_code", timezone: "Asia/Tokyo", forecast_days: "14" });
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, { signal: AbortSignal.timeout(10000), cache: "no-store" });
      if (!res.ok) throw new Error(res.status === 429 ? "無料枠の制限中" : `天気取得失敗 (${res.status})`);
      const body = await res.json(); const list = Array.isArray(body) ? body : [body];
      if (list.length !== missing.length) throw new Error("会場の天気が一致しません");
      const parsed = list.map(v => parseForecast(v, now));
      missing.forEach((k, i) => { memoryCache[k] = parsed[i]; });
    } catch (error) {
      missing.forEach(k => { memoryCache[k] = { fetchedAt: now, points: [], error: error instanceof Error ? error.message : "天気取得失敗" }; });
    }
    // Bounded cache contains public venue coordinates only, never the user's GPS.
    for (const k of Object.keys(memoryCache)) if (!keys.includes(k)) delete memoryCache[k];
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache)); } catch { /* optional cache */ }
  }
  return Object.fromEntries(keys.map(k => [k, memoryCache[k]]));
}
export function loadForecasts(events: OutingEvent[]): Promise<Forecasts> {
  if (!pending) pending = fetchForecasts(events).finally(() => { pending = null; });
  return pending;
}
