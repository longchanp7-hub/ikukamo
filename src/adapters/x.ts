import type { OutingEvent } from "@/lib/types";
export async function fetchFromX(): Promise<{ events: OutingEvent[]; status: "skipped" | "ok" | "error"; reason?: string }> {
  const token = process.env.X_BEARER_TOKEN || process.env.X_API_KEY;
  if (!token) return { events: [], status: "skipped", reason: "X_BEARER_TOKEN 未設定のため取得スキップ" };
  return { events: [], status: "ok", reason: "トークンはあるが検索クエリ未設定のため0件" };
}
