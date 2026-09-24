import { describe, expect, it } from "vitest";
import { mergeDuplicateEvents } from "./dedupe";
import type { OutingEvent } from "./types";

function event(overrides: Partial<OutingEvent> = {}): OutingEvent {
  return {
    id: "base",
    title: "同じイベント",
    description: "test",
    category: "festival",
    startAt: "2026-09-26T12:00:00+09:00",
    endAt: "2026-09-26T20:00:00+09:00",
    venueName: "会場",
    city: "豊橋市",
    prefecture: "愛知県",
    latitude: 34.76,
    longitude: 137.39,
    distanceFromToyohashiKm: 1,
    driveMinutes: 10,
    score: 80,
    confidence: "confirmed",
    aiComment: "test",
    goNowReason: "test",
    recommendReason: "test",
    isSample: false,
    weatherDependent: false,
    limitedPeriod: true,
    adultOriented: true,
    foodAppeal: 50,
    rarity: 50,
    snsBuzz: 50,
    sources: [],
    createdAt: "2026-09-24T00:00:00.000Z",
    updatedAt: "2026-09-24T00:00:00.000Z",
    ...overrides,
  };
}

describe("mergeDuplicateEvents", () => {
  it("keeps cancellation status when a later confirmed duplicate is scheduled", () => {
    const cancelled = event({
      id: "cancelled",
      status: "cancelled",
      statusText: "中止",
      statusReason: "荒天のため",
      statusSourceUrl: "https://example.com/cancelled",
      statusCheckedAt: "2026-09-25T00:00:00.000Z",
    });
    const scheduled = event({
      id: "scheduled",
      status: "scheduled",
      statusText: "開催予定",
      statusCheckedAt: "2026-09-25T01:00:00.000Z",
    });

    const [merged] = mergeDuplicateEvents([cancelled, scheduled]);

    expect(merged.status).toBe("cancelled");
    expect(merged.statusText).toBe("中止");
    expect(merged.statusReason).toBe("荒天のため");
    expect(merged.statusSourceUrl).toBe("https://example.com/cancelled");
  });
});
