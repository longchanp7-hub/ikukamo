import type { OutingEvent, UserFeedback } from "./types";

export const PERSONAL_KEY = "ikukamo.personal.v2";
export const PERSONAL_CHANGED = "ikukamo-personal-changed";
export type PersonalData = { version: 2; feedback: UserFeedback[]; picked: OutingEvent[] };
const categories = new Set("food car night_market morning_market festival wine sake beer ramen sushi hotel onsen music local other".split(" "));
const actions = new Set(["want", "save", "dismiss", "went", "open_detail", "clear"]);
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown) => typeof v === "string" && v.length <= 10000;
const date = (v: unknown) => str(v) && Number.isFinite(Date.parse(v as string));
function safeUrl(v: unknown): boolean {
  if (v === undefined || v === "") return true;
  try { const u = new URL(String(v)); return u.protocol === "https:" && !u.username && !u.password; } catch { return false; }
}
export function validatePersonal(value: unknown): PersonalData {
  if (!object(value) || value.version !== 2 || !Array.isArray(value.feedback) || !Array.isArray(value.picked) || value.feedback.length > 20000 || value.picked.length > 2000) throw new Error("保存データの形式が違います。元データは変更していません。");
  const ids = new Set<string>();
  for (const f of value.feedback) {
    if (!object(f) || !str(f.id) || !str(f.eventId) || !f.eventId || !actions.has(String(f.action)) || !date(f.createdAt)) throw new Error("履歴データが壊れています。");
  }
  for (const e of value.picked) {
    if (!object(e) || !str(e.id) || !(e.id as string).startsWith("ig-") || ids.has(e.id as string)) throw new Error("手動予定のIDが不正・重複しています。");
    ids.add(e.id as string);
    if (!["title", "description", "venueName", "city", "prefecture", "aiComment", "goNowReason", "recommendReason"].every(k => str(e[k])) || !e.title || !categories.has(String(e.category)) || !date(e.startAt) || !date(e.endAt) || Date.parse(String(e.endAt)) <= Date.parse(String(e.startAt))) throw new Error("手動予定の日時・内容が不正です。");
    if (!["latitude", "longitude", "score", "driveMinutes", "distanceFromToyohashiKm", "foodAppeal", "rarity", "snsBuzz"].every(k => typeof e[k] === "number" && Number.isFinite(e[k])) || Math.abs(Number(e.latitude)) > 90 || Math.abs(Number(e.longitude)) > 180) throw new Error("位置・数値が不正です。");
    if (!["officialUrl", "instagramUrl", "xUrl", "imageUrl", "mapUrl", "statusSourceUrl", "venueEvidenceUrl"].every(k => safeUrl(e[k])) || !Array.isArray(e.sources) || !e.sources.every(s => object(s) && str(s.sourceName) && safeUrl(s.sourceUrl))) throw new Error("リンク・出典が不正です。");
    if (!["address", "statusText", "statusReason", "priceText", "parkingText"].every(k => e[k] === undefined || str(e[k])) || !["isSample", "weatherDependent", "limitedPeriod", "adultOriented"].every(k => typeof e[k] === "boolean") || !["confirmed", "high", "unverified"].includes(String(e.confidence))) throw new Error("予定の補足情報が不正です。");
    if (e.status !== undefined && !["scheduled", "cancelled", "postponed", "ended"].includes(String(e.status))) throw new Error("開催状態が不正です。");
    if (e.venueKind !== undefined && !["indoor", "outdoor", "mixed", "unknown"].includes(String(e.venueKind))) throw new Error("会場区分が不正です。");
  }
  return value as PersonalData;
}
export function loadPersonal(storage: Storage = window.localStorage): PersonalData {
  try {
    const raw = storage.getItem(PERSONAL_KEY);
    return validatePersonal(raw ? JSON.parse(raw) : { version: 2, feedback: JSON.parse(storage.getItem("ikukamo.feedback.v1") || "[]"), picked: JSON.parse(storage.getItem("ikukamo.picked.v1") || "[]") });
  } catch (error) { throw new Error(`保存データを読み込めません。書き込みを止めています。バックアップで復元できます。${error instanceof Error ? error.message : ""}`); }
}
export function updatePersonal(change: (data: PersonalData) => PersonalData): PersonalData {
  const next = validatePersonal(change(loadPersonal()));
  const raw = JSON.stringify(next);
  if (raw.length > 2000000) throw new Error("保存データが大きすぎます。先にバックアップしてください。");
  try { window.localStorage.setItem(PERSONAL_KEY, raw); } catch { throw new Error("保存できませんでした。容量・ブラウザー設定を確認してください。入力と元データは維持しています。"); }
  window.dispatchEvent(new Event(PERSONAL_CHANGED));
  return next;
}
export function parseBackup(text: string): PersonalData {
  if (text.length > 2000000) throw new Error("バックアップは2MB以下にしてください。");
  const v = JSON.parse(text);
  if (!object(v) || v.format !== "ikukamo-backup" || v.version !== 2) throw new Error("行くかものバックアップではありません。");
  return validatePersonal(v.data);
}
export function exportBackup(): string { return JSON.stringify({ format: "ikukamo-backup", version: 2, exportedAt: new Date().toISOString(), data: loadPersonal() }, null, 2); }
export function restorePersonal(next: PersonalData) {
  const raw = JSON.stringify(validatePersonal(next));
  const before = JSON.stringify({ v2: localStorage.getItem(PERSONAL_KEY), feedbackV1: localStorage.getItem("ikukamo.feedback.v1"), pickedV1: localStorage.getItem("ikukamo.picked.v1") });
  try {
    localStorage.setItem(`${PERSONAL_KEY}.beforeRestore`, before);
    localStorage.setItem(PERSONAL_KEY, raw);
  } catch { throw new Error("復元できませんでした。上書き前のデータは維持しています。"); }
  window.dispatchEvent(new Event(PERSONAL_CHANGED));
}
