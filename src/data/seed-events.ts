import type { CategoryId, Confidence, OutingEvent } from "@/lib/types";
import { addDays, atHour, nowJst, startOfDay } from "@/lib/jst";
import { computeScore } from "@/lib/scoring";
import { mapsUrl } from "@/lib/region";

type Draft = {
  id: string; title: string; description: string; category: CategoryId;
  day: number; startH: number; endH: number; venueName: string; city: string;
  prefecture: string; lat: number; lng: number; km: number; drive: number;
  officialUrl?: string; aiComment: string; goNowReason: string; recommendReason: string;
  weatherDependent: boolean; limitedPeriod: boolean; foodAppeal: number; rarity: number; snsBuzz: number;
};

const DRAFTS: Draft[] = [
  { id: "sample-toyohashi-craftbeer", title: "【サンプル】豊橋駅前クラフトビールフェス", description: "サンプルデータです。実在イベントではありません。", category: "beer", day: 0, startH: 12, endH: 21, venueName: "豊橋駅前広場", city: "豊橋市", prefecture: "愛知県", lat: 34.7628, lng: 137.3831, km: 1.2, drive: 10, officialUrl: "https://www.city.toyohashi.lg.jp/", aiComment: "駅前なので今からでも現実的。", goNowReason: "今日開催・移動10分。", recommendReason: "豊橋起点で負担が少ない期間限定の飲みイベントです。", weatherDependent: true, limitedPeriod: true, foodAppeal: 78, rarity: 62, snsBuzz: 55 },
  { id: "sample-toyokawa-night", title: "【サンプル】豊川夜市", description: "サンプルデータです。", category: "night_market", day: 0, startH: 16, endH: 21, venueName: "豊川市中心市街地", city: "豊川市", prefecture: "愛知県", lat: 34.8268, lng: 137.3756, km: 9, drive: 22, officialUrl: "https://www.city.toyokawa.lg.jp/", aiComment: "レベルA圏。夜の食べ歩き向き。", goNowReason: "車で約20分。", recommendReason: "豊川は小規模でも拾う圏内です。", weatherDependent: true, limitedPeriod: true, foodAppeal: 72, rarity: 48, snsBuzz: 40 },
  { id: "sample-suijo-marche", title: "【サンプル】水上ビル大人マルシェ", description: "サンプルデータです。", category: "local", day: 1, startH: 11, endH: 17, venueName: "水上ビル", city: "豊橋市", prefecture: "愛知県", lat: 34.762, lng: 137.386, km: 0.8, drive: 8, officialUrl: "https://www.city.toyohashi.lg.jp/", aiComment: "まちなかなので気軽。", goNowReason: "市内中心部。", recommendReason: "豊橋まちなかは優先エリアです。", weatherDependent: false, limitedPeriod: true, foodAppeal: 70, rarity: 58, snsBuzz: 36 },
  { id: "sample-port-asaichi", title: "【サンプル】豊橋港朝市", description: "サンプルデータです。", category: "morning_market", day: 1, startH: 6, endH: 11, venueName: "豊橋港", city: "豊橋市", prefecture: "愛知県", lat: 34.716, lng: 137.318, km: 11, drive: 24, aiComment: "朝型。", goNowReason: "午前中限定。", recommendReason: "港・市場は優先ジャンルです。", weatherDependent: true, limitedPeriod: true, foodAppeal: 80, rarity: 60, snsBuzz: 28 },
  { id: "sample-gamagori-classic", title: "【サンプル】蒲郡クラシックカーイベント", description: "サンプルデータです。", category: "car", day: 1, startH: 9, endH: 16, venueName: "蒲郡市海辺公園", city: "蒲郡市", prefecture: "愛知県", lat: 34.826, lng: 137.226, km: 22, drive: 35, officialUrl: "https://www.city.gamagori.lg.jp/", aiComment: "車イベントは嗜好一致が高い。", goNowReason: "約35分。", recommendReason: "クラシックカーは優先ジャンルです。", weatherDependent: true, limitedPeriod: true, foodAppeal: 30, rarity: 78, snsBuzz: 52 },
  { id: "sample-tahara-wine", title: "【サンプル】田原 海とワインの夕べ", description: "サンプルデータです。", category: "wine", day: 0, startH: 14, endH: 20, venueName: "田原市内ワイナリー", city: "田原市", prefecture: "愛知県", lat: 34.669, lng: 137.273, km: 28, drive: 42, aiComment: "ワイン＋食。", goNowReason: "今日夕方まで。", recommendReason: "田原はレベルB。ワインと食が重なります。", weatherDependent: false, limitedPeriod: true, foodAppeal: 82, rarity: 70, snsBuzz: 44 },
  { id: "sample-okazaki-sake", title: "【サンプル】岡崎日本酒フェア", description: "サンプルデータです。", category: "sake", day: 3, startH: 12, endH: 18, venueName: "岡崎公園", city: "岡崎市", prefecture: "愛知県", lat: 34.956, lng: 137.159, km: 38, drive: 55, officialUrl: "https://www.city.okazaki.lg.jp/", aiComment: "今週の日本酒枠。", goNowReason: "試飲の密度が理由。", recommendReason: "岡崎はレベルB。", weatherDependent: false, limitedPeriod: true, foodAppeal: 76, rarity: 64, snsBuzz: 48 },
  { id: "sample-hamamatsu-wine", title: "【サンプル】浜松ワインイベント", description: "サンプルデータです。", category: "wine", day: 8, startH: 10, endH: 16, venueName: "浜松市中央区", city: "浜松市", prefecture: "静岡県", lat: 34.7108, lng: 137.7261, km: 36, drive: 50, officialUrl: "https://www.city.hamamatsu.shizuoka.jp/", aiComment: "来週以降の予定枠。", goNowReason: "来週の半日予定向き。", recommendReason: "浜松はレベルB。", weatherDependent: false, limitedPeriod: true, foodAppeal: 74, rarity: 66, snsBuzz: 50 },
  { id: "sample-okumikawa-onsen", title: "【サンプル】奥三河温泉の昼下り", description: "サンプルデータです。", category: "onsen", day: 12, startH: 10, endH: 18, venueName: "奥三河温泉地", city: "新城市", prefecture: "愛知県", lat: 34.954, lng: 137.5, km: 32, drive: 50, aiComment: "その先ののんびり枠。", goNowReason: "日帰り温泉候補。", recommendReason: "温泉は優先ジャンルです。", weatherDependent: false, limitedPeriod: false, foodAppeal: 48, rarity: 55, snsBuzz: 22 },
  { id: "sample-nagoya-supercar", title: "【サンプル】名古屋スーパーカー展示", description: "サンプルデータです。", category: "car", day: 14, startH: 10, endH: 17, venueName: "名古屋市内展示場", city: "名古屋市", prefecture: "愛知県", lat: 35.1709, lng: 136.8815, km: 72, drive: 95, aiComment: "距離があるので魅力次第。", goNowReason: "大型案件のときだけ。", recommendReason: "名古屋はレベルDです。", weatherDependent: false, limitedPeriod: true, foodAppeal: 20, rarity: 88, snsBuzz: 70 },
  { id: "sample-ended-festival", title: "【サンプル】終了済み・豊橋まちなか祭り", description: "表示されないことを確認する終了イベント。", category: "festival", day: -5, startH: 10, endH: 20, venueName: "豊橋広小路", city: "豊橋市", prefecture: "愛知県", lat: 34.763, lng: 137.383, km: 1, drive: 8, aiComment: "終了済み。", goNowReason: "終了。", recommendReason: "テスト用です。", weatherDependent: true, limitedPeriod: true, foodAppeal: 60, rarity: 40, snsBuzz: 30 },
];

