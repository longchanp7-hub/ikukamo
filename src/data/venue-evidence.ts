// Only explicit venue evidence. weatherDependent=false does not establish indoor use.
import type { OutingEvent } from "@/lib/types";
const evidence: Record<string, Pick<OutingEvent, "venueKind" | "venueEvidenceUrl">> = {
  "toyohashi-have-a-good-day-2026": { venueKind: "indoor", venueEvidenceUrl: "https://toyohashi-at.jp/event/performance.php?id=2102" },
  "hamamatsu-yamaha-jazz-festival-2026": { venueKind: "indoor", venueEvidenceUrl: "https://www.yamaha.com/ja/news_release/2026/26071401/" },
  "toyohashi-riverside-festival-2026-10-03": { venueKind: "outdoor", venueEvidenceUrl: "https://riverside-fes.com/" },
};
export function withVenueEvidence(event: OutingEvent): OutingEvent { return { ...event, ...(evidence[event.id] ?? {}) }; }
