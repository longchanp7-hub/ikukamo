import fs from 'node:fs';
import { fetchOfficial, extractEvents } from './official-collector.mjs';
const config=JSON.parse(fs.readFileSync('config/official-sources.json','utf8'));
if(config.version!==1||!Array.isArray(config.sources)||config.sources.length>12||config.attempts<1||config.attempts>3||config.timeoutMs<1000||config.timeoutMs>15000)throw Error('Collector settings outside bounded limits');
const file='src/data/collected-events.json', previous=JSON.parse(fs.readFileSync(file,'utf8'));
const stamp=new Date().toISOString(), sources=[],events=[],report={checkedAt:stamp,results:[],changed:false};
for(const source of config.sources){
 try{
  if(!['watch','jsonld'].includes(source.mode))throw Error('Unknown collector mode');
  const page=await fetchOfficial(source,config),old=previous.sources.find(s=>s.id===source.id);
  const rows=source.mode==='jsonld'?extractEvents(page.html,source,stamp):[];
  if(source.mode==='jsonld'&&!rows.length)throw Error('No structured events; manual review required');
  sources.push(old?.hash===page.hash?old:{id:source.id,name:source.name,url:source.url,title:page.title,hash:page.hash,contentObservedAt:stamp,mode:source.mode});
  for(const event of rows){const oldEvent=previous.events.find(e=>e.id===event.id);events.push(old?.hash===page.hash&&oldEvent?oldEvent:event);}
  report.results.push({id:source.id,status:old&&old.hash!==page.hash&&source.mode==='watch'?'changed_review_required':'ok',structuredEvents:rows.length});
 }catch(e){report.results.push({id:source.id,status:'failed',error:e.message});}
}
fs.mkdirSync('tmp',{recursive:true});
if(!report.results.some(r=>r.status==='failed')){
 const next={version:1,events,sources};report.changed=JSON.stringify(previous)!==JSON.stringify(next);
 if(report.changed)fs.writeFileSync(file,JSON.stringify(next,null,2)+'\n');
}else process.exitCode=1;
fs.writeFileSync('tmp/ingest-report.json',JSON.stringify(report,null,2));
const summary='## Official collection (no AI)\n'+stamp+'\n'+report.results.map(r=>'- '+r.id+': '+r.status+(r.error?' — '+r.error:'')).join('\n')+'\n'+(process.exitCode?'Published snapshot preserved.':'Only validated changes are written.');
console.log(summary);if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary+'\n');
