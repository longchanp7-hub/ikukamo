"use client";
import { useEffect, useState } from "react";
import { PERSONAL_CHANGED } from "@/lib/personal-store";
import { loadFeedback, latestActionMap, saveFeedbackRecord } from "@/lib/feedback";
import type { FeedbackAction } from "@/lib/types";
export function DetailActions({ eventId, aliases }: { eventId: string; aliases?: string[] }) {
  const [last, setLast] = useState<FeedbackAction | undefined>();
  const [error, setError] = useState("");
  useEffect(() => { const sync = () => { try { setLast(latestActionMap(loadFeedback(),[{id:eventId,aliases}])[eventId]); } catch (e) { setError(String(e)); } }; sync(); window.addEventListener("storage", sync); window.addEventListener(PERSONAL_CHANGED,sync); return () => { window.removeEventListener("storage",sync); window.removeEventListener(PERSONAL_CHANGED,sync); }; }, [eventId,aliases]);
  const items: { action: FeedbackAction; label: string }[] = [
    { action: "want", label: "行きたい" }, { action: "save", label: "保存" },
    { action: "dismiss", label: "興味なし" }, { action: "went", label: "行った" },
    { action: "clear", label: "選択を取り消す" },
  ];
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {items.map((it) => (
        <button key={it.action} type="button" onClick={() => { try { saveFeedbackRecord(eventId, it.action); setLast(it.action === "clear" ? undefined : it.action); setError(""); } catch (e) { setError(String(e)); } }}
          className="rounded-full px-4 py-2 text-sm"
          style={{ background: last === it.action ? "var(--accent)" : "var(--chip)", color: last === it.action ? "#fffaf1" : "var(--ink)" }}>
          {it.label}
        </button>
      ))}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
