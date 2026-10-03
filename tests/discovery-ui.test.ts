import {expect,it} from "vitest";
import {loadLocalEvents,findEvent} from "../src/lib/events";
import {freshForRecommendation,inCollectionRegion,ORIGINS,visitTime} from "../src/lib/outing-context";
import {formatEventRange} from "../src/lib/jst";
import {mergeDuplicateEvents} from "../src/lib/dedupe";
import {latestActionMap} from "../src/lib/feedback";
import type {UserFeedback} from "../src/lib/types";
import type {OutingEvent} from "../src/lib/types";
const sample=()=>({...loadLocalEvents().find(e=>e.collectorSource)!});
it("keeps events from the seven core cities and their departure choices",()=>{
 for(const city of ["豊橋市","豊川市","田原市","蒲郡市","新城市","岡崎市","浜松市"]){expect(inCollectionRegion({city})).toBe(true);expect(ORIGINS.some(o=>o.name===city)).toBe(true);expect(loadLocalEvents().some(e=>e.city===city)).toBe(true);}
 expect(inCollectionRegion({city:"東京都千代田区"})).toBe(false);
});
it("date-only bounds are never displayed as midnight opening hours or exact-time recommendations",()=>{
 const e={...sample(),timePrecision:"date",startAt:"2026-10-03T00:00:00+09:00",endAt:"2026-10-04T00:00:00+09:00"} as OutingEvent;
 expect(formatEventRange(e)).toContain("時刻未確認");expect(formatEventRange(e)).not.toContain("00:00");expect(visitTime(e,"2026-10-03T12:00")).toBeNull();
});
it("expired collection data stays loadable as history but stops recommendations",()=>{
 const e={...sample(),collectorSource:"test",statusCheckedAt:"2026-10-01T00:00:00Z"};expect(freshForRecommendation(e,Date.parse("2026-10-09T00:00:00Z"))).toBe(false);expect(freshForRecommendation(e,Date.parse("2026-10-02T00:00:00Z"))).toBe(true);expect(findEvent(sample().id)).toBeTruthy();
});
it("a refreshed duplicate keeps the legacy saved id and the old route as an alias",()=>{
 const e=sample();const a={...e,id:"legacy-saved",collectorSource:undefined,updatedAt:"2026-09-01T00:00:00Z",statusCheckedAt:"2026-09-01T00:00:00Z"};const b={...e,id:"auto-new",updatedAt:"2026-10-03T00:00:00Z",statusCheckedAt:"2026-10-03T00:00:00Z",status:"cancelled" as const};const merged=mergeDuplicateEvents([b,a]);expect(merged).toHaveLength(1);expect(merged[0].id).toBe("legacy-saved");expect(merged[0].aliases).toContain("auto-new");expect(merged[0].status).toBe("cancelled");
});
it("old occurrence selections resolve to the merged event and canonical clear cancels them",()=>{
 const events=[{id:"merged",aliases:["old-start","old-end"]}];
 const f=(eventId:string,action:UserFeedback["action"]):UserFeedback=>({id:eventId+action,eventId,action,createdAt:"2026-10-03T00:00:00Z"});
 expect({...latestActionMap([f("old-end","want")],events)}).toEqual({merged:"want"});
 expect({...latestActionMap([f("old-end","want"),f("merged","clear")],events)}).toEqual({});
 expect({...latestActionMap([f("merged","want"),f("old-start","dismiss")],events)}).toEqual({merged:"dismiss"});
});
