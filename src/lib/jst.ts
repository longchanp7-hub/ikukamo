const JST = "Asia/Tokyo";
export function nowJst(now: Date = new Date()): Date {
  return new Date(now.toLocaleString("en-US", { timeZone: JST }));
}
export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
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
  const x = new Date(base);
  x.setHours(hour, minute, 0, 0);
  return x;
}