export function buildSeedEvents(now = new Date()): OutingEvent[] {
  const jst = nowJst(now);
  const fetchedAt = now.toISOString();
  return DRAFTS.map((d) => {
    const day = addDays(startOfDay(jst), d.day);
    const startAt = atHour(day, d.startH).toISOString();
    const endAt = atHour(day, d.endH).toISOString();
    const score = computeScore({
      category: d.category, city: d.city, prefecture: d.prefecture,
      distanceFromToyohashiKm: d.km, driveMinutes: d.drive, limitedPeriod: d.limitedPeriod,
      foodAppeal: d.foodAppeal, adultOriented: true, snsBuzz: d.snsBuzz, rarity: d.rarity,
    });
    return {
      id: d.id, title: d.title, description: d.description, category: d.category,
      startAt, endAt, venueName: d.venueName + "（サンプル）", city: d.city, prefecture: d.prefecture,
      latitude: d.lat, longitude: d.lng, distanceFromToyohashiKm: d.km, driveMinutes: d.drive,
      score, confidence: "unverified" as Confidence, officialUrl: d.officialUrl,
      mapUrl: mapsUrl(d.lat, d.lng, d.venueName), aiComment: d.aiComment, goNowReason: d.goNowReason,
      recommendReason: d.recommendReason, isSample: true, weatherDependent: d.weatherDependent,
      limitedPeriod: d.limitedPeriod, adultOriented: true, foodAppeal: d.foodAppeal, rarity: d.rarity,
      snsBuzz: d.snsBuzz, sources: [{ id: "src-" + d.id, eventId: d.id, sourceType: "seed", sourceName: "シード（実在イベントではありません）", fetchedAt }],
      createdAt: fetchedAt, updatedAt: fetchedAt,
    };
  });
}

export const SEED_EVENTS = buildSeedEvents();
