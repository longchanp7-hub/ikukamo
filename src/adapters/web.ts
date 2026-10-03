import type { OutingEvent } from "@/lib/types";
import collected from "@/data/collected-events.json";
export async function fetchFromWebSources() {
 return {events:collected.events as OutingEvent[],status:collected.sources.some(s=>s.errors>0)?"error":"ok",reason:"日次スクリプトが保存した検証済みスナップショットの読取。今ここで新規取得したものではありません。"};
}
