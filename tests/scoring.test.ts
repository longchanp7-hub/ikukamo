import { describe, expect, it } from "vitest";
import { computeScore, passesRegionGate } from "../src/lib/scoring";
describe("computeScore", () => {
  it("returns 0-100 and rewards nearby food events", () => {
    const s = computeScore({ category: "beer", city: "豊橋市", prefecture: "愛知県", distanceFromToyohashiKm: 2, driveMinutes: 10, limitedPeriod: true, foodAppeal: 80, adultOriented: true, snsBuzz: 50, rarity: 50 });
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
    expect(s).toBeGreaterThan(60);
  });
  it("penalizes far events", () => {
    const base = { category: "car" as const, prefecture: "愛知県", limitedPeriod: true, foodAppeal: 20, adultOriented: true, snsBuzz: 70, rarity: 80 };
    const near = computeScore({ ...base, city: "豊橋市", distanceFromToyohashiKm: 3, driveMinutes: 10 });
    const far = computeScore({ ...base, city: "名古屋市", distanceFromToyohashiKm: 72, driveMinutes: 95 });
    expect(near).toBeGreaterThan(far);
  });
  it("applies region gate", () => {
    expect(passesRegionGate({ city: "豊橋市", prefecture: "愛知県", score: 20 })).toBe(true);
    expect(passesRegionGate({ city: "名古屋市", prefecture: "愛知県", score: 20 })).toBe(false);
  });
});
