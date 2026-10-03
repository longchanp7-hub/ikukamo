import fs from 'node:fs';
import { collect } from './collection-runner.mjs';
import { crawlSocial } from './social-public.mjs';
import { validateSnapshot } from './validate-collection.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const config=read('config/discovery-sources.json'),regions=read('config/regions.json');
const file='src/data/collected-events.json',previous=read(file),stamp=new Date().toISOString();
const requested=process.argv.find(a=>a.startsWith('--source='))?.slice(9);
if(requested&&!config.sources.some(s=>s.id===requested))throw Error('Unknown source id');
const selected=requested?{...config,sources:config.sources.filter(s=>s.id===requested)}:config;
const result=await collect(selected,regions,previous,stamp,undefined,process.argv.includes('--force'));
if(requested){result.snapshot.events=[...previous.events.filter(e=>e.collectorSource!==requested),...result.snapshot.events];result.snapshot.reviews=[...(previous.reviews||[]).filter(r=>r.sourceId!==requested),...result.snapshot.reviews];result.snapshot.sources=config.sources.map(s=>result.snapshot.sources.find(r=>r.id===s.id)||previous.sources.find(r=>r.id===s.id)).filter(Boolean);}
result.snapshot.social.crawl=await crawlSocial(result.snapshot.events,previous.social?.crawl,stamp);
validateSnapshot(result.snapshot,regions);
result.snapshot.social.crawl.embeddedPosts=result.snapshot.events.flatMap(e=>e.embeddedSocial||[]);
result.changed=JSON.stringify(previous)!==JSON.stringify(result.snapshot);
fs.mkdirSync('tmp',{recursive:true});
if(result.changed&&!result.allFailed){
 // Per-source retention is validated. If all selected sources fail, preserve the file.
 const temp=file+'.tmp';fs.writeFileSync(temp,JSON.stringify(result.snapshot,null,2)+'\n');fs.renameSync(temp,file);
}
fs.writeFileSync('tmp/ingest-report.json',JSON.stringify({...result,snapshot:undefined,checkedAt:stamp,sources:result.snapshot.sources,reviews:result.snapshot.reviews},null,2));
const summary='## Official event discovery (no AI)\n'+stamp+'\n'+result.snapshot.sources.map(s=>'- '+s.name+': '+s.status+' / discovered '+s.discovered+' / accepted '+s.accepted+' / retained '+s.retained+' / skipped '+s.skipped+' / errors '+s.errors).join('\n')+'\nReview queue: '+result.snapshot.reviews.length+'; HTTP requests: '+result.requests+'\nX: paid API disabled. Instagram: account integration disabled by user; unauthenticated public HTML status recorded.\n';
console.log(summary);if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary);
if(result.allFailed)process.exitCode=1;
