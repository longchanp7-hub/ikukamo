import { load } from 'cheerio';
import crypto from 'node:crypto';
import { extractEvents } from './official-collector.mjs';
import { embeddedPosts } from './social-public.mjs';
export const clean = text => String(text || '').normalize('NFKC').replace(/\s+/g,' ').trim();
export const hash = text => crypto.createHash('sha256').update(text).digest('hex');
export function allowedUrl(value, source, base) {
  try { const u=new URL(value,base); if(u.protocol!=='https:'||u.username||u.password||!source.hosts.includes(u.hostname.replace(/^www\./,'')))return null;u.hash='';return u.href; } catch { return null; }
}
const day = (y,m,d) => { const s=[y,String(m).padStart(2,'0'),String(d).padStart(2,'0')].join('-');const t=Date.parse(s+'T00:00:00Z');return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===s?s:null; };
const nextDay = s => new Date(Date.parse(s+'T00:00:00Z')+86400000).toISOString().slice(0,10);
// A year must appear in the event date field. Never use publication date or today's year.
export function parseDates(value) {
  let s=clean(value).replace(/令和(\d+)年(?:度)?/g,(_,y)=>(2018+Number(y))+'年').replace(/(20\d{2})年(?:度|は)/g,'$1年').replace(/(20\d{2})[./-](\d{1,2})[./-](\d{1,2})/g,'$1年$2月$3日');
  const first=s.search(/20\d{2}年\s*\d{1,2}月\s*\d{1,2}日/);if(first<0)throw Error('開催年・月日が開催欄で確定できません');s=s.slice(first);
  const tokens=[...s.matchAll(/(?:(20\d{2})年\s*)?(?:(\d{1,2})月\s*)?(\d{1,2})日(?!曜|間)/g)];
  let y,m,lastEnd=0;const periods=[];
  for(const t of tokens){const between=s.slice(lastEnd,t.index);if(t[1])y=+t[1];if(t[2]){if(!t[1]&&m&&+t[2]<m&&/[～〜~–—-]/.test(between))y++;m=+t[2];}const d=day(y,m,+t[3]);if(!d)throw Error('実在しない開催日');
    if(periods.length&&/[～〜~–—-]/.test(between)){const prev=periods.at(-1);prev.end=d;if(Date.parse(d)<Date.parse(prev.start)||Date.parse(d)-Date.parse(prev.start)>180*86400000)throw Error('会期が逆順または長期のため要確認');}
    else periods.push({start:d,end:d});lastEnd=t.index+t[0].length;
  }
  if(!periods.length||periods.length>12)throw Error('開催日の組合せを要確認');return periods.filter((p,i)=>!periods.some((q,j)=>j!==i&&q.start<=p.start&&q.end>=p.end&&(q.start<p.start||q.end>p.end||j<i)));
}
export function dateBounds(period, timeText) {
  const t=clean(timeText), times=[...t.matchAll(/(\d{1,2})[:時](\d{2})?(?:分)?/g)];
  // Only a single unambiguous time range on one day is treated as opening hours.
  if(period.start===period.end&&times.length===2&&/[～〜~–—-]/.test(t)&&!/[月日]|休|受付|開場|部|回|\//.test(t)){
    const hm=times.map(x=>[+x[1],+(x[2]||0)]);
    if(hm.every(([h,m])=>h<24&&m<60)&&hm[1][0]*60+hm[1][1]>hm[0][0]*60+hm[0][1]){
      const iso=([h,m])=>period.start+'T'+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':00+09:00';
      return {startAt:iso(hm[0]),endAt:iso(hm[1]),timePrecision:'time'};
    }
  }
  return {startAt:period.start+'T00:00:00+09:00',endAt:nextDay(period.end)+'T00:00:00+09:00',timePrecision:'date'};
}
function fields($){const out={};$('tr').each((_,e)=>{const k=clean($(e).children('th').first().text()).replace(/\s/g,''),v=clean($(e).children('td').text());if(k&&v&&!out[k])out[k]=v;});$('dt').each((_,e)=>{const k=clean($(e).text()).replace(/[【】\s]/g,''),v=clean($(e).next('dd').text());if(k&&v&&!out[k])out[k]=v;});return out;}
function section($,label){const h=$('h2,h3').filter((_,e)=>clean($(e).text())===label).first();return clean(h.nextUntil('h2,h3').text());}
function coordinates($){for(const e of $('iframe[src*="google.com/maps"],a[href*="google.com/maps"]').toArray()){const u=$(e).attr('src')||$(e).attr('href');const a=u.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)||u.match(/!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/);if(a){const lat=+(u.includes('!2d')?a[2]:a[1]),lon=+(u.includes('!2d')?a[1]:a[2]);if(lat>34&&lat<36&&lon>136&&lon<139)return {latitude:lat,longitude:lon};}}return null;}
const cityFrom = (text,regions) => regions.cities.find(c=>text.includes(c.name))?.name;
const venueRules=[
 {pattern:/シントー[・\s-]*ハート[・\s-]*アリーナ|Sinto Heart Arena/i,city:'豊川市',url:'https://www.city.toyokawa.lg.jp/soshiki/kyoikuiinkai/sports/2/1/396.html'},
 {pattern:/豊橋駅南口駅前広場/,city:'豊橋市',url:'https://www.city.toyohashi.lg.jp/48116.htm'},
 {pattern:/岡崎げんき館/,city:'岡崎市',url:'https://okazaki-kanko.jp/event/711'}
];
export function discover(html, source, base, now=new Date()) {
 if(source.parser==='hamamatsu-city'){const data=JSON.parse(html);if(data.success!=='Y')throw Error('浜松市公開JSONの取得失敗');const $=load(data.odpf_body);return $('tr td a[href]').toArray().flatMap(e=>{const url=allowedUrl($(e).attr('href'),source,base);return url&&new URL(url).searchParams.get('m')==='show'?[{url,title:clean($(e).text()).slice(0,180),hint:'',method:'public_json'}]:[];});}
 if (/^\s*\[/.test(html)) {
  const rows=JSON.parse(html);return rows.flatMap(p=>{const url=allowedUrl(p.link,source,base);return url?[{url,title:clean(load(p.title?.rendered||'').text()).slice(0,180),hint:'',method:'public_json'}]:[];});
 }
 if (/^\s*(?:<\?xml|<rss\b|<feed\b|<urlset\b)/i.test(html)) {
  const xml=load(html,{xmlMode:true});return xml('item,entry,url').toArray().flatMap(e=>{const entry=xml(e),value=entry.find('link').attr('href')||entry.find('link,loc').first().text(),url=allowedUrl(value,source,base);return url?[{url,title:clean(entry.find('title').text()).slice(0,180),hint:'',method:entry.is('url')?'sitemap':'feed'}]:[];});
 }
 const $=load(html),out=new Map();const patterns={machinaka:/\/event\/\d+\/?$/,plat:/\/event\/performance\.php\?id=\d+$/,toyokawa:/\/event\/\d+\.html$/,tahara:/\/event\/detail\.php\?event_id=\d+$/,okazaki:/\/event\/\d+$/,shinshiro:/\/event\/detail\/\d+\/$/,aichi:/\/events\/detail\/\d+\/$/,west:/\/spots\/detail\/\d+\/$/,actcity:/\/event\/detail\/\?id=\d+$/};
 $('noscript,script,style').remove();
 $('a[href]').each((_,e)=>{const url=allowedUrl($(e).attr('href'),source,base);if(!url||!patterns[source.parser]?.test(new URL(url).pathname+new URL(url).search))return;const title=clean($(e).text());let hint='';
   if(source.parser==='aichi'){hint=clean($(e).closest('.season-list-event').text());try{if(parseDates(title).every(p=>Date.parse(p.end+'T23:59:59+09:00')<+now))return;}catch{return;}}
   const candidate={url,title:title.slice(0,180),hint:hint.slice(0,500)};if(!out.has(url)||title.length>out.get(url).title.length)out.set(url,candidate);
 });return [...out.values()];
}
export function parseDetail(html,source,candidate,regions,stamp) {
 let publicTitle='';if(source.parser==='hamamatsu-city'){const data=JSON.parse(html);if(data.success!=='Y')throw Error('浜松市公開JSONの詳細取得失敗');publicTitle=clean(data.title);html=data.odpf_body;}
 const structured=extractEvents(html,{...source,url:candidate.url},stamp);
 if(structured.length)return structured.map((e,i)=>{if(!regions.cities.some(c=>c.name===e.city))throw Error('構造化データの開催地は対象地域外');return {...e,id:'auto-'+hash(candidate.url).slice(0,16)+(structured.length>1?'-'+i:''),collectorSource:source.id,timePrecision:'time',dateText:e.startAt+' / '+e.endAt,extractionMethod:'jsonld',statusCheckedAt:stamp,priceText:e.priceText||'未確認（公式ページで確認）'};});
 const $=load(html);$('script,style,nav,footer,.sidebar,aside,noscript').remove();const f=fields($);let title='',dateText='',timeText='',venue='',address=f['所在地']||f['住所']||'',city='',body;
 if(source.parser==='machinaka'){body=$('section.post');title=clean(body.find('h1').first().text());dateText=body.find('header .date p').toArray().map(e=>clean($(e).text())).join(' ~ ');venue=clean(body.find('header .place').text());const t=body.find('.content').text().normalize('NFKC');timeText=t.match(/開催日時[：:]([^\n]+)/)?.[1]?.replace(/^\s*\d+月\d+日\s*/,'')||'';}
 if(source.parser==='plat'){body=$('#tab1');title=clean($('h1').filter((_,e)=>$(e).text().trim()).first().text());dateText=f['開催期間'];venue=f['会場']||'';if(/^(主ホール|アートスペース|創造活動室)/.test(venue)){venue='穂の国とよはし芸術劇場PLAT '+venue;city='豊橋市';}timeText=section($,'日程');}
 if(source.parser==='toyokawa'){body=$('main');const h=$('h2._my_detail_name').clone();h.find('rt').remove();title=clean(h.text());dateText=f['開催期間'];timeText=clean(dateText).match(/\d{1,2}:\d{2}\s*[~〜～-]\s*\d{1,2}:\d{2}/)?.[0]||'';venue=f['開催場所'];}
 if(source.parser==='tahara'){body=$('main,#contents').first();title=clean($('h2.name').text());const p={};$('li').each((_,e)=>{const a=$(e).children('p');if(a.length===2)p[clean(a.first().text())]=clean(a.last().text());});dateText=p['期間'];timeText=p['時間'];venue=p['場所'];}
 if(source.parser==='okazaki'){body=$('main').first();title=clean($('h1.title').text());dateText=f['開催期間'];timeText=f['開催時間'];venue=f['開催場所'];}
 if(source.parser==='shinshiro'){body=$('main').first();title=clean($('h1.detail-ttl').first().text())||clean($('h1').filter((_,e)=>$(e).text().trim()).first().text());dateText=f['開催期間'];timeText=f['開催時間'];city=clean($('._city').first().text());venue=f['開催場所']||f['会場']||'';if(!venue){if(title.includes('富永神社'))venue='富永神社';else if(title.includes('門谷小学校'))venue='門谷小学校';else if(title.includes('鳳来寺山'))venue='鳳来寺山';}}
 if(source.parser==='aichi'){body=$('main').first();title=clean($('.mainimg-ttl').text());dateText=f['開催日'];timeText=f['開催時間'];venue=f['開催場所'];}
 if(source.parser==='west'){body=$('main,#contents').first();title=clean($('h1').filter((_,e)=>$(e).text().trim()).first().text()).replace(/\s*\([^)]*\)\s*$/,'');dateText=f['開催時期'];timeText=f['開催時間'];venue=f['開催場所'];}
 if(source.parser==='actcity'){body=$('#contents,main').first();title=clean($('h3').filter((_,e)=>$(e).text().trim()&&!/イベントカレンダー/.test($(e).text())).first().text());dateText=f['開催日'];timeText=f['時間'];venue=f['会場'];if(venue?.startsWith('アクトシティ浜松'))city='浜松市';}
 if(source.parser==='hamamatsu-city'){body=$('body');title=publicTitle;dateText=section($,'開催日時').replaceAll('から','~');timeText=dateText.replace(/20\d{2}年\d{1,2}月\d{1,2}日/g,'').replace(/^[\s~]+/,'');venue=f['場所'];address=f['場所'];}
 title=clean(title);venue=clean(venue);dateText=clean(dateText);timeText=clean(timeText);if(!title||title.length>200||!venue)throw Error('イベント名・開催会場が確定できません');
 const rule=venueRules.find(r=>r.pattern.test(venue));city=city||cityFrom(address+' '+venue,regions)||rule?.city||cityFrom(candidate.hint,regions);
 if(!city)throw Error('開催地の市町村が不明（発信元の所在地で代用しません）');const place=regions.cities.find(c=>c.name===city);if(!place)throw Error('対象地域外: '+city);
 const periods=parseDates(dateText),geo=coordinates($),text=clean(body?.text()||'');
 const cancelled=/[【\[]中止[】\]]|開催中止/.test(title)||/(?:開催|本イベント|本公演)(?:を|は)中止(?:いたします|します|となりました)/.test(text);
 const postponed=/[【\[].*延期.*[】\]]/.test(title)||/(?:開催|本イベント|本公演)(?:を|は)延期(?:いたします|します|となりました)/.test(text);
 const price=clean(f['料金']||f['参加費']||f['入場料']||f['料金(詳細)']||f['料金(基本)']||section($,'料金')).slice(0,350)||'未確認（公式ページで確認）';
 const social=body?.find('a[href]').map((_,e)=>$(e).attr('href')).get().filter(u=>/^https:\/\/(?:www\.)?(?:instagram\.com|x\.com|twitter\.com)\//.test(u)&&!/(intent|share)/.test(u))||[];
 return periods.map(period=>{const bounds=dateBounds(period,timeText),id='auto-'+hash(candidate.url).slice(0,16)+(periods.length>1?'-'+period.start:'');const status=cancelled?'cancelled':postponed?'postponed':Date.parse(bounds.endAt)<=Date.parse(stamp)?'ended':'scheduled';
   const category=/マルシェ|食|グルメ|肉|パン|どんぶり/.test(title)?'food':/祭|花火/.test(title)?'festival':/音楽|ジャズ|演奏|オペラ|コンサート/.test(title)?'music':'local';
   const indoor=source.parser==='plat'&&/主ホール|アートスペース|創造活動室/.test(venue);
   return {id,title,embeddedSocial:embeddedPosts($,body||$("main"),candidate.url),description:source.name+'の開催情報。'+dateText+(timeText?' / '+timeText:''),category,...bounds,dateText,timeText,venueName:venue,address,city,prefecture:city==='浜松市'?'静岡県':'愛知県',latitude:geo?.latitude??place.latitude,longitude:geo?.longitude??place.longitude,coordinatePrecision:geo?'venue':'city',locationEvidenceUrl:rule?.url||candidate.url,distanceFromToyohashiKm:0,driveMinutes:0,score:60,confidence:'high',status,statusCheckedAt:stamp,statusSourceUrl:candidate.url,officialUrl:candidate.url,mapUrl:'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(city+' '+venue),priceText:price,parkingText:f['駐車場'],aiComment:'公式情報を通常スクリプトで整理',goNowReason:'公式の開催日が掲載されています',recommendReason:'公式の開催情報から見つけた近隣の候補',isSample:false,weatherDependent:false,venueKind:indoor?'indoor':'unknown',...(indoor?{venueEvidenceUrl:candidate.url}:{}),limitedPeriod:true,cadence:'short_run',adultOriented:false,foodAppeal:0,rarity:0,snsBuzz:0,instagramUrl:social.find(u=>u.includes('instagram.com')),xUrl:social.find(u=>/x\.com|twitter\.com/.test(u)),socialAcquisition:social.length?'official_site_link':undefined,collectorSource:source.id,sources:[{id:'src-'+id,eventId:id,sourceType:'official',sourceUrl:candidate.url,sourceName:source.name,fetchedAt:stamp}],createdAt:stamp,updatedAt:stamp};
 });
}
