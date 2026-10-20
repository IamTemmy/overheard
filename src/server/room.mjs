import {createGame,seatView,sendMessage,lockMove,startListening,resolveTurn} from '../game/engine.mjs';
import {CHARACTERS} from '../content/memories.mjs';
import {planBot} from '../ai/bots.mjs';
import {publicView,fallback} from '../ai/listener.mjs';
export function seedBots(g){for(const p of g.players.filter(p=>p.bot&&!p.static)){const plan=planBot(seatView(g,p.id));sendMessage(g,p.id,plan.messages[0],g.phaseStartedAt);}}
export function roomView(room,seat,now,live){return {code:room.code,host:seat.id===room.host,mode:live?'AI radio · gpt-4.1-mini default':'Playtest · scripted fallback (API not configured)',roster:room.seats.map(({id,name})=>({id,name})),game:room.game?seatView(room.game,seat.id):null,serverNow:now};}
export function startRoom(room,count,now){if(room.game)throw Error('Already started');if(!Number.isInteger(count)||count<Math.max(2,room.seats.length)||count>5)throw Error('Choose 2–5 survivors');const roster=room.seats.map(({id,name})=>({id,name,bot:false}));for(const name of CHARACTERS.filter(n=>!roster.some(s=>s.name===n)).slice(0,count-roster.length))roster.push({id:`bot-${name}`,name,bot:true});room.game=createGame(roster,{now});seedBots(room.game);}
export function ready(g,now){return g?.phase==='radio'&&(now>=g.deadline||g.players.filter(p=>!p.bot).every(p=>p.locked));}
export function beginPlanning(room,now){const g=room.game;if(!ready(g,now))return false;g.phase='planning';g.phaseStartedAt=now;g.deadline=now+5000;for(const p of g.players.filter(p=>!p.bot&&!p.locked)){p.move=p.position;p.locked=true;}room.job=null;return true;}
export function applyPlans(room,reports,now){const g=room.game;if(g.phase!=='planning')return false;
 g.phase='radio';g.deadline=now+1;
 for(const p of g.players.filter(p=>p.bot)){
 const plan=reports.find(r=>r.id===p.id)?.plan??planBot(seatView(g,p.id));p.intent=plan.intent;
 // Per-seat limits still apply to generated text. Static receives no opening message.
 for(const text of plan.messages){try{sendMessage(g,p.id,text,now);}catch{}}
 try{lockMove(g,p.id,plan.move,now);}catch{lockMove(g,p.id,'STAY',now);}
 }
 startListening(g,now);room.job=null;room.decision=null;return true;
}
export function tickRoom(room,now){const g=room.game;if(!g)return false;
 if(g.phase==='planning'&&now>=g.deadline){applyPlans(room,[],now);return true;}
 if(g.phase==='listening'&&now>=g.deadline){resolveTurn(g,room.decision??fallback(publicView(g)),now);room.job=null;room.decision=null;if(g.phase==='radio')seedBots(g);return true;}
 return false;
}
