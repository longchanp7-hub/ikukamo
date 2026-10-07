import { describe, expect, it } from "vitest";
import { formatEventRange } from "../src/lib/jst";

describe("formatEventRange", () => {
  it("does not call a confirmed date range unconfirmed when published time text exists", () => {
    const value = formatEventRange({
      startAt: "2026-10-10T00:00:00+09:00",
      endAt: "2026-10-13T00:00:00+09:00",
      timePrecision: "date",
      timeText: "各日10:00〜15:00",
    });
    expect(value).toContain("10/10");
    expect(value).toContain("10/12");
    expect(value).toContain("時刻は下記掲載情報を確認");
    expect(value).not.toContain("会期・時刻未確認");
  });

  it("marks only the clock time as unconfirmed when no time text exists", () => {
    expect(formatEventRange({
      startAt: "2026-10-10T00:00:00+09:00",
      endAt: "2026-10-11T00:00:00+09:00",
      timePrecision: "date",
    })).toContain("時刻未確認");
  });
});
