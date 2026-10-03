import fs from 'node:fs';
import { allowedUrl, discover, parseDetail, hash } from './discovery.mjs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export function validateConfig(c){
 if(c.version!==2||!Array.isArray(c.sources)||c.sources.length>12||c.attempts<1||c.attempts>2||c.timeoutMs<1000||c.timeoutMs>12000||c.maxRequests>200||c.maxRequests<1||c.maxRunMs>480000||c.maxRunMs<1000||c.spacingMs<500||c.cacheHours<1||c.retentionDays>7||c.archiveDays>365)throw Error('Collector configuration outside bounded limits');
 for(const s of c.sources)if(!/^[a-z-]+$/.test(s.id)||!s.urls?.length||s.urls.length>4||s.maxDetails>24||s.maxDetails<1||!s.hosts?.length||s.urls.some(u=>!allowedUrl(u,s)))throw Error('Invalid source configuration');
}
export function makeFetcher(config, fetcher=fetch){
 const last=new Map(),cache=new Map(),blocked=new Map();let requests=0;const start=Date.now();
 const get=async(url,source)=>{
  if(cache.has(url))return cache.get(url);if(!allowedUrl(url,source))throw Error('Host is not configured');
  const host=new URL(url).hostname;if(blocked.has(host))throw Error('同一ホストの追加取得を停止: '+blocked.get(host));
  let error;for(let attempt=0;attempt<config.attempts;attempt++){
   if(requests>=config.maxRequests||Date.now()-start>=config.maxRunMs)throw Error('収集の上限に到達');
   await sleep(Math.max(0,config.spacingMs-(Date.now()-(last.get(host)||0))));last.set(host,Date.now());requests++;
   try{const r=await fetcher(url,{signal:AbortSignal.timeout(config.timeoutMs),headers:{'user-agent':'ikukamo-official-collector/2.0 (+https://github.com/longchanp7-hub/ikukamo)'}});
    if([401,403,429].includes(r.status)){blocked.set(host,'HTTP '+r.status);throw Error('HTTP '+r.status);}if(!r.ok)throw Error('HTTP '+r.status);if(r.url&&!allowedUrl(r.url,source))throw Error('Redirect host is not configured');const html=await r.text();
    if(html.length<100||html.length>2000000)throw Error('Unexpected document size');cache.set(url,html);return html;
   }catch(e){error=e;if(blocked.has(host))throw e;if(attempt+1<config.attempts)await sleep(800);}
  }blocked.set(host,error?.message||'通信失敗');throw error;
 };
 get.count=()=>requests;return get;
}
const stampOf=e=>e.sources?.find(s=>s.sourceType==='official')?.fetchedAt||e.updatedAt;
export function retainEvent(event,stamp,config,reason){
 if(Date.parse(event.endAt)<Date.parse(stamp)){return Date.parse(stamp)-Date.parse(event.endAt)<=config.archiveDays*86400000?{...event,status:event.status==='cancelled'?'cancelled':'ended'}:null;}
 // Keep original timestamps even when a retrieval fails or the listing drops a link.
 return {...event,collectionWarning:reason,collectionExpired:Date.parse(stamp)-Date.parse(stampOf(event))>config.retentionDays*86400000};
}
export function reconcileOccurrences(rows,previous,stamp){
 const used=new Set();
 return rows.map(row=>{
  const matches=previous.filter(e=>!used.has(e.id)&&(e.id===row.id||e.startAt.slice(0,10)===row.startAt.slice(0,10)||(Date.parse(e.startAt)>=Date.parse(row.startAt)&&Date.parse(e.endAt)<=Date.parse(row.endAt))));
  const before=matches.find(e=>e.startAt.slice(0,10)===row.startAt.slice(0,10))||matches[0];
  matches.forEach(e=>used.add(e.id));
  const id=before?.id||row.id;
  const aliases=[...new Set([row.id,...matches.flatMap(e=>[e.id,...(e.aliases||[])])])].filter(a=>a!==id);
  return {...row,id,...(aliases.length?{aliases}:{}),sources:row.sources.map(s=>({...s,eventId:id})),createdAt:before?.createdAt||stamp};
 });
}
export async function collect(config,regions,previous,stamp=new Date().toISOString(),get=makeFetcher(config),force=false){
 validateConfig(config);const events=[],sources=[],reviews=[];let fetchedSources=0,failedSources=0;
 for(const source of config.sources){
  const old=(previous.sources||[]).find(s=>s.id===source.id), oldEvents=(previous.events||[]).filter(e=>e.collectorSource===source.id),fingerprint=hash(JSON.stringify(source)+JSON.stringify(regions)+fs.readFileSync(new URL('./discovery.mjs',import.meta.url),'utf8'));
  if(!force&&old?.fingerprint===fingerprint&&old.status==='ok'&&Date.parse(stamp)-Date.parse(old.lastSuccessAt)<config.cacheHours*3600000){
   sources.push(old);events.push(...oldEvents);reviews.push(...(previous.reviews||[]).filter(r=>r.sourceId===source.id));continue;
  }
  const record={id:source.id,name:source.name,url:source.urls[0],cities:source.cities,fingerprint,checkedAt:stamp,lastSuccessAt:old?.lastSuccessAt||null,status:'ok',discovered:0,fetched:0,accepted:0,retained:0,skipped:0,errors:0,methods:{},cityCounts:{}};
  const candidates=new Map(),accepted=[],handled=new Set();let listed=false;
  for(const url of source.urls){try{const found=discover(await get(url,source),source,url,new Date(stamp));const method=(url.includes('wp-json')||url.includes('/api/odpf/'))?'public_json':url.includes('/feed')?'feed':'html';record.methods[method]=(record.methods[method]||0)+found.length;for(const c of found)if(!candidates.has(c.url))candidates.set(c.url,c);listed=true;}catch(e){record.errors++;reviews.push({sourceId:source.id,url,reason:'一覧取得失敗: '+e.message,checkedAt:stamp});}}
  record.discovered=candidates.size;
  if(!candidates.size){record.errors++;reviews.push({sourceId:source.id,url:source.urls[0],reason:'候補リンクが0件。構造変更または掲載状況を要確認',checkedAt:stamp});}
  // Recheck previously accepted upcoming pages even after they disappear from a listing.
  const queue=[...candidates.values()];
  for(const e of oldEvents.filter(e=>Date.parse(e.endAt)>=Date.parse(stamp)))if(!candidates.has(e.officialUrl)&&!queue.some(c=>c.url===e.officialUrl))queue.push({url:e.officialUrl,title:e.title,hint:e.city});
  const offset=(old?.cursor||0)%Math.max(1,queue.length);const rotated=[...queue.slice(offset),...queue.slice(0,offset)];const limited=rotated.slice(0,source.maxDetails);record.cursor=(offset+limited.length)%Math.max(1,queue.length);record.skipped=Math.max(0,queue.length-limited.length);
  for(const candidate of limited){
   let html;try{const fetchUrl=source.parser==='hamamatsu-city'?candidate.url.replace('/odpf/','/api/odpf/').replace('v1.html','v1'):candidate.url;html=await get(fetchUrl,source);record.fetched++;}catch(e){record.errors++;reviews.push({sourceId:source.id,url:candidate.url,title:candidate.title,reason:'詳細取得失敗: '+e.message,checkedAt:stamp});continue;}
   try{const rows=reconcileOccurrences(parseDetail(html,source,candidate,regions,stamp),oldEvents.filter(e=>e.officialUrl===candidate.url),stamp);handled.add(candidate.url);
    for(const row of rows){if(Date.parse(row.endAt)<Date.parse(stamp)&&!oldEvents.some(e=>e.id===row.id)){record.skipped++;continue;}accepted.push(row);}
   }catch(e){record.skipped++;if(oldEvents.some(e=>e.officialUrl===candidate.url))record.errors++;reviews.push({sourceId:source.id,url:candidate.url,title:candidate.title,reason:e.message,checkedAt:stamp});}
  }
  record.accepted=new Set(accepted.map(e=>e.id)).size;
  for(const e of oldEvents){if(handled.has(e.officialUrl)&&accepted.some(n=>n.id===e.id||n.aliases?.includes(e.id)))continue;const kept=retainEvent(e,stamp,config,handled.has(e.officialUrl)?'開催日変更に伴う過去の候補':'前回の情報です。今回の詳細確認に成功していません');if(kept){if(handled.has(e.officialUrl))kept.collectionExpired=true;accepted.push(kept);record.retained++;}}
  const unique=[...new Map(accepted.map(e=>[e.id,e])).values()];
  for(const e of unique)if(!e.collectionExpired&&e.status!=='ended')record.cityCounts[e.city]=(record.cityCounts[e.city]||0)+1;
  if(record.accepted){record.lastSuccessAt=stamp;fetchedSources++;}else failedSources++;
  if(record.errors||!listed)record.status=record.accepted?'partial':'failed';else if(!record.accepted)record.status='review';
  sources.push(record);events.push(...unique);
 }
 const social={x:{status:'paid_api_disabled',reason:'有料の公式X APIは使用しません。ログイン不要の公開HTML・公式サイト内の埋め込み本文・掲載リンクの取得結果は巡回記録に分けて表示します。'},instagram:{status:'account_integration_disabled',reason:'利用者の指定によりアカウント連携APIは使用しません。ログイン不要の公開HTML・公式サイト内の埋め込み本文・掲載リンクの取得を試し、取得できない場合は制限を記録します。手動登録も利用できます。'}};
 const next={version:2,events:[...new Map(events.map(e=>[e.id,e])).values()],sources,reviews:reviews.slice(0,300),social};
 return {snapshot:next,changed:JSON.stringify(previous)!==JSON.stringify(next),fetchedSources,failedSources,requests:get.count?.()??0,allFailed:fetchedSources===0&&failedSources===config.sources.length};
}
