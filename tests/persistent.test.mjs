import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {handleRequest} from '../src/server/persistent.mjs';
import {planBot} from '../src/ai/bots.mjs';
function setup(extra={}){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec('CREATE TABLE rooms(code TEXT PRIMARY KEY,state TEXT NOT NULL,revision INTEGER NOT NULL,expires INTEGER NOT NULL)');
 const DB={prepare(sql){let values=[];return {bind(...args){values=args;return this;},async first(){return sqlite.prepare(sql).get(...values)??null;},async run(){const r=sqlite.prepare(sql).run(...values);return {meta:{changes:Number(r.changes)}};}};}};
 let time=10000;
 const options={now:()=>time,...extra};
 async function req(path,body,token){const r=await handleRequest(new Request('https://test.invalid/api/rooms'+path,{method:body?'POST':'GET',headers:{...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})}),{DB},options);return {status:r.status,data:await r.json()};}
 return {req,sqlite,advance:(ms=200)=>{time+=ms;},options};
}
test('persistent two-seat room survives request instances and resolves exactly once',async t=>{const h=setup();t.after(()=>h.sqlite.close());const a=(await h.req('',{name:'Ines'})).data,b=(await h.req(`/${a.code}/join`,{name:'Dutch'})).data;h.advance();assert.equal((await h.req(`/${a.code}/start`,{count:2},a.token)).status,200);h.advance();await h.req(`/${a.code}/lock`,{turn:1,move:'STAY'},a.token);await h.req(`/${a.code}/lock`,{turn:1,move:'STAY'},b.token);
 await Promise.all([h.req(`/${a.code}/think`,{},a.token),h.req(`/${a.code}/think`,{},b.token)]);await h.req(`/${a.code}/think`,{},a.token);h.advance(6001);await Promise.all([h.req(`/${a.code}`,null,a.token),h.req(`/${a.code}`,null,b.token)]);
 const room=(await h.req(`/${a.code}`,null,a.token)).data;assert.equal(room.game.turn,2);assert.equal(room.game.phase,'radio');assert.equal(room.game.tape,undefined);assert.equal((await h.req(`/${a.code}/join`,{name:'Vale'})).status,400);
 const stored=JSON.parse(h.sqlite.prepare('SELECT state FROM rooms WHERE code=?').get(a.code).state);assert.ok(!JSON.stringify(stored).includes(a.token));assert.equal(stored.game.tape.length,1);
});
test('concurrent inference takes one lease and stale bot response cannot overwrite fallback',async t=>{let release;let calls=0;const pending=new Promise(r=>release=r);const h=setup({bot:async view=>{calls++;await pending;return {plan:planBot(view),source:'mock'};}});t.after(()=>h.sqlite.close());const a=(await h.req('',{name:'Ines'})).data;h.advance();await h.req(`/${a.code}/start`,{count:2},a.token);h.advance();await h.req(`/${a.code}/lock`,{turn:1,move:'STAY'},a.token);
 const work=h.req(`/${a.code}/think`,{},a.token);await new Promise(r=>setTimeout(r,20));await h.req(`/${a.code}/think`,{},a.token);assert.equal(calls,1);h.advance(5001);const v=(await h.req(`/${a.code}`,null,a.token)).data;assert.equal(v.game.phase,'listening');release();await work;assert.equal((await h.req(`/${a.code}`,null,a.token)).data.game.phase,'listening');
});
test('unauthenticated chat never invokes moderation',async t=>{let count=0;const h=setup({moderator:async()=>{count++;return {allowed:true};}});t.after(()=>h.sqlite.close());const a=(await h.req('',{name:'Ines'})).data;assert.equal((await h.req(`/${a.code}/message`,{turn:1,text:'hi'},'wrong')).status,401);assert.equal(count,0);});
