"use client";
import Image from "next/image";
import Link from "next/link";
import { CATEGORY_META } from "@/data/score-weights";
import { formatRangeJa } from "@/lib/jst";
import type { FeedbackAction, OutingEvent } from "@/lib/types";
import { ScoreBadge } from "./ScoreBadge";

const ACTION_LABEL = { want: "行きたい", save: "残す", dismiss: "通す", went: "行った" } as const;
type CardAction = keyof typeof ACTION_LABEL;
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function EventCard({ event, lastAction, onAction }: {
  event: OutingEvent; lastAction?: FeedbackAction; onAction: (id: string, action: FeedbackAction) => void;
}) {
  const cat = CATEGORY_META[event.category];
  const actions: CardAction[] = ["want", "save", "dismiss", "went"];
  const picked = event.id.startsWith("ig-");
  const photoHref = event.officialUrl || event.instagramUrl || event.imageUrl;
  const addressText = event.address || `${event.prefecture}${event.city} ${event.venueName.replace("（サンプル）", "")}`;
  const cancelled = event.status === "cancelled";
  const postponed = event.status === "postponed";
  const statusLabel = event.statusText || (cancelled ? "中止" : postponed ? "延期" : "");

  const photo = event.imageUrl ? (
    <div className="relative aspect-[16/9] w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${event.imageUrl}")`, filter: cancelled ? "saturate(.68) brightness(.88)" : undefined }}
      />
      {cancelled && (
        <Image
          src={`${base}/cancelled-stamp.svg`}
          alt=""
          aria-hidden="true"
          width={720}
          height={320}
          unoptimized
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-auto w-[72%] -translate-x-1/2 -translate-y-1/2 -rotate-[12deg]"
        />
      )}
    </div>
  ) : null;

  return (
    <article className="card-shadow overflow-hidden rounded-[28px]" style={{ background: "var(--bg-elev)", border: "1px solid var(--line)" }}>
      {event.imageUrl && (
        photoHref ? (
          <a href={photoHref} target="_blank" rel="noreferrer" aria-label={event.title + "の公式情報を開く"} className="block">
            {photo}
          </a>
        ) : photo
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          <ScoreBadge score={event.score} />
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: "var(--chip)", color: "var(--muted)" }}>{cat.nameJa}</span>
              <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: "var(--chip)", color: "var(--muted)" }}>{event.city}</span>
              {cancelled && <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: "#b42318", color: "#fff" }}>{statusLabel}</span>}
              {postponed && <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: "#9a6700", color: "#fff" }}>{statusLabel}</span>}
              {event.isSample && <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>サンプル</span>}
              {picked && <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>インスタ</span>}
            </div>

            <h2 className="font-display text-[18px] leading-snug">
              {event.officialUrl ? (
                <a href={event.officialUrl} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                  {event.title.replace("【サンプル】", "")}
                </a>
              ) : event.title.replace("【サンプル】", "")}
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{formatRangeJa(event.startAt, event.endAt)}</p>
            <p className="text-sm">{event.venueName.replace("（サンプル）", "")}</p>
          </div>
        </div>

        {cancelled && (
          <div className="mt-3 rounded-[18px] px-3.5 py-3" style={{ background: "rgba(180, 35, 24, 0.10)", border: "1px solid rgba(180, 35, 24, 0.22)" }}>
            <p className="text-sm font-bold" style={{ color: "#b42318" }}>本日は中止</p>
            <p className="mt-1 text-xs leading-5" style={{ color: "var(--ink)" }}>{event.statusReason || "主催者発表により開催中止"}</p>
            {event.statusSourceUrl && (
              <a href={event.statusSourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-medium underline underline-offset-2" style={{ color: "#b42318" }}>
                中止情報を確認 ↗
              </a>
            )}
          </div>
        )}
        {postponed && (
          <div className="mt-3 rounded-[18px] px-3.5 py-3" style={{ background: "rgba(154, 103, 0, 0.10)", border: "1px solid rgba(154, 103, 0, 0.22)" }}>
            <p className="text-sm font-bold" style={{ color: "#9a6700" }}>開催延期</p>
            <p className="mt-1 text-xs leading-5">{event.statusReason || "主催者発表により延期"}</p>
          </div>
        )}

        <p className="mt-3 text-sm leading-7" style={{ color: "var(--ink)" }}>{event.aiComment}</p>
        <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
          豊橋から {event.distanceFromToyohashiKm}km / 車{event.driveMinutes}分 · {event.goNowReason}
        </p>

        <div className="mt-4 rounded-[20px] px-3.5 py-3" style={{ background: "var(--chip)" }}>
          <p className="text-[11px] tracking-[0.12em]" style={{ color: "var(--muted)" }}>会場住所</p>
          <p className="mt-1 text-sm leading-6">{addressText}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {event.officialUrl && (
              <a
                href={event.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full px-3 py-1.5 text-sm font-medium"
                style={{ background: "var(--accent)", color: "#fffaf1" }}
              >
                公式サイト ↗
              </a>
            )}
            {event.mapUrl && (
              <a
                href={event.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full px-3 py-1.5 text-sm font-medium"
                style={{ background: "var(--bg-elev)", color: "var(--ink)", border: "1px solid var(--line)" }}
              >
                Googleマップ ↗
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t px-4 py-3" style={{ borderColor: "var(--line)" }}>
        {!picked && (
          <Link
            href={`/event/${event.id}`}
            onClick={() => onAction(event.id, "open_detail")}
            className="rounded-full px-3 py-1.5 text-sm"
            style={{ background: "var(--ink)", color: "var(--bg)" }}
          >
            詳細
          </Link>
        )}
        {event.instagramUrl && (
          <a href={event.instagramUrl} target="_blank" rel="noreferrer" className="rounded-full px-3 py-1.5 text-sm" style={{ background: "var(--chip)", color: "var(--ink)" }}>
            Instagram
          </a>
        )}
        {event.xUrl && (
          <a href={event.xUrl} target="_blank" rel="noreferrer" className="rounded-full px-3 py-1.5 text-sm" style={{ background: "var(--chip)", color: "var(--ink)" }}>
            X
          </a>
        )}
        {actions.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => onAction(event.id, a)}
            className="rounded-full px-3 py-1.5 text-sm"
            style={{ background: lastAction === a ? "var(--accent)" : "var(--chip)", color: lastAction === a ? "#fffaf1" : "var(--ink)" }}
          >
            {ACTION_LABEL[a]}
          </button>
        ))}
      </div>
    </article>
  );
}
