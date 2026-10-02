import { afterEach, describe, expect, it, vi } from "vitest";
import { latestActionMap } from "../src/lib/feedback";
import { createPickedEvent } from "../src/lib/picked-events";
import { loadPersonal, parseBackup, PERSONAL_KEY, restorePersonal, updatePersonal, validatePersonal } from "../src/lib/personal-store";
import { confirmedIndoor, distanceKm, ORIGINS, parseForecast, venueKey, visitTime, weatherAt } from "../src/lib/outing-context";
import { pickTodayGo } from "../src/lib/today-picks";
import { classifyBucket, isEnded } from "../src/lib/time-buckets";
import { jstInput, startOfDay } from "../src/lib/jst";
import type { OutingEvent, UserFeedback } from "../src/lib/types";
const now = new Date("2026-10-03T10:00:00+09:00");
function event(overrides: Partial<OutingEvent> = {}) {
  return { ...createPickedEvent({ url: "https://www.instagram.com/p/Test123/", title: "検証用", startAt: "2026-10-03T12:00:00+09:00", endAt: "2026-10-03T18:00:00+09:00", city: "豊橋市", venueName: "会場", category: "food" })!, score: 80, ...overrides };
}
function storage() {
  const m = new Map<string,string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k,v); }, removeItem: (k: string) => m.delete(k), clear: () => m.clear(), key: (i:number) => [...m.keys()][i] ?? null, get length() { return m.size; } } as Storage;
}
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe("personal data safety", () => {
  it("migrates valid legacy data only on explicit save", () => { const s = storage(); s.setItem("ikukamo.picked.v1",JSON.stringify([event()])); expect(loadPersonal(s).picked).toHaveLength(1); expect(s.getItem(PERSONAL_KEY)).toBeNull(); });
  it("keeps corrupt bytes and blocks writes", () => { const s=storage(); s.setItem(PERSONAL_KEY,"{broken"); vi.stubGlobal("window",{localStorage:s}); expect(() => updatePersonal(d=>d)).toThrow(); expect(s.getItem(PERSONAL_KEY)).toBe("{broken"); });
  it("preserves old data on quota failure", () => { const s=storage(), original=JSON.stringify({version:2,feedback:[],picked:[]}); s.setItem(PERSONAL_KEY,original); vi.stubGlobal("window",{localStorage:s}); s.setItem=()=>{throw new Error("quota");}; expect(()=>updatePersonal(d=>({...d,picked:[event()]}))).toThrow(/保存できません/); expect(s.getItem(PERSONAL_KEY)).toBe(original); });
  it("rejects wrong backup, invalid dates and executable links", () => { expect(()=>parseBackup('{"version":2,"data":{}}')).toThrow(); expect(()=>validatePersonal({version:2,feedback:[],picked:[event({officialUrl:"javascript:alert(1)"})]})).toThrow(); expect(()=>validatePersonal({version:2,feedback:[],picked:[event({endAt:"invalid"})]})).toThrow(); });
  it("requires safety copy before restoration", () => { const s=storage(); s.setItem(PERSONAL_KEY,"broken"); vi.stubGlobal("localStorage",s); vi.stubGlobal("window",{dispatchEvent:()=>{}}); restorePersonal({version:2,feedback:[],picked:[]}); expect(JSON.parse(s.getItem(PERSONAL_KEY+".beforeRestore")!).v2).toBe("broken"); expect(loadPersonal(s).picked).toHaveLength(0); });
  it("detail access does not overwrite a selection and clear undoes dismiss", () => { const f=(action:UserFeedback["action"]):UserFeedback=>({id:action,eventId:"e",action,createdAt:now.toISOString()}); expect(latestActionMap([f("save"),f("open_detail")]).e).toBe("save"); expect(latestActionMap([f("dismiss"),f("clear")]).e).toBeUndefined(); });
  it("rejects reversed manual dates",()=>expect(()=>createPickedEvent({url:"https://www.instagram.com/p/Test123/",title:"x",startAt:"2026-10-03",endAt:"2026-10-02",city:"豊橋市",venueName:"x",category:"local"})).toThrow());
});
describe("destination, date and weather", () => {
  it("uses JST boundaries independent of host timezone", () => { expect(startOfDay(new Date("2026-10-02T15:01:00Z")).toISOString()).toBe("2026-10-02T15:00:00.000Z"); expect(jstInput(now)).toBe("2026-10-03T10:00"); expect(classifyBucket(event({startAt:"2026-10-04T12:00:00+09:00",endAt:"2026-10-04T17:00:00+09:00"}),now)).toBe("tomorrow"); expect(isEnded({endAt:now.toISOString()},now)).toBe(true); });
  it("does not move next weekend into this weekend on a Sunday", () => { expect(classifyBucket(event({startAt:"2026-10-10T12:00:00+09:00",endAt:"2026-10-10T17:00:00+09:00"}),new Date("2026-10-04T10:00:00+09:00"))).toBe("next_week"); });
  it("reports straight distance and rejects invalid coordinates", () => { expect(distanceKm(ORIGINS[0],ORIGINS[0])).toBe(0); expect(distanceKm(ORIGINS[0],ORIGINS[6])!).toBeGreaterThan(25); expect(distanceKm(ORIGINS[0],{latitude:NaN,longitude:3})).toBeNull(); });
  it("does not infer indoor from weatherDependent=false",()=>{expect(confirmedIndoor(event())).toBe(false);expect(confirmedIndoor(event({venueKind:"indoor"}))).toBe(false);expect(confirmedIndoor(event({venueKind:"indoor",venueEvidenceUrl:"https://example.com"}))).toBe(true);});
  it("matches destination AND visit hour, not current weather", () => { vi.useFakeTimers(); vi.setSystemTime(now); const e=event(); const f=parseForecast({hourly:{time:["2026-10-03T10:00","2026-10-03T12:00"],temperature_2m:[20,21],precipitation_probability:[0,80],weather_code:[0,61]}}); expect(visitTime(e,"2026-10-03T10:00")).toBe("2026-10-03T12:00"); expect(weatherAt(e,"2026-10-03T10:00",{[venueKey(e)]:f})?.probability).toBe(80); expect(weatherAt(e,"2026-11-03T10:00",{[venueKey(e)]:f})).toBeNull(); expect(weatherAt(e,"2026-10-03T10:00",{})).toBeNull(); });
  it("never interprets null weather as zero",()=>{const f=parseForecast({hourly:{time:["2026-10-03T12:00"],temperature_2m:[null],precipitation_probability:[null],weather_code:[null]}});expect(f.points[0].code).toBeNull();expect(()=>parseForecast({hourly:{time:[]}})).toThrow();});
  it("limits picks to 3, excludes cancellation and tomorrow, restores dismissal", () => { const e=event({id:"ig-e"}); const candidates=[e,...[1,2,3,4].map(n=>event({id:"ig-"+n})),event({id:"ig-c",status:"cancelled"}),event({id:"ig-t",startAt:"2026-10-04T00:00:00+09:00",endAt:"2026-10-04T18:00:00+09:00"})]; const selected=pickTodayGo(candidates,[],now,10);expect(selected).toHaveLength(3);expect(selected.every(x=>!['ig-c','ig-t'].includes(x.id))).toBe(true);expect(pickTodayGo([e],[{id:"d",eventId:e.id,action:"dismiss",createdAt:now.toISOString()},{id:"r",eventId:e.id,action:"clear",createdAt:now.toISOString()}],now)).toHaveLength(1); });
  it("prioritizes confirmed indoor in rain",()=>{vi.useFakeTimers();vi.setSystemTime(now);const outdoor=event({id:"ig-o",venueKind:"outdoor"}),indoor=event({id:"ig-i",venueKind:"indoor",venueEvidenceUrl:"https://example.com"});const f=parseForecast({hourly:{time:["2026-10-03T12:00"],temperature_2m:[20],precipitation_probability:[80],weather_code:[61]}});expect(pickTodayGo([outdoor,indoor],[],now,3,ORIGINS[0],{[venueKey(outdoor)]:f})[0].id).toBe(indoor.id);});
});
