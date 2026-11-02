import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseDates,dateBounds,parseDetail,discover,allowedUrl} from '../scripts/discovery.mjs';
import {collect,makeFetcher,retainEvent,reconcileOccurrences} from '../scripts/collection-runner.mjs';
import {readPublicSocial,crawlSocial} from '../scripts/social-public.mjs';
import {validateSnapshot} from '../scripts/validate-collection.mjs';
const config=JSON.parse(fs.readFileSync('config/discovery-sources.json')),regions=JSON.parse(fs.readFileSync('config/regions.json'));
const stamp='2026-10-03T00:00:00Z',source=config.sources[0];
const fixture=id=>fs.readFileSync('tests/fixtures/'+id+'.html','utf8');
const page=fixture('machinaka'),candidate={url:'https://1484machinaka.jp/event/15092',hint:''};
test('all configured real source fragments yield dated events with verified cities',()=>{
 const cities=['豊橋市','豊橋市','豊川市','田原市','岡崎市','新城市','蒲郡市','豊田市','浜松市','浜松市','豊橋市','蒲郡市'];
 config.sources.forEach((s,i)=>{const rows=parseDetail(fixture(s.id),s,{url:s.urls[0],hint:''},regions,stamp);assert(rows.length,s.id);assert.equal(rows[0].city,cities[i],s.id);assert(rows.every(e=>e.dateText&&e.timePrecision));});
});
test('shinshiro parser accepts the current generic h1 event layout',()=>{
 const s=config.sources.find(x=>x.id==='shinshiro');
 const html='<html><h1>令和8年 鳳来寺山もみじまつり</h1><main><dl><dt>【開催期間】</dt><dd>2026年11月9日(月) ～ 12月6日(日)</dd><dt>開催場所</dt><dd>〒441-1944 新城市門谷字鳳来寺1</dd></dl></main></html>';
 const e=parseDetail(html,s,{url:'https://www.okuminavi.jp/event/detail/1381/',hint:''},regions,stamp)[0];
 assert.equal(e.title,'令和8年 鳳来寺山もみじまつり');assert.equal(e.city,'新城市');assert.match(e.venueName,/新城市門谷字鳳来寺1/);
});
test('partial dates and publication date are not event dates',()=>{
 assert.throws(()=>parseDates('毎月第4日曜日'));assert.throws(()=>parseDates('10月3日'));assert.throws(()=>parseDates('2026年2月30日'));
 assert.deepEqual(parseDates('令和8年度10月9日（金）～10月11日（日）'),[{start:'2026-10-09',end:'2026-10-11'}]);
 assert.deepEqual(parseDates('2026年12月31日～1月1日'),[{start:'2026-12-31',end:'2027-01-01'}]);
});
test('disjoint dates are not made into a continuous event and recurring notes add no invented day',()=>{
 assert.deepEqual(parseDates('2026年10月10日・11日（例年10月第2日曜）'),[{start:'2026-10-10',end:'2026-10-10'},{start:'2026-10-11',end:'2026-10-11'}]);
 assert.equal(parseDates('2026年9月12日～11月8日 【前期】9月12日～10月12日 【後期】10月14日～11月8日').length,1);
});
test('postponement reserve day is not separately registered as a scheduled event',()=>{
 assert.deepEqual(parseDates('2026年10月31日(土) ※ 小雨決行、荒天時順延(順延日 11月1日(日))'),[{start:'2026-10-31',end:'2026-10-31'}]);
 assert.deepEqual(parseDates('2026年10月31日(土)・11月1日(日)'),[{start:'2026-10-31',end:'2026-10-31'},{start:'2026-11-01',end:'2026-11-01'}]);
});
test('unknown or multiple hours use day bounds and explicit date precision',()=>{
 const p={start:'2026-10-03',end:'2026-10-03'};
 assert.equal(dateBounds(p,'14:00開演').timePrecision,'date');
 assert.equal(dateBounds(p,'10:00～11:00 / 14:00～15:00').timePrecision,'date');
 assert.equal(dateBounds(p,'10:00～16:00').endAt,'2026-10-03T16:00:00+09:00');
 assert.equal(dateBounds(p,'【試楽】5:00～【本楽】9:00～').timePrecision,'date');
 assert.equal(dateBounds(p,'【試楽】5:00～【本楽】9:00～').endAt,'2026-10-04T00:00:00+09:00');
});
test('HTML, RSS, Atom, sitemap and public JSON produce candidate links',()=>{
 const u=candidate.url;
 for(const text of ['<a href="'+u+'">催し</a>','<?xml version="1.0"?><rss><channel><item><title>催し</title><link>'+u+'</link></item></channel></rss>','<feed><entry><title>催し</title><link href="'+u+'"/></entry></feed>','<urlset><url><loc>'+u+'</loc></url></urlset>',JSON.stringify([{link:u,title:{rendered:'催し'}}])])assert.equal(discover(text,source,source.urls[0])[0].url,u);
 assert.equal(allowedUrl('https://example.org/private',source),null);assert.equal(allowedUrl('http://1484machinaka.jp/event/1',source),null);
});
test('aichi discovery reads dates from the event container when the link text has no date',()=>{
 const s=config.sources.find(x=>x.id==='aichi');
 const url='https://aichinow.pref.aichi.jp/events/detail/9999?ref=east';
 const html='<section class="event-card"><span>蒲郡市</span><a href="'+url+'">秋のイベント</a><time>2026年11月22日(日)</time></section>';
 const rows=discover(html,s,s.urls[0],new Date('2026-10-19T00:00:00+09:00'));
 assert.equal(rows.length,1);assert.equal(rows[0].url,url);assert.match(rows[0].hint,/蒲郡市/);assert.match(rows[0].hint,/2026年11月22日/);
});
test('aichi direct listing fallback keeps only configured East Mikawa cities',()=>{
 const s=config.sources.find(x=>x.id==='aichi');
 const base='https://aichinow.pref.aichi.jp/events/';
 const html='<article><span>豊橋市</span><a href="/events/detail/1111/">豊橋の催し 2026年11月2日(月)</a></article><article><span>名古屋市</span><a href="/events/detail/2222/">名古屋の催し 2026年11月3日(火)</a></article>';
 const rows=discover(html,s,base,new Date('2026-10-19T00:00:00+09:00'));
 assert.equal(rows.length,1);assert.match(rows[0].url,/1111/);assert.match(rows[0].hint,/豊橋市/);
});
test('Toyohashi tourism and Gamagori listings discover only their event detail URLs',()=>{
 const toy=config.sources.find(x=>x.id==='toyohashi-tourism');
 const toyRows=discover('<a href="/toyohashi/event-info/?Mode=detail&code=997">豊橋まつり</a><a href="/toyohashi/topics/?Mode=detail&code=1">topic</a>',toy,toy.urls[0]);
 assert.equal(toyRows.length,1);assert.match(toyRows[0].url,/Mode=detail&code=997/);
 const gama=config.sources.find(x=>x.id==='gamagori');
 const gamaRows=discover('<a href="/archives/shun/mikawa-de-1002026">遊び100</a><a href="/archives/spot/foo">spot</a>',gama,gama.urls[0]);
 assert.equal(gamaRows.length,1);assert.match(gamaRows[0].url,/archives\/shun\/mikawa-de-1002026/);
});
test('Gamagori parser accepts official citywide and web events without inventing a venue',()=>{
 const s=config.sources.find(x=>x.id==='gamagori');
 const citywide='<html><body><h4>蒲郡みかん祭り2026</h4><h2>開催期間:2026年11月1日(日)〜12月31日(木)</h2><p>市内のあちこちでスイーツやグルメを楽しめます。</p></body></html>';
 const a=parseDetail(citywide,s,{url:'https://www.gamagori.jp/archives/shun/mikanmaturi2026',title:'11/1(日)〜12/31(木) 蒲郡みかん祭り2026',hint:''},regions,stamp)[0];
 assert.equal(a.city,'蒲郡市');assert.equal(a.venueName,'蒲郡市内各所');assert.equal(a.startAt.slice(0,10),'2026-11-01');
 const web='<html><body><h4>おもてなしコンシェルジュ検定募集開始！</h4><p>検定日：2026年12月5日(土)9:00〜12月7日(月)24:00（Web受検）</p></body></html>';
 const webRows=parseDetail(web,s,{url:'https://www.gamagori.jp/archives/shun/concierge',title:'2026年12月5日(土)〜12月7日(月) おもてなしコンシェルジュ検定募集開始！',hint:''},regions,stamp);
 assert.equal(webRows.length,1);const b=webRows[0];assert.equal(b.venueName,'オンライン(Web受検)');assert.equal(b.startAt.slice(0,10),'2026-12-05');assert.equal(b.endAt.slice(0,10),'2026-12-08');
});

