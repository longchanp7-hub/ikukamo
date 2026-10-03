"use client";
import { useEffect, useMemo, useState } from "react";
import { EventCard } from "./EventCard";
import { InstagramPickup } from "./InstagramPickup";
import { InstallApp } from "./InstallApp";
import { PlanningControls } from "./PlanningControls";
import { PersonalLibrary } from "./PersonalLibrary";
import { eventsInBucket, BUCKET_LABELS, upcomingEvents } from "@/lib/time-buckets";
import { upcomingByDate } from "@/lib/schedule";
import { pickTodayGo } from "@/lib/today-picks";
import { latestActionMap, loadFeedback, saveFeedbackRecord } from "@/lib/feedback";
import { loadPickedEvents } from "@/lib/picked-events";
import { PERSONAL_CHANGED } from "@/lib/personal-store";
import { jstInput } from "@/lib/jst";
import { ORIGINS, confirmedIndoor, distanceKm, loadForecasts, visitTime, type Origin, type Forecasts } from "@/lib/outing-context";
import type { FeedbackAction, OutingEvent, TimeBucket, UserFeedback } from "@/lib/types";
import { CollectionStatus } from "./CollectionStatus";
import { inCollectionRegion, freshForRecommendation } from "@/lib/outing-context";
import regions from "../../config/regions.json";

