import { fetchFromInstagram } from "@/adapters/instagram";
import { fetchFromX } from "@/adapters/x";
import { loadLocalEvents } from "@/lib/events";
import { upcomingEvents } from "@/lib/time-buckets";
import collected from "@/data/collected-events.json";
// Compatibility entry point: reads the verified snapshot. Network collection runs in scripts/ingest.mjs.
export async function runIngestion(now = new Date()) {
 const events=loadLocalEvents(), alive=upcomingEvents(events,now),x=await fetchFromX(),instagram=await fetchFromInstagram();
 return {fetched:collected.events.length,afterDedupe:events.length,afterExpiry:alive.length,afterGate:alive.length,adapters:{x,instagram,web:{status:"snapshot",reason:"検証済み保存データ。新規収集は日次スクリプトで実行"}},events:alive};
}
