import https from 'node:https';
import {gunzipSync, inflateSync, brotliDecompressSync} from 'node:zlib';
import {allowedUrl} from './discovery.mjs';

// A second transport only for network/transport failures, never for HTTP 401/403/429.
// Keep TLS validation enabled, use only configured HTTPS hosts and a small redirect limit.
export function fetchWithIPv4(url,source,timeoutMs){
 const read=(target,redirects)=>new Promise((resolve,reject)=>{
  const safe=allowedUrl(target,source);
  if(!safe){reject(Error('IPv4 destination host is not configured'));return;}
  const req=https.get(safe,{
   family:4,
   signal:AbortSignal.timeout(timeoutMs),
   headers:{
    'user-agent':'ikukamo-official-collector/2.0 (+https://github.com/longchanp7-hub/ikukamo)',
    'accept-language':'ja-JP,ja;q=0.9,en;q=0.5',
    'accept-encoding':'identity'
   }
  },res=>{
   const status=res.statusCode||0;
   if(status>=300&&status<400){
    res.resume();
    const next=res.headers.location&&allowedUrl(res.headers.location,source,safe);
    if(!next){reject(Error('IPv4 redirect host is not configured'));return;}
    if(redirects>=2){reject(Error('IPv4 redirect limit reached'));return;}
    resolve(read(next,redirects+1));return;
   }
   const chunks=[];let total=0;
   res.on('data',chunk=>{
    total+=chunk.length;
    if(total>2000000){req.destroy(Error('IPv4 document exceeds size limit'));return;}
    chunks.push(chunk);
   });
   res.once('error',reject);
   res.once('end',()=>{
    try{
     let bytes=Buffer.concat(chunks);
     const encoding=String(res.headers['content-encoding']||'identity').toLowerCase();
     const limits={maxOutputLength:2000000};
     if(encoding==='gzip')bytes=gunzipSync(bytes,limits);
     else if(encoding==='deflate')bytes=inflateSync(bytes,limits);
     else if(encoding==='br')bytes=brotliDecompressSync(bytes,limits);
     else if(encoding!=='identity')throw Error('Unsupported IPv4 content encoding');
     if(bytes.length>2000000)throw Error('IPv4 decoded document exceeds size limit');
     resolve({ok:status>=200&&status<300,status,url:safe,text:async()=>bytes.toString('utf8')});
    }catch(e){reject(e);}
   });
  });
  req.once('error',reject);
 });
 return read(url,0);
}