test('verified venue names resolve a city without substituting a publisher address',()=>{
 const cases=[
  ['toyokawa','シントー・ハート・アリーナ前広場','豊川稲荷','豊川市','https://www.toyokawa-map.net/my_story_toyokawa/000186.html'],
  ['toyokawa','シントー・ハート・アリーナ前広場','豊川駐屯地','豊川市','https://www.toyokawa-map.net/event/000064.html'],
  ['machinaka','豊橋駅南口駅前広場','まちなか広場','豊橋市','https://www.city.toyohashi.lg.jp/48117.htm'],
  ['machinaka','豊橋駅南口駅前広場','水上ビル','豊橋市','https://1484machinaka.jp/event/15202'],
  ['tahara','田原市総合体育館周辺','崋山神社','田原市','https://www.taharakankou.gr.jp/spot/spot.php?spot_id=41']
 ];
 for(const [id,oldName,venue,city,evidence] of cases){
  const s=config.sources.find(x=>x.id===id);
  const html=fixture(id).replaceAll(oldName,venue);
  const rows=parseDetail(html,s,{url:s.urls[0],hint:''},regions,stamp);
  assert(rows.length>0,id+' '+venue);
  assert(rows.every(e=>e.city===city&&e.locationEvidenceUrl===evidence),id+' '+venue);
 }
 const s=config.sources.find(x=>x.id==='tahara');
 const invalid=fixture('tahara').replaceAll('田原市総合体育館周辺','会場未定');
 assert.throws(()=>parseDetail(invalid,s,{url:s.urls[0],hint:''},regions,stamp),/開催地/);
});
test('unknown host locality never substitutes for event venue',()=>{
 assert.throws(()=>parseDetail(page.replaceAll('豊橋駅南口駅前広場','会場未定'),source,candidate,regions,stamp),/開催地/);
 const e=parseDetail(page,source,candidate,regions,stamp)[0];assert.equal(e.coordinatePrecision,'city');
});
test('cancellation is explicit; conditional weather cancellation is not',()=>{
 const rain=page.replace('</section>','<p>雨天中止</p></section>');
 assert.equal(parseDetail(rain,source,candidate,regions,stamp)[0].status,'scheduled');
 assert.equal(parseDetail(page.replace('健康美マルシェ','【中止】健康美マルシェ'),source,candidate,regions,stamp)[0].status,'cancelled');
});
const tiny={...config,sources:[{...source,urls:[source.urls[0]],maxDetails:4}]};
const get=async url=>url===source.urls[0]?'<a href="'+candidate.url+'">健康美マルシェ</a>':page;
test('real-shaped discovery adds a new event; cached repeat makes no requests or duplicates',async()=>{
 const a=await collect(tiny,regions,{events:[],sources:[]},stamp,get);assert.equal(a.snapshot.events.length,1);
 validateSnapshot(a.snapshot,regions);
 const b=await collect(tiny,regions,a.snapshot,stamp,async()=>{throw Error('cache failed')});assert.deepEqual(b.snapshot.events,a.snapshot.events);assert.deepEqual(b.snapshot.sources,a.snapshot.sources);
});
test('changed collector fingerprint restarts source rotation from the newest listing entries',async()=>{
 const rotating={...config,sources:[{...source,urls:[source.urls[0]],maxDetails:1}]};
 const first='https://1484machinaka.jp/event/15092',second='https://1484machinaka.jp/event/15093';
 const read=async u=>u===source.urls[0]?'<a href="'+first+'">新着1</a><a href="'+second+'">新着2</a>':page;
 const previous={events:[],sources:[{id:source.id,fingerprint:'stale-fingerprint',status:'review',cursor:1,lastSuccessAt:null}],reviews:[]};
 const result=await collect(rotating,regions,previous,stamp,read,true);
 assert.equal(result.snapshot.events.length,1);assert.equal(result.snapshot.events[0].officialUrl,first);
});
test('partial failures preserve actual last verification, then expire recommendations after seven days',async()=>{
 const a=await collect(tiny,regions,{events:[],sources:[]},stamp,get);
 const b=await collect(tiny,regions,a.snapshot,'2026-10-03T10:00:00Z',async()=>{throw Error('HTTP 503')},true);
 assert.equal(b.allFailed,true);assert.equal(b.snapshot.events[0].updatedAt,stamp);assert.equal(b.snapshot.sources[0].lastSuccessAt,stamp);assert.equal(b.snapshot.sources[0].status,'failed');
 const future={...a.snapshot.events[0],endAt:'2026-11-01T00:00:00+09:00'};
 assert.equal(retainEvent(future,'2026-10-12T00:00:00Z',tiny,'failure').collectionExpired,true);
 assert.equal(retainEvent(a.snapshot.events[0],'2026-10-05T00:00:00Z',tiny,'failure').status,'ended');
 const ended=await collect(tiny,regions,a.snapshot,'2026-10-05T00:00:00Z',async()=>{throw Error('HTTP 503')},true);
 assert.equal(ended.allFailed,true);assert.equal(ended.snapshot.sources[0].accepted,0);assert.equal(ended.snapshot.sources[0].lastSuccessAt,stamp);
});
test('same URL is updated to cancellation without a new id',async()=>{
 const a=await collect(tiny,regions,{events:[],sources:[]},stamp,get);
 const b=await collect(tiny,regions,a.snapshot,'2026-10-03T10:00:00Z',async u=>(await get(u)).replace('健康美マルシェ','【中止】健康美マルシェ'),true);
 assert.equal(b.snapshot.events[0].id,a.snapshot.events[0].id);assert.equal(b.snapshot.events[0].status,'cancelled');
});

