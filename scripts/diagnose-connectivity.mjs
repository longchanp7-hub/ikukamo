import dns from 'node:dns/promises';
import https from 'node:https';
import {execFileSync} from 'node:child_process';
const urls=['https://www.toyokawa-map.net/event/?Mode=search','https://www.taharakankou.gr.jp/event/index.php','https://www.actcity.jp/event/'];
const summarize=(method,url,status,body,extra={})=>console.log(JSON.stringify({method,url,status,...extra,title:body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1],sample:body.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').slice(0,600)}));
for(const url of urls){
 console.log(JSON.stringify({url,dns:await dns.lookup(new URL(url).hostname,{all:true}).catch(e=>String(e))}));
 let restricted=false;
 try{const r=await fetch(url,{signal:AbortSignal.timeout(10000),headers:{'user-agent':'ikukamo-official-collector/2.0 (+https://github.com/longchanp7-hub/ikukamo)'}});const body=await r.text();summarize('node-default-language',url,r.status,body,{final:r.url});restricted=[401,403,429].includes(r.status);}
 catch(e){console.log(JSON.stringify({method:'node-default-language',url,error:String(e),cause:e.cause?.code}));}
 if(restricted)continue;
 try{const r=await fetch(url,{signal:AbortSignal.timeout(10000),headers:{'user-agent':'ikukamo-official-collector/2.0 (+https://github.com/longchanp7-hub/ikukamo)','accept-language':'ja-JP,ja;q=0.9,en;q=0.5'}});summarize('node',url,r.status,await r.text(),{final:r.url});restricted=[401,403,429].includes(r.status);}
 catch(e){console.log(JSON.stringify({method:'node',url,error:String(e),cause:e.cause?.code}));}
 if(restricted)continue;
 try{await new Promise((resolve,reject)=>{const req=https.get(url,{family:4,headers:{'user-agent':'ikukamo-official-collector/2.0 (+https://github.com/longchanp7-hub/ikukamo)','accept-language':'ja-JP,ja;q=0.9,en;q=0.5'}},res=>{let body='';res.on('data',x=>{body+=x;if(body.length>2000000)req.destroy(Error('size'));});res.on('end',()=>{summarize('https-ipv4',url,res.statusCode,body,{location:res.headers.location});restricted=[401,403,429].includes(res.statusCode);resolve();});});const timer=setTimeout(()=>req.destroy(Error('timeout')),10000);req.on('close',()=>clearTimeout(timer));req.on('error',reject);});}
 catch(e){console.log(JSON.stringify({method:'https-ipv4',url,error:String(e)}));}
 if(restricted)continue;
 try{const result=execFileSync('curl',['-4','--silent','--show-error','--max-time','10','-H','Accept-Language: ja-JP,ja;q=0.9,en;q=0.5','-w','\nHTTP_CODE:%{http_code}',url],{encoding:'utf8',timeout:12000,maxBuffer:2000000});summarize('curl-ipv4',url,result.match(/HTTP_CODE:(\d+)/)?.[1],result);}
 catch(e){console.log(JSON.stringify({method:'curl-ipv4',url,error:e.message}));}
}
