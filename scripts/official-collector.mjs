import crypto from 'node:crypto';
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
export function plain(html){return String(html).replace(/<(script|style|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();}
const safe = value => {try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:undefined;}catch{return undefined;}};
export function extractEvents(html, source, stamp) {
  const all=[];
  for(const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
    const walk=value=>{if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object'){if([value['@type']].flat().includes('Event'))all.push(value);if(value['@graph'])walk(value['@graph']);}};
    try{walk(JSON.parse(match[1]));}catch{throw Error('Invalid official JSON-LD; existing data retained');}
  }
  return all.map(e=>{
    const start=String(e.startDate||''),end=String(e.endDate||''),location=e.location||{},geo=location.geo||{},address=location.address||{};
    const coordinate=value=>(typeof value==='number'||typeof value==='string'&&value.trim()!=='')?Number(value):NaN;
    const lat=coordinate(geo.latitude),lon=coordinate(geo.longitude);
    if(!e.name||!location.name||!address.addressLocality||!/[Zz]|[+-]\d{2}:\d{2}$/.test(start)||!/[Zz]|[+-]\d{2}:\d{2}$/.test(end)||!Number.isFinite(Date.parse(start))||Date.parse(end)<=Date.parse(start)||!Number.isFinite(Date.parse(end))||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)throw Error('Event fields/date/venue coordinates require review');
    const id='official-'+digest(source.id+String(e.name)+start).slice(0,20),url=safe(e.url)||source.url;
    if(new URL(url).hostname.replace(/^www\./,'')!==new URL(source.url).hostname.replace(/^www\./,''))throw Error('Event URL changed host');
    const status=String(e.eventStatus||'').endsWith('EventCancelled')?'cancelled':String(e.eventStatus||'').endsWith('EventPostponed')?'postponed':'scheduled';
    return {id,title:plain(e.name).slice(0,200),description:plain(e.description||'公式構造化データから取得').slice(0,500),category:'local',startAt:start,endAt:end,venueName:plain(location.name),address:plain([address.addressRegion,address.addressLocality,address.streetAddress].filter(Boolean).join(' ')),city:plain(address.addressLocality),prefecture:plain(address.addressRegion||''),latitude:lat,longitude:lon,distanceFromToyohashiKm:0,driveMinutes:0,score:60,confidence:'high',status,officialUrl:url,mapUrl:'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(location.name),aiComment:'公式の構造化データから取得。開催可否は公式ページを確認してください。',goNowReason:'日時と場所が掲載されています。',recommendReason:'公式情報に基づく候補',isSample:false,weatherDependent:false,venueKind:'unknown',coordinatePrecision:'venue',limitedPeriod:true,adultOriented:false,foodAppeal:0,rarity:0,snsBuzz:0,sources:[{id:'src-'+id,eventId:id,sourceType:'official',sourceUrl:url,sourceName:source.name,fetchedAt:stamp}],createdAt:stamp,updatedAt:stamp};
  });
}
export async function fetchOfficial(source, config, fetcher=fetch) {
  if(!safe(source.url))throw Error('HTTPS source required');
  let error;
  for(let i=0;i<config.attempts;i++){
    try{const r=await fetcher(source.url,{signal:AbortSignal.timeout(config.timeoutMs),headers:{'user-agent':'ikukamo-official-collector/1.0 (+https://github.com/longchanp7-hub/ikukamo)'}});if(!r.ok)throw Error('HTTP '+r.status);if(r.url&&new URL(r.url).hostname.replace(/^www\./,'')!==new URL(source.url).hostname.replace(/^www\./,''))throw Error('Redirect host changed');const html=await r.text();if(html.length>2000000||html.length<100)throw Error('Unexpected page size');const text=plain(html);if(text.length<30||source.requiredText&&!text.includes(source.requiredText))throw Error('Official page format/identity changed');return {html,hash:digest(text),title:plain(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||source.name).slice(0,180)};}catch(e){error=e;if(i+1<config.attempts)await new Promise(r=>setTimeout(r,500*(i+1)));}
  }throw error;
}
