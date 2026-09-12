"use client";
import { useMemo, useState } from "react";
import { EventCard } from "@/components/EventCard";
import { eventsInBucket, BUCKET_LABELS } from "@/lib/time-buckets";
import { pickTodayGo } from "@/lib/today-picks";
import { latestActionMap, loadFeedback, saveFeedbackRecord } from "@/lib/feedback";
import type { FeedbackAction, OutingEvent, TimeBucket, UserFeedback } from "@/lib/types";

const TABS: TimeBucket[] = ["today", "tomorrow", "this_week", "this_weekend", "next_week", "later"];

export function HomeClient({ events }: { events: OutingEvent[] }) {
  const [feedback, setFeedback] = useState<UserFeedback[]>(() => typeof window === "undefined" ? [] : loadFeedback());
  const [tab, setTab] = useState<TimeBucket>("today");
  const [picks, setPicks] = useState<OutingEvent[] | null>(null);
  const [emptyPick, setEmptyPick] = useState(false);
  const actions = latestActionMap(feedback);
  const visible = useMemo(() => events.filter((e) => actions[e.id] !== "dismiss"), [events, actions]);
  const list = eventsInBucket(visible, tab);
  function onAction(id: string, action: FeedbackAction) {
    setFeedback((prev) => [...prev, saveFeedbackRecord(id, action)]);
  }
  function handleToday() {
    const selected = pickTodayGo(visible, feedback);
    setPicks(selected);
    setEmptyPick(selected.length === 0);
    if (selected.length) setTab("today");
  }
  return (
    <div className="mx-auto max-w-lg px-4 pb-16 pt-6">
      <header className="mb-5">
        <p className="text-xs tracking-[0.2em]" style={{ color: "var(--muted)" }}>TOYOHASHI BASE</p>
        <h1 className="mt-1 text-3xl font-semibold">行くかも</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>人気より「自分が行きそうか」</p>
      </header>
      <button type="button" onClick={handleToday} className="mb-5 w-full rounded-3xl py-4 text-lg font-semibold" style={{ background: "var(--accent)", color: "#fffaf1" }}>今日どこ行く？</button>
      {emptyPick && <p className="mb-4 rounded-2xl px-4 py-3 text-sm" style={{ background: "var(--chip)" }}>今日は特に強いイベントなし</p>}
      {picks && picks.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-medium" style={{ color: "var(--muted)" }}>今から行ける候補</h2>
          <div className="space-y-3">{picks.map((e) => <EventCard key={"p"+e.id} event={e} lastAction={actions[e.id]} onAction={onAction} />)}</div>
        </section>
      )}
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {TABS.map((key) => (
          <button key={key} type="button" onClick={() => setTab(key)} className="shrink-0 rounded-full px-3 py-1.5 text-sm"
            style={{ background: tab === key ? "var(--ink)" : "var(--chip)", color: tab === key ? "var(--bg)" : "var(--ink)" }}>
            {BUCKET_LABELS[key]}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {list.length === 0 ? <p className="rounded-2xl px-4 py-8 text-center text-sm" style={{ background: "var(--chip)" }}>この期間の候補はありません</p>
          : list.map((e) => <EventCard key={e.id} event={e} lastAction={actions[e.id]} onAction={onAction} />)}
      </div>
    </div>
  );
}
