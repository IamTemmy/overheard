import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../src/server/server.mjs';
test('HTTP rooms isolate seats, reject stale actions, and resolve once',async t=>{
 let time=100;const {server,tick}=createApp({now:()=>time});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
 const base=`http://127.0.0.1:${server.address().port}`;
 async function request(path,body,token){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};}
 const a=(await request('/api/rooms',{name:'Ines'})).data;
 const b=(await request(`/api/rooms/${a.code}/join`,{name:'Dutch'})).data;
 assert.equal((await request(`/api/rooms/${a.code}`,null,'wrong')).status,400);
 assert.equal((await request(`/api/rooms/${a.code}/start`,{count:2},b.token)).status,400);
 const start=await request(`/api/rooms/${a.code}/start`,{count:2},a.token);assert.equal(start.status,200);assert.equal(start.data.game.crew[1].position,null);
 assert.equal((await request(`/api/rooms/${a.code}/join`,{name:'Vale'})).status,400);
 await request(`/api/rooms/${a.code}/lock`,{turn:1,move:'STAY'},a.token);
 await request(`/api/rooms/${a.code}/lock`,{turn:1,move:'STAY'},b.token);
 assert.equal((await request(`/api/rooms/${a.code}`,null,a.token)).data.game.phase,'listening');
 time+=6001;await tick();await tick();
 const next=(await request(`/api/rooms/${a.code}`,null,a.token)).data;assert.equal(next.game.turn,2);
 assert.equal((await request(`/api/rooms/${a.code}/message`,{turn:1,text:'late'},a.token)).status,400);
 assert.equal((await request(`/api/rooms/${a.code}`,null,a.token)).data.game.self.name,'Ines');
});
