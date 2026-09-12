import { describe, expect, it } from "vitest";
import { classifyBucket, isEnded, upcomingEvents } from "../src/lib/time-buckets";
const now = new Date("2026-09-12T13:00:00+09:00");
describe("date classification", () => {
  it("hides ended events", () => {
    expect(isEnded({ endAt: "2026-09-11T20:00:00+09:00" }, now)).toBe(true);
    expect(upcomingEvents([{ endAt: "2026-09-11T20:00:00+09:00" }], now)).toHaveLength(0);
  });
  it("classifies buckets", () => {
    expect(classifyBucket({ startAt: "2026-09-12T12:00:00+09:00", endAt: "2026-09-12T21:00:00+09:00" }, now)).toBe("today");
    expect(classifyBucket({ startAt: "2026-09-13T11:00:00+09:00", endAt: "2026-09-13T17:00:00+09:00" }, now)).toBe("tomorrow");
    expect(classifyBucket({ startAt: "2026-09-16T10:00:00+09:00", endAt: "2026-09-16T16:00:00+09:00" }, now)).toBe("next_week");
    expect(classifyBucket({ startAt: "2026-10-01T10:00:00+09:00", endAt: "2026-10-01T16:00:00+09:00" }, now)).toBe("later");
  });
});
