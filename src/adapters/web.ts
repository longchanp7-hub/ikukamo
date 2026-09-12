import type { OutingEvent } from "@/lib/types";
export async function fetchFromWebSources(): Promise<{ events: OutingEvent[]; status: "skipped" | "ok" | "error"; reason?: string }> {
  if (process.env.DISABLE_WEB_FETCH === "1") return { events: [], status: "skipped", reason: "DISABLE_WEB_FETCH=1" };
  return { events: [], status: "ok", reason: "MVPでは公開Webクローラ未接続。シードのみ" };
}
