import {CHARACTERS} from '../content/memories.mjs';
import {seatView,sendMessage,lockMove} from '../game/engine.mjs';
import {thinkBot,planBot} from '../ai/bots.mjs';
import {listen} from '../ai/listener.mjs';
import {moderate} from '../ai/moderation.mjs';
import {startRoom,roomView,ready,beginPlanning,applyPlans,tickRoom} from './room.mjs';
const response=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function hash(token){const data=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return [...new Uint8Array(data)].map(b=>b.toString(16).padStart(2,'0')).join('');}
export async function handleRequest(req,env,{now=Date.now,bot=thinkBot,listener=listen,moderator=moderate}={}){
 const db=env.DB,live=!!env.OPENAI_API_KEY,model=env.OPENAI_MODEL||'gpt-4.1-mini';
 const load=code=>db.prepare('SELECT state,revision,expires FROM rooms WHERE code=?').bind(code).first();
 const save=(code,row,room)=>db.prepare('UPDATE rooms SET state=?,revision=? WHERE code=? AND revision=?').bind(JSON.stringify(room),row.revision+1,code,row.revision).run();
 try{
 if(!db)return response({error:'Storage is not ready'},503);
 const url=new URL(req.url);if(req.headers.get('origin')&&req.headers.get('origin')!==url.origin)return response({error:'Origin denied'},403);
 let body={};if(req.method==='POST'){const raw=await req.text();if(raw.length>2048)return response({error:'Request too large'},413);body=JSON.parse(raw||'{}');if(!body||Array.isArray(body)||typeof body!=='object')return response({error:'Invalid request'},400);}
 const match=url.pathname.match(/^\/api\/rooms(?:\/([A-F0-9]{6})(?:\/(join|start|message|lock|think))?)?\/?$/);if(!match)return response({error:'Not found'},404);
 const code=match[1],action=match[2],time=now();
 if(!code&&req.method==='POST'){
 if(!CHARACTERS.includes(body.name))throw Error('Choose a character');
 await db.prepare('DELETE FROM rooms WHERE expires<?').bind(time).run();
 const count=await db.prepare('SELECT COUNT(*) AS total FROM rooms').first();if(count.total>=100)return response({error:'Playtest room limit reached'},429);
 for(let attempt=0;attempt<5;attempt++){
 const code=[...crypto.getRandomValues(new Uint8Array(3))].map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase(),token=crypto.randomUUID();
 const seat={id:crypto.randomUUID(),name:body.name,tokenHash:await hash(token),lastAction:0};
 const room={code,host:seat.id,seats:[seat],game:null,job:null,decision:null};
 const inserted=await db.prepare('INSERT OR IGNORE INTO rooms(code,state,revision,expires) VALUES(?,?,?,?)').bind(code,JSON.stringify(room),0,time+7200000).run();if(inserted.meta.changes)return response({token,...roomView(room,seat,time,live)},201);
 }return response({error:'Try creating a room again'},409);
 }
 if(!code)return response({error:'Not found'},404);
 const token=req.headers.get('authorization')?.replace(/^Bearer /,'')??'',tokenHash=await hash(token);
 // Read-before-moderation prevents unauthenticated callers from spending API quota.
 if(action==='message'&&req.method==='POST'){
 const row=await load(code);if(!row||row.expires<time)return response({error:'Room expired'},404);const room=JSON.parse(row.state),seat=room.seats.find(s=>s.tokenHash===tokenHash);if(!seat)return response({error:'Invalid seat token'},401);
 if(!room.game||body.turn!==room.game.turn)throw Error('That turn has ended');
 sendMessage(structuredClone(room.game),seat.id,body.text,time);
 const check=await moderator([body.text],{apiKey:env.OPENAI_API_KEY});if(!check.allowed)return response({error:check.mode==='unavailable'?'Radio check unavailable. Please try again.':'Please rephrase that transmission.'},400);
 }
 for(let attempt=0;attempt<6;attempt++){
 const row=await load(code);if(!row||row.expires<now())return response({error:'Room expired. Create a new room.'},404);
 const room=JSON.parse(row.state);let seat=room.seats.find(s=>s.tokenHash===tokenHash),issued;
 if(action!=='join'&&!seat)return response({error:'Invalid seat token'},401);
 let changed=tickRoom(room,now());
 if(req.method==='GET'){
 if(action)return response({error:'Method not allowed'},405);
 if(changed){const result=await save(code,row,room);if(!result.meta.changes)continue;}
 return response(roomView(room,seat,now(),live));
 }
 if(req.method!=='POST')return response({error:'Method not allowed'},405);
 if(action==='think'){
 const g=room.game;
 if(ready(g,now())){beginPlanning(room,now());changed=true;}
 const phase=g?.phase;
 if(!['planning','listening'].includes(phase)||room.job||phase==='listening'&&room.decision){
 if(changed){const result=await save(code,row,room);if(!result.meta.changes)continue;}return response({ok:true});}
 const marker=crypto.randomUUID();room.job={marker,phase,turn:g.turn};
 const lock=await save(code,row,room);if(!lock.meta.changes)continue;
 // No external inference before the DB lease succeeds. Other polls can still render.
 let reports,decision;
 if(phase==='planning'){
 reports=await Promise.all(g.players.filter(p=>p.bot).map(async p=>({id:p.id,...await bot(seatView(g,p.id),{apiKey:env.OPENAI_API_KEY,model})})));
 const generated=reports.flatMap(r=>r.plan.messages);if(generated.length&&live){const check=await moderator(generated,{apiKey:env.OPENAI_API_KEY});if(!check.allowed)reports=reports.map(r=>({...r,plan:{...r.plan,messages:planBot(seatView(g,r.id)).messages}}));}
 for(const report of reports)console.info(JSON.stringify({event:'overheard_bot',turn:g.turn,model,source:report.source,latencyMs:report.latencyMs,usage:report.usage,reason:report.reason}));
 }else{
 const report=await listener(g,{apiKey:env.OPENAI_API_KEY,model,offline:!live});decision=report.decision;
 if(live){const check=await moderator([decision.taunt],{apiKey:env.OPENAI_API_KEY});if(!check.allowed)decision={...decision,taunt:'Keep talking. I have time.'};}
 console.info(JSON.stringify({event:'overheard_listener',turn:g.turn,model,source:report.source,latencyMs:report.latencyMs,usage:report.usage??null}));
 }
 for(let retry=0;retry<6;retry++){
 const fresh=await load(code);if(!fresh)return response({ok:true});const current=JSON.parse(fresh.state);
 if(current.job?.marker!==marker||current.game?.phase!==phase||current.game.turn!==g.turn||now()>=current.game.deadline)return response({ok:true,discarded:'stale'});
 if(phase==='planning')applyPlans(current,reports,now());else{current.decision=decision;/* Keep marker to prevent a second inference. */}
 const applied=await save(code,fresh,current);if(applied.meta.changes)return response({ok:true});
 }return response({ok:true,discarded:'contention'});
 }
 if(action==='join'){
 if(room.game)throw Error('Match already started');if(room.seats.length>=5)throw Error('Room full');if(!CHARACTERS.includes(body.name)||room.seats.some(s=>s.name===body.name))throw Error('Choose an unused character');
 issued=crypto.randomUUID();seat={id:crypto.randomUUID(),name:body.name,tokenHash:await hash(issued),lastAction:now()};room.seats.push(seat);
 }else{
 if(now()-seat.lastAction<120)return response({error:'One moment—try again'},429);seat.lastAction=now();
 if(action==='start'){if(room.host!==seat.id)throw Error('Only the host can start');startRoom(room,body.count,now());}
 else if(['message','lock'].includes(action)){if(!room.game||body.turn!==room.game.turn)throw Error('That turn has ended');if(action==='message')sendMessage(room.game,seat.id,body.text,now());else lockMove(room.game,seat.id,body.move,now());}
 else return response({error:'Not found'},404);
 }
 const result=await save(code,row,room);if(result.meta.changes)return response({...roomView(room,seat,now(),live),...(issued?{token:issued}:{})});
 }
 return response({error:'The room is busy. Try again.'},409);
 }catch(e){return response({error:e instanceof Error?e.message:'Request failed'},400);}
}
