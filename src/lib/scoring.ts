import { CATEGORY_META, DEFAULT_SCORE_WEIGHTS } from "@/data/score-weights";
import { regionLevelFor, minScoreForLevel } from "@/lib/region";
import type { CategoryId, OutingEvent, ScoreWeights, UserFeedback } from "@/lib/types";

export function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function preferenceBoostFromFeedback(
  event: Pick<OutingEvent, "id" | "category">,
  feedback: UserFeedback[],
): number {
  const catActions = feedback.filter((f) => f.eventId === event.id);
  let adj = 0;
  for (const f of feedback) {
    if (f.action === "want" || f.action === "went" || f.action === "save") adj += 1;
    if (f.action === "dismiss") adj -= 2;
  }
  const local =
    catActions.filter((f) => ["want", "save", "went"].includes(f.action)).length * 8 -
    catActions.filter((f) => f.action === "dismiss").length * 20 +
    catActions.filter((f) => f.action === "open_detail").length * 2;
  const catWeight = (CATEGORY_META[event.category].weight - 1) * 80;
  return clamp(55 + catWeight + local + Math.max(-10, Math.min(10, adj * 0.2)));
}

export function computeScore(
  input: {
    category: CategoryId; city: string; prefecture: string;
    distanceFromToyohashiKm: number; driveMinutes: number;
    limitedPeriod: boolean; foodAppeal: number; adultOriented: boolean;
    snsBuzz: number; rarity: number;
  },
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS,
  feedback: UserFeedback[] = [],
  eventId = "",
): number {
  const pref = preferenceBoostFromFeedback({ id: eventId, category: input.category }, feedback);
  const limited = input.limitedPeriod ? 100 : 28;
  const totalWeight = weights.preferenceMatch + weights.limitedPeriod + weights.foodAppeal +
    weights.adultOriented + weights.distance + weights.snsBuzz + weights.rarity + weights.driveEase;
  const raw = (pref * weights.preferenceMatch + limited * weights.limitedPeriod +
    clamp(input.foodAppeal) * weights.foodAppeal + (input.adultOriented ? 92 : 35) * weights.adultOriented +
    clamp(100 - input.distanceFromToyohashiKm * 1.15) * weights.distance +
    clamp(input.snsBuzz) * weights.snsBuzz + clamp(input.rarity) * weights.rarity +
    clamp(100 - input.driveMinutes * 0.7) * weights.driveEase) / totalWeight;
  return clamp(raw);
}

export function passesRegionGate(event: Pick<OutingEvent, "city" | "prefecture" | "score">): boolean {
  return event.score >= minScoreForLevel(regionLevelFor(event.city, event.prefecture));
}
