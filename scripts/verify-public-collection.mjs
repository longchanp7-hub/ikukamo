import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {validateSnapshot} from './validate-collection.mjs';
const local=JSON.parse(fs.readFileSync('src/data/collected-events.json')),regions=JSON.parse(fs.readFileSync('config/regions.json'));
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
let last;
for(let attempt=0;attempt<6;attempt++){
 try{
  const base='https://longchanp7-hub.github.io/ikukamo/',res=await fetch(base+'data/collection.json?verify='+digest(local).slice(0,12),{cache:'no-store',signal:AbortSignal.timeout(12000)});
  assert(res.ok,'Published collection HTTP '+res.status);const data=await res.json();validateSnapshot(data,regions);assert.equal(digest(data),digest(local),'Published snapshot differs from deployed commit');
  const sample=data.events.find(e=>!e.collectionExpired&&Date.parse(e.endAt)>Date.now())||data.events[0];assert(sample,'No events in public snapshot');
  const detail=await fetch(base+'event/'+sample.id+'/',{signal:AbortSignal.timeout(12000)});assert(detail.ok,'Public detail page missing');assert((await detail.text()).includes(sample.id),'Detail page does not match event');
  console.log('Published collection matches commit: '+data.events.length+' records; detail '+sample.id+' loaded.');process.exit(0);
 }catch(e){last=e;if(attempt<5)await new Promise(r=>setTimeout(r,10000));}
}
throw last;
