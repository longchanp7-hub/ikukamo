import { load } from 'cheerio';
import { clean } from './discovery.mjs';
const allowed = value => {try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&['instagram.com','www.instagram.com','x.com','www.x.com','twitter.com'].includes(u.hostname)?u.href:null;}catch{return null;}};
export function readPublicSocial(html,url){
 const $=load(html);const isPost=/instagram\.com\/(?:p|reel)\/|(?:x|twitter)\.com\/[^/]+\/status\/\d+/.test(url);
 const posts=[];
 $('script[type="application/ld+json"]').each((_,e)=>{try{const walk=v=>{if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object'){if(['SocialMediaPosting','DiscussionForumPosting'].includes(v['@type'])&&typeof v.articleBody==='string'&&isPost)posts.push({url,text:clean(v.articleBody).slice(0,1500),publishedAt:v.datePublished||null,acquisition:'direct_public_html'});if(v['@graph'])walk(v['@graph']);}};walk(JSON.parse($(e).text()));}catch{/* Not usable structured data */}});
 const description=clean($('meta[property="og:description"]').attr('content'));
 if(isPost&&!posts.length&&description.length>40&&!/Login|Log in|ログイン|Sign up|Create an account|Join Instagram/i.test(description))posts.push({url,text:description.slice(0,1500),publishedAt:null,acquisition:'direct_public_excerpt'});
 const links=[...new Set($('a[href]').map((_,e)=>allowed($(e).attr('href'))).get().filter(u=>u&&/instagram\.com\/(?:p|reel)\/|(?:x|twitter)\.com\/[^/]+\/status\/\d+/.test(u)))].slice(0,6);
 const login=/accounts\/login|ログインして|ログインが必要|Log in to|Sign in to|login_required|challenge_required|captcha|access denied/i.test(html);
 return {status:posts.length?'public_post_text':login?'login_or_access_required':links.length?'public_post_links':'no_public_post_body',posts,links};
}
export async function crawlSocial(events,previous,stamp,fetcher=fetch){
 const urls=[...new Set(['https://x.com/Plat_Toyohashi',...events.flatMap(e=>[e.instagramUrl,e.xUrl]).filter(Boolean)].map(allowed).filter(Boolean))].slice(0,5);
 const old=previous?.sources||[],sources=[],posts=[],blocked=new Set();let requests=0;
 for(let i=0;i<urls.length&&i<5;i++){
  const url=urls[i],host=new URL(url).hostname.replace(/^www\./,''),before=old.find(r=>r.url===url);
  const ttl=/login|access|http_403|http_429|no_public_post_body|host_limited/.test(before?.status||'')?7:1;
  if(before&&Date.parse(stamp)-Date.parse(before.checkedAt)<ttl*86400000){sources.push(before);posts.push(...(previous.posts||[]).filter(p=>p.url===url));if(/login|access|http_403|http_429/.test(before.status))blocked.add(host);continue;}
  if(blocked.has(host)){sources.push({url,checkedAt:stamp,status:'host_limited',reason:'同一ホストの制限を検出したため追加取得を停止',lastSuccessAt:before?.lastSuccessAt||null});continue;}
  let record={url,checkedAt:stamp,lastSuccessAt:before?.lastSuccessAt||null,status:'network_error'};
  try{
   requests++;const r=await fetcher(url,{signal:AbortSignal.timeout(8000),redirect:'follow',headers:{'user-agent':'ikukamo-public-information/1.0 (+https://github.com/longchanp7-hub/ikukamo)'}});
   if(!r.ok){record.status='http_'+r.status;if([401,403,429].includes(r.status))blocked.add(host);}
   else if(r.url&&!allowed(r.url)){record.status='login_or_access_required';blocked.add(host);}
   else {const html=await r.text();if(html.length>2000000)throw Error('document too large');const parsed=readPublicSocial(html,url);record.status=parsed.status;record.discovered=parsed.links.length;if(parsed.posts.length){record.lastSuccessAt=stamp;posts.push(...parsed.posts.map(p=>({...p,fetchedAt:stamp})));}if(parsed.status==='login_or_access_required')blocked.add(host);for(const link of parsed.links)if(!urls.includes(link)&&urls.length<5)urls.push(link);}
  }catch(e){record.reason=e.name==='TimeoutError'?'公開ページの取得が時間切れ':String(e.message).slice(0,120);}
  sources.push(record);if(i+1<urls.length)await new Promise(r=>setTimeout(r,800));
 }
 return {sources,posts,requests,note:'認証・Cookie・有料APIを使わない公開HTMLの巡回。投稿本文が取れない場合は成功扱いにしません。SNSの掲載日時をイベント開催日時として使用しません。'};
}
export function embeddedPosts($,body,pageUrl){
 return body.find('blockquote.instagram-media,blockquote.twitter-tweet').toArray().map(e=>{
  const url=allowed($(e).attr('data-instgrm-permalink')||$(e).find('a[href]').last().attr('href'));
  const text=clean($(e).find('p').map((_,p)=>$(p).text()).get().join(' '));
  return url&&text.length>20?{url,text:text.slice(0,1500),pageUrl,acquisition:'official_site_embed'}:null;
 }).filter(Boolean);
}
