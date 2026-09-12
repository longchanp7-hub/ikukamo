"use client";
import { useMemo, useState } from "react";
import { EventCard } from "@/components/EventCard";
import { eventsInBucket, BUCKET_LABELS } from "@/lib/time-buckets";
import { upcomingByDate } from "@/lib/schedule";
import { pickTodayGo } from "@/lib/today-picks";
import { latestActionMap, loadFeedback, saveFeedbackRecord } from "@/lib/feedback";
import type { FeedbackAction, OutingEvent, TimeBucket, UserFeedback } from "@/lib/types";

type ViewTab = "schedule" | TimeBucket;
const TABS: ViewTab[] = ["schedule", "today", "tomorrow", "this_week", "this_weekend", "next_week", "later"];
const LABELS: Record<ViewTab, string> = { schedule: "予定", ...BUCKET_LABELS };

export function HomeClient({ events }: { events: OutingEvent[] }) {
  const [feedback, setFeedback] = useState<UserFeedback[]>(() => typeof window === "undefined" ? [] : loadFeedback());
  const [tab, setTab] = useState<ViewTab>("schedule");
  const [picks, setPicks] = useState<OutingEvent[] | null>(null);
  const [emptyPick, setEmptyPick] = useState(false);
  const actions = latestActionMap(feedback);
  const visible = useMemo(() => events.filter((e) => actions[e.id] !== "dismiss"), [events, actions]);
  const list = tab === "schedule" ? [] : eventsInBucket(visible, tab);
  const groups = tab === "schedule" ? upcomingByDate(visible) : [];
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
            {LABELS[key]}
          </button>
        ))}
      </div>
      {tab === "schedule" ? (
        groups.length === 0 ? (
          <p className="rounded-2xl px-4 py-8 text-center text-sm" style={{ background: "var(--chip)" }}>先の予定はありません</p>
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <section key={g.key}>
                <h2 className="mb-2 text-sm font-semibold tracking-wide" style={{ color: "var(--muted)" }}>{g.label}</h2>
                <div className="space-y-3">
                  {g.events.map((e) => <EventCard key={e.id} event={e} lastAction={actions[e.id]} onAction={onAction} />)}
                </div>
              </section>
            ))}
          </div>
        )
      ) : list.length === 0 ? (
        <p className="rounded-2xl px-4 py-8 text-center text-sm" style={{ background: "var(--chip)" }}>この期間の候補はありません</p>
      ) : (
        <div className="space-y-3">{list.map((e) => <EventCard key={e.id} event={e} lastAction={actions[e.id]} onAction={onAction} />)}</div>
      )}
    </div>
  );
}
