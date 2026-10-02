const JST = "Asia/Tokyo";
export function nowJst(now: Date = new Date()): Date {
  return new Date(now);
}
export function startOfDay(d: Date): Date {
  return new Date(`${jstInput(d).slice(0, 10)}T00:00:00+09:00`);
}
export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86400000);
}
export function jstInput(d = new Date()): string {
  return new Date(d.getTime() + 9 * 3600000).toISOString().slice(0, 16);
}
export function jstWeekday(d: Date): number { return new Date(d.getTime() + 9 * 3600000).getUTCDay(); }
export function formatDateJa(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", { timeZone: JST, month: "numeric", day: "numeric", weekday: "short" }).format(new Date(iso));
}
export function formatTimeJa(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", { timeZone: JST, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
export function formatRangeJa(startIso: string, endIso: string): string {
  const fmt = new Intl.DateTimeFormat("ja-JP", { timeZone: JST, year: "numeric", month: "numeric", day: "numeric" });
  const same = fmt.format(new Date(startIso)) === fmt.format(new Date(endIso));
  if (same) return `${formatDateJa(startIso)} ${formatTimeJa(startIso)}–${formatTimeJa(endIso)}`;
  return `${formatDateJa(startIso)} ${formatTimeJa(startIso)} 〜 ${formatDateJa(endIso)} ${formatTimeJa(endIso)}`;
}
export function atHour(base: Date, hour: number, minute = 0): Date {
  return new Date(startOfDay(base).getTime() + (hour * 60 + minute) * 60000);
}
