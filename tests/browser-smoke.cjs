/* Automated tests use a fresh browser context; no user browser data is read. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const out = path.resolve('out'), evidence = path.resolve(process.env.EVIDENCE_DIR || '../ikukamo-qa');
fs.mkdirSync(evidence,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{try{let p=decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/^\/ikukamo\//,'/');let file=path.resolve(out,'.'+p);if(!file.startsWith(out+path.sep)&&file!==out)throw Error();if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end('not found');}});
const done=[];
const now=new Date('2026-10-03T10:00:00+09:00');
let browser;
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const app=process.env.APP_URL||`http://127.0.0.1:${server.address().port}/ikukamo/`;
browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
async function context(mode='ok'){
 const c=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}); c.setDefaultTimeout(30000); const p=await c.newPage(); const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.clock.install({time:now});
 await c.addInitScript(mode=>{
  if(mode==='corrupt')localStorage.setItem('ikukamo.personal.v2','{broken-personal-data');
  if(mode==='bad-cache')sessionStorage.setItem('ikukamo.venueWeather.v1',JSON.stringify({'34.76,137.38':{fetchedAt:Date.now(),points:'broken'}}));
  if(mode==='quota'){const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='ikukamo.personal.v2')throw new DOMException('test full','QuotaExceededError');return original.call(this,key,value);};}
 },mode);
 await c.addInitScript(mode=>Object.defineProperty(navigator,'geolocation',{configurable:true,value:mode==='unsupported'?undefined:{getCurrentPosition:(ok,fail)=>{if(mode==='deny'||mode==='timeout')fail({code:mode==='deny'?1:3});else ok({coords:{latitude:mode==='invalid'?NaN:34.7108,longitude:137.7261,accuracy:50}});}}}),mode);
 await c.route('https://fonts.**',r=>r.abort());
 await c.route('**/*',async r=>{const u=new URL(r.request().url()); if(u.hostname==='api.open-meteo.com'){
  if(mode==='429')return r.fulfill({status:429,body:'rate limit'});if(mode==='offline')return r.abort();
  const n=u.searchParams.get('latitude').split(',').length;const forecast={hourly:{time:['2026-10-03T10:00','2026-10-03T12:00','2026-10-03T14:00','2026-10-03T16:00'],temperature_2m:[20,21,22,20],precipitation_probability:[0,80,80,80],weather_code:[0,61,61,61]}};
  return r.fulfill({json:n===1?forecast:Array(n).fill(forecast)});
 } if(r.request().resourceType()==='image'&&!r.request().url().startsWith(app))return r.abort();return r.continue();});
 await p.goto(app,{waitUntil:'domcontentloaded'});await p.getByLabel('訪問日時',{exact:true}).waitFor();await p.locator('article').first().waitFor();return {c,p,errors};}
