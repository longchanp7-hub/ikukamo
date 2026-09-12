import { fetchFromInstagram } from "@/adapters/instagram";
import { fetchFromWebSources } from "@/adapters/web";
import { fetchFromX } from "@/adapters/x";
import { mergeDuplicateEvents } from "@/lib/dedupe";
import { buildSeedEvents } from "@/data/seed-events";
import { computeScore, passesRegionGate } from "@/lib/scoring";
import { upcomingEvents } from "@/lib/time-buckets";
import type { OutingEvent } from "@/lib/types";

export async function runIngestion(now = new Date()) {
  const seed = buildSeedEvents(now);
  const x = await fetchFromX();
  const ig = await fetchFromInstagram();
  const web = await fetchFromWebSources();
  const collected = [...seed, ...x.events, ...ig.events, ...web.events];
  const scored = collected.map((e) => ({ ...e, score: computeScore({
    category: e.category, city: e.city, prefecture: e.prefecture,
    distanceFromToyohashiKm: e.distanceFromToyohashiKm, driveMinutes: e.driveMinutes,
    limitedPeriod: e.limitedPeriod, foodAppeal: e.foodAppeal, adultOriented: e.adultOriented,
    snsBuzz: e.snsBuzz, rarity: e.rarity,
  }, undefined, [], e.id) }));
  const deduped = mergeDuplicateEvents(scored);
  const alive = upcomingEvents(deduped, now);
  const gated = alive.filter((e) => e.isSample || passesRegionGate(e));
  return {
    fetched: collected.length, afterDedupe: deduped.length, afterExpiry: alive.length, afterGate: gated.length,
    adapters: {
      seed: { status: "ok", count: seed.length },
      x: { status: x.status, reason: x.reason, count: x.events.length },
      instagram: { status: ig.status, reason: ig.reason, count: ig.events.length },
      web: { status: web.status, reason: web.reason, count: web.events.length },
    },
    events: gated as OutingEvent[],
  };
}
