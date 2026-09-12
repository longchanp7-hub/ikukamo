"use client";
import Link from "next/link";
import { CATEGORY_META } from "@/data/score-weights";
import { formatRangeJa } from "@/lib/jst";
import type { FeedbackAction, OutingEvent } from "@/lib/types";
import { ScoreBadge } from "./ScoreBadge";

const ACTION_LABEL = { want: "行きたい", save: "残す", dismiss: "通す", went: "行った" } as const;
type CardAction = keyof typeof ACTION_LABEL;

export function EventCard({ event, lastAction, onAction }: {
  event: OutingEvent; lastAction?: FeedbackAction; onAction: (id: string, action: FeedbackAction) => void;
}) {
  const cat = CATEGORY_META[event.category];
  const actions: CardAction[] = ["want", "save", "dismiss", "went"];
  const picked = event.id.startsWith("ig-");
  return (
    <article className="card-shadow overflow-hidden rounded-[28px]" style={{ background: "var(--bg-elev)", border: "1px solid var(--line)" }}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <ScoreBadge score={event.score} />
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: "var(--chip)", color: "var(--muted)" }}>{cat.nameJa}</span>
              <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: "var(--chip)", color: "var(--muted)" }}>{event.city}</span>
              {event.isSample && <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>サンプル</span>}
              {picked && <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>インスタ</span>}
            </div>
            <h2 className="font-display text-[18px] leading-snug">{event.title.replace("【サンプル】", "")}</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{formatRangeJa(event.startAt, event.endAt)}</p>
            <p className="text-sm">{event.venueName.replace("（サンプル）", "")}</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-7" style={{ color: "var(--ink)" }}>{event.aiComment}</p>
        <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>豊橋から {event.distanceFromToyohashiKm}km / 車{event.driveMinutes}分 · {event.goNowReason}</p>
      </div>
      <div className="flex flex-wrap gap-2 border-t px-4 py-3" style={{ borderColor: "var(--line)" }}>
        {!picked && <Link href={`/event/${event.id}`} onClick={() => onAction(event.id, "open_detail")} className="rounded-full px-3 py-1.5 text-sm" style={{ background: "var(--ink)", color: "var(--bg)" }}>詳細</Link>}
        {event.instagramUrl && (
          <a href={event.instagramUrl} target="_blank" rel="noreferrer" className="rounded-full px-3 py-1.5 text-sm" style={{ background: "var(--accent)", color: "#fffaf1" }}>インスタ</a>
        )}
        {actions.map((a) => (
          <button key={a} type="button" onClick={() => onAction(event.id, a)} className="rounded-full px-3 py-1.5 text-sm"
            style={{ background: lastAction === a ? "var(--accent)" : "var(--chip)", color: lastAction === a ? "#fffaf1" : "var(--ink)" }}>
            {ACTION_LABEL[a]}
          </button>
        ))}
      </div>
    </article>
  );
}
