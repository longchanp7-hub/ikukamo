"use client";
import { useMemo, useState } from "react";
import { INSTAGRAM_SEARCHES, instagramSearchUrl, parseInstagramUrl } from "@/lib/instagram";
import { addPickedEvent, createPickedEvent, loadPickedEvents, savePickedEvents } from "@/lib/picked-events";
import { jstInput } from "@/lib/jst";
import type { CategoryId, OutingEvent } from "@/lib/types";

const CITIES = ["豊橋市", "豊川市", "蒲郡市", "田原市", "新城市", "岡崎市", "浜松市"];
const CATS: { id: CategoryId; label: string }[] = [
  { id: "local", label: "地元" }, { id: "food", label: "食" }, { id: "festival", label: "祭り" },
  { id: "wine", label: "ワイン" }, { id: "beer", label: "ビール" }, { id: "car", label: "車" },
];

function toLocalInput(d: Date) {
  return jstInput(d);
}

export function InstagramPickup({ onAdded, existing }: { onAdded: (events: OutingEvent[]) => void; existing?: OutingEvent }) {
  const [url, setUrl] = useState(existing?.instagramUrl ?? "");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [venueName, setVenueName] = useState(existing?.venueName ?? "");
  const [city, setCity] = useState(existing?.city ?? "豊橋市");
  const [category, setCategory] = useState<CategoryId>(existing?.category ?? "local");
  const [startAt, setStartAt] = useState(() => toLocalInput(existing ? new Date(existing.startAt) : new Date()));
  const [endAt, setEndAt] = useState(() => {
    if (existing) return toLocalInput(new Date(existing.endAt));
    const d = new Date();
    d.setHours(d.getHours() + 4);
    return toLocalInput(d);
  });
  const [error, setError] = useState("");
  const parsed = useMemo(() => parseInstagramUrl(url), [url]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
    const event = createPickedEvent({
      url, title, venueName, city, category,
      startAt: new Date(startAt + ":00+09:00").toISOString(),
      endAt: new Date(endAt + ":00+09:00").toISOString(),
    });
    if (!event) {
      setError("InstagramのURLを貼ってください");
      return;
    }
    if (existing) {
      const current = loadPickedEvents();
      if (!current.some(e => e.id === existing.id)) throw new Error("この予定は別画面で変更されました。保存一覧から開き直してください。");
      if (current.some(e => e.id !== existing.id && e.instagramUrl === event.instagramUrl)) throw new Error("このリンクは別の予定に登録済みです。");
      const next = current.map(e => e.id === existing.id ? { ...event, id: existing.id, createdAt: existing.createdAt, sources: event.sources.map(s => ({ ...s, eventId: existing.id })) } : e);
      savePickedEvents(next); onAdded(next);
    } else onAdded(addPickedEvent(event));
    setUrl(""); setTitle(""); setVenueName(""); setError("");
    } catch (e) { setError("保存できませんでした。日時と保存容量を確認してください。" + String(e)); }
  }

  return (
    <section>
      <h2 className="font-display text-2xl">{existing ? "拾った予定を編集" : "インスタから拾う"}</h2>
      <p className="mt-1 mb-4 text-sm leading-6" style={{ color: "var(--muted)" }}>
        投稿を開いてリンクをコピーし、日時（日本時間）を入れて予定へ残します。投稿の自動取得は行いません。
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {INSTAGRAM_SEARCHES.map((s) => (
          <a key={s.query} href={instagramSearchUrl(s.query)} target="_blank" rel="noreferrer" className="rounded-full px-3 py-1.5 text-xs" style={{ background: "var(--chip)" }}>
            {s.label}
          </a>
        ))}
      </div>
      <form onSubmit={submit} className="card-shadow space-y-3 rounded-[28px] p-4" style={{ background: "var(--bg-elev)", border: "1px solid var(--line)" }}>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.instagram.com/p/…" className="w-full rounded-2xl px-3 py-3 text-sm" style={{ background: "var(--chip)", outline: "none" }} />
        {parsed && <p className="text-xs" style={{ color: "var(--muted)" }}>Instagramリンクの形式を確認しました</p>}
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトル" className="w-full rounded-2xl px-3 py-3 text-sm" style={{ background: "var(--chip)", outline: "none" }} />
        <input value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="場所（任意）" className="w-full rounded-2xl px-3 py-3 text-sm" style={{ background: "var(--chip)", outline: "none" }} />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs" style={{ color: "var(--muted)" }}>開始
            <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="mt-1 w-full rounded-2xl px-3 py-2 text-sm" style={{ background: "var(--chip)" }} />
          </label>
          <label className="text-xs" style={{ color: "var(--muted)" }}>終了
            <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className="mt-1 w-full rounded-2xl px-3 py-2 text-sm" style={{ background: "var(--chip)" }} />
          </label>
        </div>
        <div className="flex gap-2">
          <select value={city} onChange={(e) => setCity(e.target.value)} className="flex-1 rounded-2xl px-3 py-2 text-sm" style={{ background: "var(--chip)" }}>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value as CategoryId)} className="flex-1 rounded-2xl px-3 py-2 text-sm" style={{ background: "var(--chip)" }}>
            {CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        {error && <p className="text-xs" style={{ color: "var(--accent)" }}>{error}</p>}
        <button type="submit" className="w-full rounded-2xl py-3 text-sm font-medium" style={{ background: "var(--accent)", color: "#fffaf1" }}>{existing ? "変更を保存" : "予定に拾う"}</button>
      </form>
    </section>
  );
}
