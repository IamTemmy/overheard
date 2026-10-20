import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fixtures} from '../fixtures/listener.mjs';
import {listen,PROMPT} from '../src/ai/listener.mjs';
const offline=process.argv.includes('--offline');
const repeatArg=process.argv.find(a=>a.startsWith('--repeats='));
const repeats=Number(repeatArg?.split('=')[1]??1);
if(!Number.isInteger(repeats)||repeats<1||repeats>20)throw Error('repeats must be 1–20');
const rows=[];
for(let repeat=0;repeat<repeats;repeat++)for(const f of fixtures){
 const r=await listen(f.state,{offline});
 const top=[...r.decision.heard].sort((a,b)=>b.confidence-a.confidence)[0];
 rows.push({id:f.id,category:f.category,repeat,expected:f.expected,...r,decoded:r.source==='model'?top?.guess_node===f.expected:null,targetCorrect:r.decision.target.node===f.expected});
 console.log(`${f.id}: ${r.source}, ${r.latencyMs}ms`);
}
const groups=Object.fromEntries([...new Set(rows.map(r=>r.category))].map(category=>{
 const all=rows.filter(r=>r.category===category),live=all.filter(r=>r.source==='model');
 return [category,{attempts:all.length,modelResponses:live.length,correct:live.filter(r=>r.decoded).length,decodeAccuracy:live.length?live.filter(r=>r.decoded).length/live.length:null,fallbacks:all.filter(r=>r.source==='fallback').length}];
}));
const times=rows.map(r=>r.latencyMs).sort((a,b)=>a-b);
const report={generatedAt:new Date().toISOString(),mode:offline?'offline-plumbing-only':'live',model:offline?null:process.env.OPENAI_MODEL,promptHash:createHash('sha256').update(PROMPT).digest('hex'),repeats,groups,fallbackRate:offline?null:rows.filter(r=>r.source==='fallback').length/rows.length,p95LatencyMs:times[Math.ceil(times.length*.95)-1],note:'Accuracy uses highest-confidence grounded heard quote, not pursuit target. Private answers never enter API input. Bluff/injection categories are diagnostic, not accuracy gates. Small samples do not establish balance.',rows};
await mkdir('reports',{recursive:true});
const path=`reports/m0-${offline?'offline':'live'}-${Date.now()}.json`;
await writeFile(path,JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,rows:undefined},null,2));console.log(`Report: ${path}`);
if(!offline&&report.fallbackRate>0)process.exitCode=2;