test('IPv4 alternate transport recovers a network fetch error and shares request budget/cache',async()=>{
 let primary=0,alternate=0;
 const f=makeFetcher({...config,attempts:1,maxRequests:2},async()=>{
  primary++;throw Object.assign(new TypeError('fetch failed'),{cause:{code:'ENETUNREACH'}});
 },async(url,s,timeout)=>{
  alternate++;assert.equal(url,candidate.url);assert.equal(s.id,source.id);assert.equal(timeout,config.timeoutMs);
  return {ok:true,status:200,url,text:async()=>page};
 });
 assert.equal(await f(candidate.url,source),page);
 assert.equal(await f(candidate.url,source),page);
 assert.equal(primary,1);assert.equal(alternate,1);assert.equal(f.count(),2);
});
test('HTTP 403 is never retried with an alternate transport',async()=>{
 let alternate=0;
 const f=makeFetcher({...config,attempts:2},async()=>({ok:false,status:403}),async()=>{
  alternate++;throw Error('not expected');
 });
 await assert.rejects(()=>f(candidate.url,source),/HTTP 403/);
 assert.equal(alternate,0);assert.equal(f.count(),1);
});
test('IPv4 fallback does not bypass the collection request budget',async()=>{
 let alternate=0;
 const f=makeFetcher({...config,attempts:1,maxRequests:1},async()=>{throw new TypeError('fetch failed');},async()=>{
  alternate++;return {ok:true,status:200,url:candidate.url,text:async()=>page};
 });
 await assert.rejects(()=>f(candidate.url,source),/収集の上限に到達/);
 assert.equal(alternate,0);assert.equal(f.count(),1);
});
test('unlisted redirect hosts from alternate transport are not accepted',async()=>{
 const f=makeFetcher({...config,attempts:1},async()=>{throw new TypeError('fetch failed');},async()=>({
  ok:true,status:200,url:'https://unlisted.invalid/event/',text:async()=>page
 }));
 await assert.rejects(()=>f(candidate.url,source),/Redirect host is not configured/);
});
test('HTTP failures have a finite retry bound',async()=>{
 let n=0;const f=makeFetcher({...config,timeoutMs:1000,maxRequests:2},async()=>{n++;throw Error('timeout')});
 await assert.rejects(()=>f(candidate.url,source));assert.equal(n,2);
});
test('one failed source does not discard another source update',async()=>{
 const plat=config.sources.find(s=>s.id==='plat'), detail='https://toyohashi-at.jp/event/performance.php?id=2102';
 const both={...config,sources:[tiny.sources[0],{...plat,maxDetails:1}]};
 const read=async u=>u===plat.urls[0]?'<a href="'+detail+'">PLAT</a>':u===detail?fixture('plat'):get(u);
 const a=await collect(both,regions,{events:[],sources:[]},stamp,read);
 const b=await collect(both,regions,a.snapshot,'2026-10-03T10:00:00Z',async u=>{if(u.includes('1484machinaka'))throw Error('HTTP 503');return read(u);},true);
 assert.equal(b.allFailed,false);assert(b.snapshot.events.some(e=>e.collectorSource==='plat'&&e.updatedAt==='2026-10-03T10:00:00Z'));
 assert.equal(b.snapshot.events.find(e=>e.collectorSource==='machinaka').updatedAt,stamp);
});
test('official access restrictions stop the host without retries or probing further pages',async()=>{
 let n=0;const f=makeFetcher(config,async()=>{n++;return {ok:false,status:403};});
 await assert.rejects(()=>f(candidate.url,source),/403/);await assert.rejects(()=>f(candidate.url+'?page=2',source),/追加取得を停止/);assert.equal(n,1);
});
test('date fields displayed as two endpoints remain a range, not two unrelated days',()=>{
 const html=page.replace('2026.10.04<span class="week">(日)</span></p>','2026.10.04<span class="week">(日)</span></p><p>2026.10.11<span class="week">(日)</span></p>');
 const e=parseDetail(html,source,candidate,regions,stamp);assert.equal(e.length,1);assert.equal(e[0].endAt,'2026-10-12T00:00:00+09:00');
});
test('HTTP 200 login wall is not a social post; public excerpts are explicitly labelled',()=>{
 assert.equal(readPublicSocial('<html>Log in to Instagram accounts/login</html>','https://www.instagram.com/p/test/').status,'login_or_access_required');
 const r=readPublicSocial('<meta property="og:description" content="2026年10月4日に豊橋市で開催する健康美マルシェ。開催場所は豊橋駅南口駅前広場です。">','https://www.instagram.com/p/test/');
 assert.equal(r.posts[0].acquisition,'direct_public_excerpt');assert.equal(r.posts[0].publishedAt,null);
 assert.equal(readPublicSocial('<html>Instagram</html>','https://www.instagram.com/test/').posts.length,0);
});
test('date endpoints corrected to a range preserve saved IDs without duplicate occurrences',async()=>{
 const old=await collect(tiny,regions,{events:[],sources:[]},stamp,get), e=old.snapshot.events[0];
 old.snapshot.events=[{...e,id:e.id+'-2026-10-04',aliases:['saved-legacy']},{...e,id:e.id+'-2026-10-11',startAt:'2026-10-11T00:00:00+09:00',endAt:'2026-10-12T00:00:00+09:00'}];
 const html=page.replace('2026.10.04<span class="week">(日)</span></p>','2026.10.04<span class="week">(日)</span></p><p>2026.10.11<span class="week">(日)</span></p>');
 const next=await collect(tiny,regions,old.snapshot,'2026-10-03T10:00:00Z',async u=>u===source.urls[0]?get(u):html,true);
 validateSnapshot(next.snapshot,regions);assert.equal(next.snapshot.events.length,1);
 assert.equal(next.snapshot.events[0].id,old.snapshot.events[0].id);assert(next.snapshot.events[0].aliases.includes(old.snapshot.events[1].id));assert(next.snapshot.events[0].aliases.includes('saved-legacy'));
 const repeated=reconcileOccurrences(parseDetail(html,source,candidate,regions,stamp),next.snapshot.events,stamp);assert.equal(repeated[0].id,next.snapshot.events[0].id);assert.deepEqual(repeated[0].aliases,next.snapshot.events[0].aliases);
});
test('social 403 stops the host and uses no credentials or retry',async()=>{
 let calls=0;const result=await crawlSocial([{instagramUrl:'https://www.instagram.com/a/'},{instagramUrl:'https://www.instagram.com/b/'}],null,stamp,async(u,options)=>{calls++;assert(!options.headers.cookie&&!options.headers.authorization);return {ok:false,status:403};});
 assert.equal(calls,2);assert.equal(result.sources[2].status,'host_limited');
});
