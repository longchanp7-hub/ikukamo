import fs from 'node:fs';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
export function validateSnapshot(data,regions){
 assert.equal(data.version,2);assert(Array.isArray(data.events)&&data.events.length<3000);assert(Array.isArray(data.sources)&&data.sources.length>0);
 const ids=new Set(),urls=new Set(),cities=new Set(regions.cities.map(c=>c.name));
 for(const e of data.events){
  assert(!ids.has(e.id),'Duplicate id');ids.add(e.id);
  assert(e.title?.trim()&&e.venueName?.trim()&&cities.has(e.city),'Name, venue or region missing');
  assert(Number.isFinite(Date.parse(e.startAt))&&Date.parse(e.endAt)>Date.parse(e.startAt),'Invalid date interval');
  assert(['time','date'].includes(e.timePrecision));assert(['venue','city'].includes(e.coordinatePrecision));
  assert([e.latitude,e.longitude].every(Number.isFinite)&&e.latitude>=34&&e.latitude<=36&&e.longitude>=136&&e.longitude<=139,'Coordinates invalid');
  assert(['scheduled','cancelled','postponed','ended'].includes(e.status));
  assert(e.sources.length&&e.sources.every(s=>Number.isFinite(Date.parse(s.fetchedAt))),'Source timestamp missing');
  const u=new URL(e.officialUrl);assert.equal(u.protocol,'https:');assert(!u.username&&!u.password);
  const key=e.officialUrl+'|'+e.startAt;assert(!urls.has(key),'Duplicate source occurrence');urls.add(key);
  assert(typeof e.priceText==='string');assert(e.isSample===false);
 }
 return {events:ids.size,cities:[...new Set(data.events.map(e=>e.city))],review:data.reviews.length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const data=JSON.parse(fs.readFileSync('src/data/collected-events.json')),regions=JSON.parse(fs.readFileSync('config/regions.json'));
 console.log(JSON.stringify(validateSnapshot(data,regions)));
 if(process.argv.includes('--publish')){fs.mkdirSync('public/data',{recursive:true});fs.writeFileSync('public/data/collection.json',JSON.stringify(data)+'\n');}
}
