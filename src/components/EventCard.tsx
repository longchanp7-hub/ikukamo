"use client";
import Link from "next/link";
import { CATEGORY_META } from "@/data/score-weights";
import { formatRangeJa } from "@/lib/jst";
import type { FeedbackAction, OutingEvent } from "@/lib/types";
import { ScoreBadge } from "./ScoreBadge";

const CONF: Record<string, string> = { confirmed: "公式確認", high: "高", unverified: "未確認" };
const ACTION_LABEL = { want: "行きたい", save: "保存", dismiss: "興味なし", went: "行った" } as const;
type CardAction = keyof typeof ACTION_LABEL;

export function EventCard({ event, lastAction, onAction }: {
  event: OutingEvent; lastAction?: FeedbackAction; onAction: (id: string, action: FeedbackAction) => void;
}) {
  const cat = CATEGORY_META[event.category];
  const actions: CardAction[] = ["want", "save", "dismiss", "went"];
  return (
    <article className="card-shadow rounded-3xl p-4" style={{ background: "var(--bg-elev)", border: "1px solid var(--line)" }}>
      <div className="flex gap-3">
        <ScoreBadge score={event.score} />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
            <span>{cat.icon} {cat.nameJa}</span><span>·</span><span>確度 {CONF[event.confidence]}</span>
            {event.isSample && <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: "var(--chip)" }}>サンプル</span>}
          </div>
          <h2 className="text-[16px] font-semibold leading-snug">{event.title.replace("【サンプル】", "")}</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{formatRangeJa(event.startAt, event.endAt)}</p>
          <p className="text-sm">{event.city} {event.venueName.replace("（サンプル）", "")}</p>
          <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>豊橋から約{event.distanceFromToyohashiKm}km / 車約{event.driveMinutes}分</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed">{event.aiComment}</p>
      <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>今行く理由: {event.goNowReason}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={`/event/${event.id}`} onClick={() => onAction(event.id, "open_detail")} className="rounded-full px-3 py-1.5 text-sm" style={{ background: "var(--ink)", color: "var(--bg)" }}>詳細</Link>
        {actions.map((a) => (
          <button key={a} type="button" onClick={() => onAction(event.id, a)} className="rounded-full px-3 py-1.5 text-sm"
            style={{ background: lastAction === a ? "var(--accent)" : "var(--chip)", color: lastAction === a ? "var(--bg)" : "var(--ink)" }}>
            {ACTION_LABEL[a]}
          </button>
        ))}
      </div>
    </article>
  );
}
