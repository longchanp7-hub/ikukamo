"use client";
import { useState } from "react";
import { exportBackup, parseBackup, restorePersonal, type PersonalData } from "@/lib/personal-store";
import type { FeedbackAction, OutingEvent } from "@/lib/types";
import { formatRangeJa } from "@/lib/jst";
import { EventCard } from "./EventCard";
const names: Record<string, string> = { want: "行きたい", save: "保存", went: "行った", dismiss: "非表示" };
export function PersonalLibrary({ events, actions, onAction, onEdit }: { events: OutingEvent[]; actions: Record<string, FeedbackAction>; onAction: (id: string, a: FeedbackAction) => void; onEdit: (e: OutingEvent) => void }) {
  const [filter, setFilter] = useState("want"), [error, setError] = useState(""), [preview, setPreview] = useState<PersonalData | null>(null), [agree, setAgree] = useState(false);
  const visible = filter === "picked" ? events.filter(e => e.id.startsWith("ig-")) : events.filter(e => actions[e.id] === filter);
  function download() {
    try { const url = URL.createObjectURL(new Blob([exportBackup()], { type: "application/json" })); const a = document.createElement("a"); a.href = url; a.download = `ikukamo-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000); setError(""); } catch (e) { setError(String(e)); }
  }
  return <section>
    <h2 className="font-display text-2xl">保存・履歴</h2>
    <p className="my-3 text-xs">このブラウザーだけに保存します。スマホ間・アカウント間の同期はありません。別端末へはJSONで移せます。現在地はバックアップに含みません。</p>
    <div className="mb-4 flex flex-wrap gap-2">{Object.entries({ ...names, picked: "自分で拾った予定" }).map(([id, name]) => <button key={id} type="button" className="rounded-full px-3 py-2" aria-pressed={filter === id} onClick={() => setFilter(id)} style={{ background: filter === id ? "var(--accent-soft)" : "var(--chip)" }}>{name}</button>)}</div>
    <div className="space-y-4">{visible.map(e => <div key={e.id}><EventCard event={e} lastAction={actions[e.id]} onAction={onAction} /><div className="mt-2 flex gap-3 text-sm"><button type="button" onClick={() => onAction(e.id, "clear")}>選択を取り消す・再表示</button>{e.id.startsWith("ig-") && <button type="button" onClick={() => onEdit(e)}>予定を編集</button>}</div></div>)}</div>
    {!visible.length && <p className="my-6 text-sm">該当する予定はありません。</p>}
    {Object.entries(actions).filter(([id, a]) => a === filter && !events.some(e => e.id === id)).map(([id]) => <div key={id} className="my-3 text-sm">掲載終了の予定（{id}）<button onClick={() => onAction(id, "clear")}>履歴を取り消す</button></div>)}
    <details className="planning mt-6 rounded-3xl p-4"><summary>バックアップ・復元</summary>
      <button type="button" className="my-3" onClick={download}>JSONを書き出す</button>
      <label className="block text-sm">JSONを読み込む<input type="file" accept="application/json,.json" className="my-2 block w-full" onChange={async e => { const f = e.target.files?.[0]; setPreview(null); setAgree(false); if (!f) return; try { if (f.size > 2000000) throw new Error("2MB以下にしてください"); setPreview(parseBackup(await f.text())); setError(""); } catch (err) { setError(String(err)); } e.target.value = ""; }} /></label>
      {preview && <div className="space-y-3 text-sm"><p>復元プレビュー：履歴 {preview.feedback.length}件・手動予定 {preview.picked.length}件</p>{preview.picked.slice(0,3).map(e => <p key={e.id}>{e.title} / {formatRangeJa(e.startAt,e.endAt)}</p>)}<label className="block"><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} /> 今の保存・履歴をこの内容で置き換える</label><button disabled={!agree} onClick={() => { try { restorePersonal(preview); setPreview(null); setAgree(false); setError("復元しました。復元前のデータはブラウザー内に安全コピーしました。"); } catch (e) { setError(String(e)); } }}>確認して復元</button></div>}
      {error && <p role="status" className="mt-3 text-sm">{error}</p>}
    </details>
  </section>;
}