type Screen = "home" | "today" | "pickup" | "library";
type Filter = "schedule" | TimeBucket;
const FILTERS: Filter[] = ["schedule", "today", "tomorrow", "this_week", "this_weekend", "next_week", "later"];
const LABELS = { schedule: "すべて", ...BUCKET_LABELS };
export function HomeClient({ events }: { events: OutingEvent[] }) {
  const [feedback, setFeedback] = useState<UserFeedback[]>([]);
  const [picked, setPicked] = useState<OutingEvent[]>([]);
  const [screen, setScreen] = useState<Screen>("home");
  const [tab, setTab] = useState<Filter>("schedule");
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState<Origin>(ORIGINS[0]);
  const [visit, setVisit] = useState("");
  const [indoor, setIndoor] = useState(false), [nearby, setNearby] = useState(false), [visitOnly, setVisitOnly] = useState(false);
  const [forecasts, setForecasts] = useState<Forecasts>({});
  const [weather, setWeather] = useState(""), [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<OutingEvent | undefined>();
  const [now, setNow] = useState<Date | undefined>();
  const [pickRequested, setPickRequested] = useState(false);
  const [city, setCity] = useState("");
  useEffect(() => {
    setVisit(jstInput()); setNow(new Date());
    const reload = () => { try { setFeedback(loadFeedback()); setPicked(loadPickedEvents()); setError(""); } catch (e) { setError(String(e)); } };
    reload();
    window.addEventListener("storage", reload); window.addEventListener(PERSONAL_CHANGED, reload);
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => { clearInterval(timer); window.removeEventListener("storage", reload); window.removeEventListener(PERSONAL_CHANGED, reload); };
  }, []);
  const all = useMemo(() => [...picked, ...events].filter((e, i, a) => a.findIndex(x => x.id === e.id) === i), [picked, events]);
  const actions = useMemo(() => latestActionMap(feedback, all), [feedback, all]);
  const visible = useMemo(() => all.filter(e => (e.id.startsWith("ig-") || inCollectionRegion(e)) && freshForRecommendation(e, now?.getTime()) && (!city || e.city === city) && e.cadence !== "regular" && e.cadence !== "seasonal_series" && actions[e.id] !== "dismiss" && (!indoor || confirmedIndoor(e)) && (!visitOnly || !!visitTime(e, visit))), [all, actions, indoor, visitOnly, visit, now, city]);
  function sorted(list: OutingEvent[]) { return nearby ? [...list].sort((a,b) => (distanceKm(origin,a) ?? Infinity) - (distanceKm(origin,b) ?? Infinity)) : list; }
  const list = now ? (tab === "schedule" ? upcomingEvents(visible, now) : eventsInBucket(visible, tab, now)) : [];
  const groups = now ? upcomingByDate(visible, now) : [];
  const selectedDate = new Date(visit + ":00+09:00");
  const picks = pickRequested && Number.isFinite(+selectedDate) ? pickTodayGo(visible, feedback, selectedDate, 3, origin, forecasts, visit) : [];
  function onAction(id: string, action: FeedbackAction) {
    try { saveFeedbackRecord(id, action); setFeedback(loadFeedback()); setError(""); } catch (e) { setError(String(e)); }
  }
  function card(e: OutingEvent, prefix = "") {
    return <EventCard key={prefix + e.id} event={e} lastAction={actions[e.id]} onAction={onAction} origin={origin} visit={visit} forecasts={forecasts} />;
  }
  async function loadWeather() {
    setBusy(true);
    try {
      const f = await loadForecasts(visible); setForecasts(f);
      const failures = Object.values(f).filter(v => v.error);
      setWeather(failures.length ? "予報が不明の会場があります（" + failures[0].error + "）。30分後に再試行できます。" : "会場ごとの予報を取得しました。各カードに取得時刻と訪問時間帯を表示します。");
    } catch (e) { setWeather("予報不明：" + String(e)); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto min-h-dvh max-w-lg px-4 safe-top" style={{ paddingBottom: "calc(92px + env(safe-area-inset-bottom))" }}>
    <header className="mb-5 pt-2">
      <p className="text-[11px] tracking-[0.28em]" style={{ color: "var(--muted)" }}>TOYOHASHI & NEARBY</p>
      <div className="mt-1 flex items-end justify-between"><h1 className="font-display text-[34px] leading-none">行くかも</h1><span className="text-xs">自分が行きそうか</span></div>
    </header>
    {error && <p role="alert" className="mb-3 rounded-2xl border p-3 text-sm">{error}</p>}
    {(screen === "home" || screen === "today") && <PlanningControls origin={origin} setOrigin={setOrigin} visit={visit} setVisit={setVisit} indoor={indoor} setIndoor={setIndoor} nearby={nearby} setNearby={setNearby} visitOnly={visitOnly} setVisitOnly={setVisitOnly} weather={weather} busy={busy} loadWeather={loadWeather} />}
    {(screen === "home" || screen === "today") && <label className="mb-4 block text-sm">開催地域<select aria-label="開催地域" className="ml-3 rounded-xl border p-2" value={city} onChange={e => setCity(e.target.value)}><option value="">東三河・西三河・浜松</option>{regions.cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select></label>}
    {screen !== "pickup" && <button type="button" onClick={() => { setEditing(undefined); setScreen("pickup"); }} className="mb-4 w-full rounded-[28px] py-3.5 text-sm font-medium" style={{ background: "var(--accent)", color: "#fffaf1" }}>インスタから拾う</button>}
    {screen === "home" && <>
      <InstallApp />
      <CollectionStatus />
      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 hide-scroll">
        {FILTERS.map(key => <button key={key} onClick={() => setTab(key)} type="button" className="shrink-0 rounded-full px-3.5 py-1.5 text-sm" style={{ background: tab === key ? "var(--ink)" : "var(--chip)", color: tab === key ? "var(--bg)" : "var(--ink)" }}>{LABELS[key]}</button>)}
      </div>
      {!now ? <Empty text="予定を準備中…" /> : !list.length ? <Empty text="この条件の候補はありません" /> :
        tab === "schedule" && !nearby ? <div className="space-y-7">{groups.map(g => <section key={g.key}><h2 className="mb-3 text-xs tracking-[0.18em]">{g.label}</h2><div className="space-y-3">{g.events.map(e => card(e))}</div></section>)}</div> :
        <div className="space-y-3">{sorted(list).map(e => card(e))}</div>}
    </>}
    {screen === "today" && <>
      <button type="button" onClick={() => { if (!Number.isFinite(+selectedDate)) setError("訪問日時を入力してください。"); else setPickRequested(true); }} className="mb-5 w-full rounded-[28px] py-5 font-display text-xl" style={{ background: "var(--ink)", color: "var(--bg)" }}>この日時ならどこ行く？</button>
      <p className="mb-3 text-xs">候補は最大3件。移動時間と当日の開場時刻は公式情報・地図で確認してください。</p>
      {pickRequested && (!picks.length ? <Empty text="この日時の強い候補はありません" /> : <div className="space-y-3">{picks.map(e => card(e,"pick"))}</div>)}
      <h2 className="mb-3 mt-6 text-sm">今日の一覧</h2>
      <div className="space-y-3">{now && sorted(eventsInBucket(visible, "today", now)).map(e => card(e))}</div>
    </>}
    {screen === "pickup" && <InstagramPickup key={editing?.id ?? "new"} existing={editing} onAdded={next => { setPicked(next); setEditing(undefined); setScreen("home"); setTab("schedule"); }} />}
    {screen === "library" && <PersonalLibrary events={all} actions={actions} onAction={onAction} onEdit={e => { setEditing(e); setScreen("pickup"); }} />}
    <nav className="fixed bottom-0 left-0 right-0 border-t safe-bottom" style={{ background: "var(--bg)", borderColor: "var(--line)", zIndex: 20 }}>
      <div className="mx-auto grid max-w-lg grid-cols-4 px-2 pt-2">{([["home","予定"],["today","今日"],["pickup","インスタ"],["library","保存"]] as const).map(([id,label]) => <button type="button" key={id} aria-current={screen === id ? "page" : undefined} onClick={() => { if(id === "pickup") setEditing(undefined); setScreen(id); }} className="pb-2 text-sm" style={{ color: screen === id ? "var(--accent)" : "var(--muted)" }}><span className="font-display text-lg">{label}</span></button>)}</div>
    </nav>
  </div>;
}
function Empty({ text }: { text: string }) { return <p className="rounded-[28px] px-4 py-10 text-center text-sm" style={{ background: "var(--chip)", color: "var(--muted)" }}>{text}</p>; }
