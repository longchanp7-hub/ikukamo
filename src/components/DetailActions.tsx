"use client";
import { useState } from "react";
import { loadFeedback, latestActionMap, saveFeedbackRecord } from "@/lib/feedback";
import type { FeedbackAction } from "@/lib/types";
export function DetailActions({ eventId }: { eventId: string }) {
  const [last, setLast] = useState<FeedbackAction | undefined>(() =>
    typeof window === "undefined" ? undefined : latestActionMap(loadFeedback())[eventId],
  );
  const items: { action: FeedbackAction; label: string }[] = [
    { action: "want", label: "行きたい" }, { action: "save", label: "保存" },
    { action: "dismiss", label: "興味なし" }, { action: "went", label: "行った" },
  ];
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {items.map((it) => (
        <button key={it.action} type="button" onClick={() => { saveFeedbackRecord(eventId, it.action); setLast(it.action); }}
          className="rounded-full px-4 py-2 text-sm"
          style={{ background: last === it.action ? "var(--accent)" : "var(--chip)", color: last === it.action ? "#fffaf1" : "var(--ink)" }}>
          {it.label}
        </button>
      ))}
    </div>
  );
}
