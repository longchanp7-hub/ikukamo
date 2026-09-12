import type { CategoryId, CategoryWeight, ScoreWeights } from "@/lib/types";

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  preferenceMatch: 25, limitedPeriod: 15, foodAppeal: 15, adultOriented: 10,
  distance: 10, snsBuzz: 10, rarity: 10, driveEase: 5,
};

export const CATEGORY_META: Record<CategoryId, { nameJa: string; icon: string; weight: number }> = {
  food: { nameJa: "食", icon: "F", weight: 1.15 },
  car: { nameJa: "車", icon: "C", weight: 1.15 },
  night_market: { nameJa: "夜市", icon: "N", weight: 1.1 },
  morning_market: { nameJa: "朝市", icon: "M", weight: 1.05 },
  festival: { nameJa: "祭り", icon: "Fe", weight: 1 },
  wine: { nameJa: "ワイン", icon: "W", weight: 1.12 },
  sake: { nameJa: "日本酒", icon: "S", weight: 1.12 },
  beer: { nameJa: "ビール", icon: "B", weight: 1.12 },
  ramen: { nameJa: "ラーメン", icon: "R", weight: 1.08 },
  sushi: { nameJa: "寿司", icon: "Su", weight: 1.08 },
  hotel: { nameJa: "ホテル", icon: "H", weight: 1.05 },
  onsen: { nameJa: "温泉", icon: "O", weight: 1.1 },
  music: { nameJa: "音楽", icon: "Mu", weight: 0.95 },
  local: { nameJa: "地域", icon: "L", weight: 1.05 },
  other: { nameJa: "その他", icon: "+", weight: 0.85 },
};

export const INITIAL_CATEGORIES: CategoryWeight[] = (Object.keys(CATEGORY_META) as CategoryId[]).map((id) => ({
  id, nameJa: CATEGORY_META[id].nameJa, weight: CATEGORY_META[id].weight,
}));
