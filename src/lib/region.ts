import type { RegionLevel } from "@/lib/types";

export const TOYOHASHI = { lat: 34.7692, lng: 137.3915, label: "豊橋市" };

const CITY_LEVEL: Record<string, RegionLevel> = {
  豊橋市: "A", 豊川市: "A", 蒲郡市: "B", 田原市: "B", 新城市: "B", 岡崎市: "B", 浜松市: "B", 北設楽郡: "B",
  豊田市: "C", 刈谷市: "C", 安城市: "C", 西尾市: "C", 碧南市: "C", 磐田市: "C", 袋井市: "C", 掛川市: "C", 御前崎市: "C", 焼津市: "C",
  名古屋市: "D", 静岡市: "D",
};

export function regionLevelFor(city: string, prefecture: string): RegionLevel {
  if (CITY_LEVEL[city]) return CITY_LEVEL[city];
  if (city.includes("設楽") || city.includes("東栄") || city.includes("豊根")) return "B";
  if (prefecture.includes("静岡") || prefecture.includes("愛知")) return "C";
  return "D";
}

export function minScoreForLevel(level: RegionLevel): number {
  if (level === "A") return 0;
  if (level === "B") return 42;
  if (level === "C") return 58;
  return 74;
}

export function mapsUrl(lat: number, lng: number, name: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + lat + "," + lng)}`;
}