const {c,p,errors}=await context();
for(const width of [360,390,874,1280]){await p.setViewportSize({width,height:900});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.screenshot({path:path.join(evidence,`home-${width}.png`)});}done.push('responsive 360/390/874/1280');
await p.setViewportSize({width:390,height:844});await p.getByRole('button',{name:'現在地を使う',exact:true}).click();await p.getByText(/現在地を使用中/).waitFor();await p.getByLabel('出発地域').selectOption('豊橋市');done.push('GPS success + manual fallback');
await p.getByRole('button',{name:'会場の天気を取得',exact:true}).click();await p.getByText(/会場ごとの予報を取得しました/).waitFor();assert((await p.locator('[data-testid=venue-weather]').allTextContents()).some(t=>t.includes('降水確率80%')));
await p.getByLabel('屋内確認済みのみ').check();assert(await p.locator('article').count()===2);await p.getByLabel('屋内確認済みのみ').uncheck();done.push('destination forecast + verified indoor filter');
const first=p.locator('article').first(), title=await first.locator('h2').innerText();await first.getByRole('button',{name:'行きたい',exact:true}).click();await first.getByRole('link',{name:'詳細',exact:true}).click();await p.waitForURL('**/event/**');await p.getByRole('link',{name:'← もどる',exact:true}).waitFor();await p.getByRole('button',{name:'行きたい',exact:true}).waitFor();await p.goto(app);await p.getByRole('navigation').getByRole('button',{name:'保存',exact:true}).click();await p.getByText(title,{exact:true}).waitFor();done.push('want survives detail access');
await p.getByRole('button',{name:'選択を取り消す・再表示'}).first().click();await p.getByText('該当する予定はありません。').waitFor();
await p.getByRole('navigation').getByRole('button',{name:'インスタ',exact:true}).click();await p.getByPlaceholder('https://www.instagram.com/p/…').fill('https://www.instagram.com/p/Test123/');await p.getByPlaceholder('タイトル',{exact:true}).fill('ブラウザー検証の予定');await p.getByLabel('開始',{exact:true}).fill('2026-10-04T12:00');await p.getByLabel('終了',{exact:true}).fill('2026-10-03T11:00');await p.getByRole('button',{name:'予定に拾う',exact:true}).click();await p.getByText(/保存できませんでした/).waitFor();assert.equal(await p.getByPlaceholder('タイトル',{exact:true}).inputValue(),'ブラウザー検証の予定');await p.getByLabel('終了',{exact:true}).fill('2026-10-04T18:00');await p.getByRole('button',{name:'予定に拾う',exact:true}).click();await p.getByText('ブラウザー検証の予定',{exact:true}).waitFor();
await p.getByRole('navigation').getByRole('button',{name:'保存',exact:true}).click();await p.getByRole('button',{name:'自分で拾った予定',exact:true}).click();await p.getByRole('button',{name:'予定を編集',exact:true}).click();await p.getByPlaceholder('タイトル',{exact:true}).fill('編集した検証予定');await p.getByRole('button',{name:'変更を保存',exact:true}).click();await p.getByText('編集した検証予定',{exact:true}).waitFor();done.push('manual create validation and edit');
await p.getByRole('navigation').getByRole('button',{name:'保存',exact:true}).click();await p.getByText('バックアップ・復元',{exact:true}).click();const dl=p.waitForEvent('download');await p.getByRole('button',{name:'JSONを書き出す',exact:true}).click();const download=await dl;const saved=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(saved.data.picked.length,1);
await p.locator('input[type=file]').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{}')});await p.getByText(/バックアップではありません/).waitFor();await p.locator('input[type=file]').setInputFiles({name:'good.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});await p.getByText(/復元プレビュー/).waitFor();assert(!(await p.getByRole('button',{name:'確認して復元',exact:true}).isEnabled()));await p.getByLabel('今の保存・履歴をこの内容で置き換える').check();await p.getByRole('button',{name:'確認して復元',exact:true}).click();await p.getByText(/復元しました/).waitFor();assert(await p.evaluate(()=>localStorage.getItem('ikukamo.personal.v2.beforeRestore')));done.push('backup export invalid rejection preview and restore');
await p.reload();await p.getByRole('navigation').getByRole('button',{name:'保存',exact:true}).click();await p.getByRole('button',{name:'自分で拾った予定',exact:true}).click();await p.getByText('編集した検証予定',{exact:true}).waitFor();assert.deepEqual(errors,[]);await c.close();done.push('reload and no hydration or runtime errors');
for(const mode of ['deny','timeout','unsupported','invalid','429','offline']){const {c,p,errors}=await context(mode);if(['429','offline'].includes(mode)){await p.getByRole('button',{name:'会場の天気を取得',exact:true}).click();await p.getByText(/予報が不明の会場/).waitFor();assert((await p.locator('[data-testid=venue-weather]').allTextContents()).some(t=>t.includes('予報不明')));}else{await p.getByRole('button',{name:'現在地を使う',exact:true}).click();await p.getByText(/許可されません|時間切れ|現在地を使えません|位置情報が不正/).waitFor();await p.getByLabel('出発地域').selectOption('浜松市');await p.getByText('浜松市',{exact:true}).first().waitFor();}assert.deepEqual(errors,[]);await c.close();done.push(mode);}
for(const mode of ['corrupt','quota','bad-cache']){
 const {c,p,errors}=await context(mode);
 if(mode==='bad-cache'){
  await p.getByRole('button',{name:'会場の天気を取得',exact:true}).click();await p.getByText(/会場ごとの予報を取得しました/).waitFor();
  await p.getByLabel('訪問日時',{exact:true}).fill('2026-10-25T12:00');
  await p.waitForFunction(()=>Array.from(document.querySelectorAll('[data-testid=venue-weather]')).every(e=>/予報不明|会期外/.test(e.textContent)));
  assert((await p.locator('[data-testid=venue-weather]').allTextContents()).some(t=>t.includes('予報不明')));
 }else{
  await p.locator('article').first().getByRole('button',{name:'行きたい',exact:true}).click();
  await p.getByText(mode==='corrupt'?/書き込みを止めています/:/容量・ブラウザー設定/).waitFor();
  assert.equal(await p.evaluate(()=>localStorage.getItem('ikukamo.personal.v2')),mode==='corrupt'?'{broken-personal-data':null);
 }
 assert.deepEqual(errors,[]);await c.close();done.push(mode);
}
const pc=await browser.newContext({viewport:{width:390,height:844}}), pp=await pc.newPage();pc.setDefaultTimeout(30000);
await pc.route('**/*',r=>new URL(r.request().url()).origin===new URL(app).origin?r.continue():r.abort());
await pp.clock.install({time:now});
await pp.goto(app+'__pwa_seed__');
await pp.evaluate(async()=>{await caches.open('another-app-cache');await caches.open('ikukamo-v4');});
await pp.goto(app,{waitUntil:'networkidle'});await pp.waitForFunction(()=>!!navigator.serviceWorker.controller);
assert.deepEqual(await pp.evaluate(async()=>({foreign:await caches.has('another-app-cache'),old:await caches.has('ikukamo-v4')})),{foreign:true,old:false});
await pp.reload({waitUntil:'networkidle'});await pp.getByLabel('訪問日時',{exact:true}).waitFor();
const cacheUrls=await pp.evaluate(async()=>(await (await caches.open('ikukamo-v5')).keys()).map(r=>r.url));
assert(cacheUrls.length>5);assert(cacheUrls.every(u=>u.startsWith(app)));
await pc.setOffline(true);await pp.reload({waitUntil:'domcontentloaded'});await pp.getByLabel('訪問日時',{exact:true}).waitFor();await pp.locator('article').first().waitFor();await pc.close();done.push('PWA offline home + own-cache cleanup + foreign-cache preservation');
fs.writeFileSync(path.join(evidence,'result.json'),JSON.stringify({app,passed:done},null,2));console.log(JSON.stringify({passed:done},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
