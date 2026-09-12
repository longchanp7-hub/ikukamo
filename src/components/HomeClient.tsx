"use client";
import { useMemo, useState } from "react";
import { EventCard } from "@/components/EventCard";
import { InstagramPickup } from "@/components/InstagramPickup";
import { InstallApp } from "@/components/InstallApp";
import { eventsInBucket, BUCKET_LABELS } from "@/lib/time-buckets";
import { upcomingByDate } from "@/lib/schedule";
import { pickTodayGo } from "@/lib/today-picks";
import { latestActionMap, loadFeedback, saveFeedbackRecord } from "@/lib/feedback";
import { loadPickedEvents } from "@/lib/picked-events";
import type { FeedbackAction, OutingEvent, TimeBucket, UserFeedback } from "@/lib/types";

type Screen = "home" | "today" | "pickup";
type FilterTab = "schedule" | TimeBucket;
const FILTERS: FilterTab[] = ["schedule", "today", "tomorrow", "this_week", "this_weekend", "next_week", "later"];
const FILTER_LABELS: Record<FilterTab, string> = { schedule: "すべて", ...BUCKET_LABELS };

export function HomeClient({ events }: { events: OutingEvent[] }) {
  const [feedback, setFeedback] = useState<UserFeedback[]>(() => typeof window === "undefined" ? [] : loadFeedback());
  const [picked, setPicked] = useState<OutingEvent[]>(() => typeof window === "undefined" ? [] : loadPickedEvents());
  const [screen, setScreen] = useState<Screen>("home");
  const [tab, setTab] = useState<FilterTab>("schedule");
  const [picks, setPicks] = useState<OutingEvent[] | null>(null);
  const [emptyPick, setEmptyPick] = useState(false);
  const actions = latestActionMap(feedback);
  const visible = useMemo(() => {
    const merged = [...picked, ...events];
    const seen = new Set<string>();
    return merged.filter((e) => {
      if (actions[e.id] === "dismiss" || seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  }, [events, picked, actions]);
  const list = tab === "schedule" ? [] : eventsInBucket(visible, tab);
  const groups = tab === "schedule" ? upcomingByDate(visible) : [];
  const todayList = eventsInBucket(visible, "today");
  function onAction(id: string, action: FeedbackAction) {
    setFeedback((prev) => [...prev, saveFeedbackRecord(id, action)]);
  }
  function handleToday() {
    const selected = pickTodayGo(visible, feedback);
    setPicks(selected);
    setEmptyPick(selected.length === 0);
    setScreen("today");
  }
  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 safe-top" style={{ paddingBottom: "calc(92px + env(safe-area-inset-bottom))" }}>
      <header className="mb-5 pt-2">
        <p className="text-[11px] tracking-[0.28em]" style={{ color: "var(--muted)" }}>TOYOHASHI</p>
        <div className="mt-1 flex items-end justify-between">
          <h1 className="font-display text-[34px] leading-none">行くかも</h1>
          <span className="text-xs" style={{ color: "var(--muted)" }}>自分が行きそうか</span>
        </div>
      </header>

      {screen !== "pickup" && (
        <button type="button" onClick={() => setScreen("pickup")} className="mb-4 w-full rounded-[28px] py-3.5 text-sm font-medium" style={{ background: "var(--accent)", color: "#fffaf1" }}>
          インスタから拾う
        </button>
      )}

      {screen === "home" && (
        <>
          <InstallApp />
          <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 hide-scroll">
            {FILTERS.map((key) => (
              <button key={key} type="button" onClick={() => setTab(key)} className="shrink-0 rounded-full px-3.5 py-1.5 text-sm"
                style={{ background: tab === key ? "var(--ink)" : "var(--chip)", color: tab === key ? "var(--bg)" : "var(--ink)" }}>
                {FILTER_LABELS[key]}
              </button>
            ))}
          </div>
          {tab === "schedule" ? (
            groups.length === 0 ? <Empty text="先の予定はありません" /> : (
              <div className="space-y-7">
                {groups.map((g) => (
                  <section key={g.key}>
                    <h2 className="mb-3 text-xs tracking-[0.18em]" style={{ color: "var(--muted)" }}>{g.label}</h2>
                    <div className="space-y-3">{g.events.map((e) => <EventCard key={e.id} event={e} lastAction={actions[e.id]} onAction={onAction} />)}</div>
                  </section>
                ))}
              </div>
            )
          ) : list.length === 0 ? <Empty text="この期間の候補はありません" /> : (
            <div className="space-y-3">{list.map((e) => <EventCard key={e.id} event={e} lastAction={actions[e.id]} onAction={onAction} />)}</div>
          )}
        </>
      )}

      {screen === "today" && (
        <>
          <button type="button" onClick={handleToday} className="mb-5 w-full rounded-[28px] py-5 font-display text-xl" style={{ background: "var(--ink)", color: "var(--bg)" }}>今日どこ行く？</button>
          {emptyPick && <Empty text="今日は特に強いイベントなし" />}
          {picks && picks.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-3 text-xs tracking-[0.18em]" style={{ color: "var(--muted)" }}>今から行ける</h2>
              <div className="space-y-3">{picks.map((e) => <EventCard key={"p"+e.id} event={e} lastAction={actions[e.id]} onAction={onAction} />)}</div>
            </section>
          )}
          <h2 className="mb-3 text-xs tracking-[0.18em]" style={{ color: "var(--muted)" }}>今日の一覧</h2>
          {todayList.length === 0 ? <Empty text="今日の候補はありません" /> : (
            <div className="space-y-3">{todayList.map((e) => <EventCard key={e.id} event={e} lastAction={actions[e.id]} onAction={onAction} />)}</div>
          )}
        </>
      )}

      {screen === "pickup" && (
        <InstagramPickup onAdded={(next) => { setPicked(next); setScreen("home"); setTab("schedule"); }} />
      )}

      <nav className="fixed bottom-0 left-0 right-0 border-t safe-bottom" style={{ background: "color-mix(in srgb, var(--bg) 88%, transparent)", borderColor: "var(--line)", backdropFilter: "blur(18px)" }}>
        <div className="mx-auto grid max-w-lg grid-cols-3 px-2 pt-2">
          <NavBtn active={screen === "home"} onClick={() => setScreen("home")} label="予定" />
          <NavBtn active={screen === "today"} onClick={() => setScreen("today")} label="今日" />
          <NavBtn active={screen === "pickup"} onClick={() => setScreen("pickup")} label="インスタ" />
        </div>
      </nav>
    </div>
  );
}

function NavBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="pb-2 text-sm" style={{ color: active ? "var(--accent)" : "var(--muted)" }}>
      <span className="block font-display text-lg leading-none">{label}</span>
    </button>
  );
}
function Empty({ text }: { text: string }) {
  return <p className="rounded-[28px] px-4 py-10 text-center text-sm" style={{ background: "var(--chip)", color: "var(--muted)" }}>{text}</p>;
}
