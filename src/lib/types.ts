export type Confidence = "confirmed" | "high" | "unverified";
export type FeedbackAction = "want" | "save" | "dismiss" | "went" | "open_detail";
export type CategoryId = "food" | "car" | "night_market" | "morning_market" | "festival" | "wine" | "sake" | "beer" | "ramen" | "sushi" | "hotel" | "onsen" | "music" | "local" | "other";
export type RegionLevel = "A" | "B" | "C" | "D";
export type TimeBucket = "today" | "tomorrow" | "this_week" | "this_weekend" | "next_week" | "later";

export interface EventSource {
  id: string;
  eventId: string;
  sourceType: "official" | "x" | "instagram" | "municipality" | "media" | "seed" | "web";
  sourceUrl?: string;
  sourceName: string;
  publishedAt?: string;
  fetchedAt: string;
}

export interface OutingEvent {
  id: string;
  title: string;
  description: string;
  category: CategoryId;
  startAt: string;
  endAt: string;
  venueName: string;
  city: string;
  prefecture: string;
  latitude: number;
  longitude: number;
  distanceFromToyohashiKm: number;
  driveMinutes: number;
  score: number;
  confidence: Confidence;
  imageUrl?: string;
  officialUrl?: string;
  xUrl?: string;
  instagramUrl?: string;
  mapUrl?: string;
  priceText?: string;
  parkingText?: string;
  aiComment: string;
  goNowReason: string;
  recommendReason: string;
  isSample: boolean;
  weatherDependent: boolean;
  limitedPeriod: boolean;
  adultOriented: boolean;
  foodAppeal: number;
  rarity: number;
  snsBuzz: number;
  sources: EventSource[];
  createdAt: string;
  updatedAt: string;
}

export interface ScoreWeights {
  preferenceMatch: number;
  limitedPeriod: number;
  foodAppeal: number;
  adultOriented: number;
  distance: number;
  snsBuzz: number;
  rarity: number;
  driveEase: number;
}

export interface UserFeedback {
  id: string;
  eventId: string;
  action: FeedbackAction;
  createdAt: string;
}

export interface CategoryWeight {
  id: CategoryId;
  nameJa: string;
  weight: number;
}
