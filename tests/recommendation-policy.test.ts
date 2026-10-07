import { describe, expect, it } from "vitest";
import { mergeDuplicateEvents } from "../src/lib/dedupe";
import { recommendationEligible } from "../src/lib/outing-context";
import type { OutingEvent } from "../src/lib/types";

function event(overrides: Partial<OutingEvent> = {}): OutingEvent {
  return {
    id: "auto-test",
    title: "大人向け地域イベント",
    description: "地域の催し",
    category: "local",
    startAt: "2026-10-10T10:00:00+09:00",
    endAt: "2026-10-10T16:00:00+09:00",
    venueName: "会場",
    city: "浜松市",
    prefecture: "静岡県",
    latitude: 34.71,
    longitude: 137.73,
    distanceFromToyohashiKm: 40,
    driveMinutes: 55,
    score: 60,
    confidence: "confirmed",
    status: "scheduled",
    aiComment: "",
    goNowReason: "",
    recommendReason: "",
    isSample: false,
    weatherDependent: false,
    limitedPeriod: true,
    cadence: "short_run",
    adultOriented: false,
    foodAppeal: 0,
    rarity: 0,
    snsBuzz: 0,
    sources: [],
    createdAt: "2026-10-07T00:00:00.000Z",
    updatedAt: "2026-10-07T00:00:00.000Z",
    collectorSource: "test",
    ...overrides,
  };
}

describe("recommendation policy", () => {
  it("filters child-centered collected events", () => {
    expect(recommendationEligible(event({ title: "子育て応援DAY" }))).toBe(false);
  });

  it("filters competitive sports but keeps sports-car events", () => {
    expect(recommendationEligible(event({ title: "市民サッカー大会" }))).toBe(false);
    expect(recommendationEligible(event({ title: "クラシック＆スポーツカー展示会", category: "car" }))).toBe(true);
  });

  it("filters long quasi-permanent local collection noise", () => {
    expect(recommendationEligible(event({
      title: "長期講座",
      startAt: "2026-10-10T00:00:00+09:00",
      endAt: "2026-12-20T00:00:00+09:00",
    }))).toBe(false);
  });

  it("does not suppress manually curated events", () => {
    expect(recommendationEligible(event({ title: "親子の伝統祭", collectorSource: undefined }))).toBe(true);
  });

  it("prefers manually curated data over an automatic duplicate", () => {
    const auto = event({
      id: "auto-tominaga",
      title: "富永神社例大祭",
      city: "新城市",
      startAt: "2026-10-09T00:00:00+09:00",
      endAt: "2026-10-12T00:00:00+09:00",
      score: 60,
      adultOriented: false,
    });
    const curated = event({
      id: "shinshiro-tominaga-festival-2026",
      title: "富永神社例大祭",
      city: "新城市",
      startAt: "2026-10-09T00:00:00+09:00",
      endAt: "2026-10-12T00:00:00+09:00",
      score: 97,
      adultOriented: true,
      collectorSource: undefined,
      updatedAt: "2026-10-07T03:42:00.000Z",
    });
    const [merged] = mergeDuplicateEvents([auto, curated]);
    expect(merged.id).toBe("shinshiro-tominaga-festival-2026");
    expect(merged.adultOriented).toBe(true);
    expect(merged.score).toBe(97);
    expect(merged.aliases).toContain("auto-tominaga");
  });
});
