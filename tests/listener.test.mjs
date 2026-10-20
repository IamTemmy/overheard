import test from 'node:test';
import assert from 'node:assert/strict';
import {MAP,NODES,nextStep} from '../src/game/map.mjs';
import {publicView,validate,fallback,listen,requestBody} from '../src/ai/listener.mjs';
const state={turn:4,creaturePosition:'Church',transcript:[1,2,3,4].map(turn=>({turn,speaker:'Dutch',text:'Meet at the Diner.'})),publicEvents:[],notebook:[],memoryCard:'TOP_SECRET',players:[{position:'Docks'}],partLocations:['Mall']};
const valid=()=>({heard:[{quote:'Diner',speaker:'Dutch',guess_node:'Diner',confidence:.9}],target:{node:'Diner',reason:'Radio clue'},notebook_proposals:[{phrase:'Diner',node:'Diner'}],taunt:'I heard that.'});
test('public projection excludes secrets and selects difficulty history',()=>{
 const v=publicView(state);assert.equal(v.transcript.length,3);assert.equal(publicView({...state,difficulty:'EASY'}).transcript.length,1);assert.equal(publicView({...state,difficulty:'HARD'}).transcript.length,4);
 const body=JSON.stringify(requestBody(v,'test'));for(const secret of ['TOP_SECRET','partLocations','players','memoryCard'])assert.ok(!body.includes(secret));
});
test('every route is a legal edge and map is symmetric',()=>{for(const a of NODES){for(const b of MAP[a])assert.ok(MAP[b].includes(a));for(const b of NODES)assert.ok(a===b?nextStep(a,b)===a:MAP[a].includes(nextStep(a,b)));}});
test('accept grounded output',()=>assert.deepEqual(validate(valid(),publicView(state)),valid()));
for(const [name,mutate] of Object.entries({unknownNode:x=>x.target.node='Atlantis',fabricatedQuote:x=>x.heard[0].quote='secret',wrongSpeaker:x=>x.heard[0].speaker='Ines',badConfidence:x=>x.heard[0].confidence=2,extraField:x=>x.secret=true,unsupportedProposal:x=>x.notebook_proposals[0].phrase='coffee',longTaunt:x=>x.taunt='word '.repeat(15)}))test(`reject ${name}`,()=>{const x=valid();mutate(x);assert.throws(()=>validate(x,publicView(state)));});
test('fallback prefers latest noise then explicit place then tower',()=>{
 assert.equal(fallback(publicView({...state,publicEvents:[{type:'CLANG',node:'Mall'}]})).target.node,'Mall');assert.equal(fallback(publicView(state)).target.node,'Diner');assert.equal(fallback(publicView({...state,transcript:[]})).target.node,'Radio Tower');
});
const opts={apiKey:'test-only',model:'test-only'};
test('valid API response is validated',async()=>{const r=await listen(state,{...opts,fetchImpl:async()=>({ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(valid())}]}]})})});assert.equal(r.source,'model');});
test('HTTP failures and malformed outputs fall back',async()=>{for(const fetchImpl of [async()=>({ok:false,status:429}),async()=>({ok:true,json:async()=>({status:'completed',output:[]})})])assert.equal((await listen(state,{...opts,fetchImpl})).source,'fallback');});
test('timeout aborts and falls back',async()=>{const r=await listen(state,{...opts,timeoutMs:10,fetchImpl:async(_url,{signal})=>new Promise((resolve,reject)=>{const timer=setTimeout(resolve,100);signal.addEventListener('abort',()=>{clearTimeout(timer);reject(signal.reason);});})});assert.equal(r.source,'fallback');assert.equal(r.failure,'timeout');});
test('missing credentials never masquerade as live results',async()=>assert.rejects(listen(state,{apiKey:'',model:''}),/Set OPENAI/));
