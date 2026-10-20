import {MAP,NODES,nextStep} from './map.mjs';
import {STORIES} from '../content/memories.mjs';
export const TURN_MS=30000,LISTEN_MS=6000;
export function shuffled(values,rng=Math.random){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function distance(a,b){let n=0;while(a!==b){a=nextStep(a,b);n++;}return n;}
export function createGame(roster,{rng=Math.random,now=Date.now()}={}){
 if(roster.length<2||roster.length>5||new Set(roster.map(p=>p.id)).size!==roster.length)throw Error('Need 2–5 unique seats');
 const spawns=shuffled(['Mall','Bridge','Ferris Wheel','Diner','Hospital'],rng);
 const players=roster.map((p,i)=>({id:p.id,name:p.name,bot:!!p.bot,position:spawns[i],static:false,known:[],move:null,locked:false,intent:''}));
 const eligible=NODES.filter(n=>players.every(p=>distance(n,p.position)>=2));
 const creaturePosition=shuffled(eligible,rng)[0];if(!creaturePosition)throw Error('No safe spawn');
 const partNodes=shuffled(NODES.filter(n=>n!=='Radio Tower'&&!spawns.slice(0,players.length).includes(n)),rng);
 const parts=['FUSE','ANTENNA','BATTERY'].map((id,i)=>({id,node:partNodes[i],carrier:null,delivered:false}));
 for(let i=0;i<Math.max(3,players.length);i++){const part=parts[i<3?i:1+(i-3)%2];players[i%players.length].known.push({part:part.id,node:part.node});}
 const memoryNodes=shuffled([...new Set([...partNodes.slice(0,3),'Radio Tower',...shuffled(NODES,rng)])],rng).slice(0,6);
 // Guarantee all three objectives have a usable private code, plus tower and two others.
 memoryNodes.splice(0,6,...[...new Set([...partNodes.slice(0,3),'Radio Tower',...memoryNodes,...NODES])].slice(0,6));
 const stories=shuffled(STORIES,rng);
 return {phase:'radio',turn:1,deadline:now+TURN_MS,phaseStartedAt:now,difficulty:'NORMAL',players,parts,creaturePosition,
 memories:memoryNodes.map((node,i)=>({node,phrase:stories[i][0],story:stories[i][1]})),transcript:[],publicEvents:[],notebook:[],tape:[],lastReveal:null,outcome:null};
}
function player(g,id){const p=g.players.find(p=>p.id===id);if(!p)throw Error('Unknown seat');return p;}
function active(g,now){if(g.phase!=='radio'||now>=g.deadline)throw Error('Radio is closed');}
export function sendMessage(g,id,text,now=Date.now()){
 active(g,now);const p=player(g,id);if(p.locked)throw Error('Already locked');
 if(typeof text!=='string'||!text.trim()||text.length>80||/[\x00-\x1f]/.test(text))throw Error('Use 1–80 characters');
 const count=g.transcript.filter(m=>m.turn===g.turn&&m.seat===id).length;
 if(count>=(p.static?1:2))throw Error('Radio limit reached');
 g.transcript.push({turn:g.turn,seat:id,speaker:p.name,text:text.trim()});
}
export function lockMove(g,id,move,now=Date.now()){
 active(g,now);const p=player(g,id);if(p.locked)throw Error('Already locked');
 const dest=move==='STAY'?p.position:move;
 if(p.static&&dest!==p.position)throw Error('Static players cannot move');
 if(dest!==p.position&&!MAP[p.position].includes(dest))throw Error('Move along one connection');
 p.move=dest;p.locked=true;
}
export function seatView(g,id){
 const p=player(g,id),d=distance(p.position,g.creaturePosition);
 return {phase:g.phase,turn:g.turn,deadline:g.deadline,phaseStartedAt:g.phaseStartedAt,map:MAP,
 self:{id:p.id,name:p.name,position:p.position,static:p.static,known:p.known,locked:p.locked,move:p.move,carrying:g.parts.filter(x=>x.carrier===id).map(x=>x.id)},
 crew:g.players.map(q=>({id:q.id,name:q.name,bot:q.bot,static:q.static,locked:q.locked,position:q.id===id||(!p.static&&!q.static&&q.position===p.position)?q.position:null})),
 parts:g.parts.map(x=>({id:x.id,status:x.delivered?'delivered':x.carrier?'carried':'missing'})),
 memories:g.memories,notebook:g.notebook,transcript:g.transcript.map(({turn,speaker,text})=>({turn,speaker,text})),publicEvents:g.publicEvents,
 creature:p.static||d<=2?g.creaturePosition:null,cue:p.static?'You see it through the static.':d===1?'It is close.':d===2?'Something moves nearby.':'Only silence.',
 lastReveal:g.lastReveal,outcome:g.outcome,tape:g.phase==='ended'?g.tape:undefined};
}
export function startListening(g,now=Date.now()){
 if(g.phase!=='radio')return false;
 for(const p of g.players)if(!p.locked){p.move=p.position;p.locked=true;}
 g.phase='listening';g.phaseStartedAt=now;g.deadline=now+LISTEN_MS;return true;
}
export function resolveTurn(g,decision,now=Date.now()){
 if(g.phase!=='listening')throw Error('Turn already resolved or not listening');
 if(!NODES.includes(decision.target?.node))throw Error('Invalid Listener target');
 const oldCreature=g.creaturePosition,oldPositions=Object.fromEntries(g.players.map(p=>[p.id,p.position]));
 for(const p of g.players)if(!p.static){if(p.move!==p.position&&!MAP[p.position].includes(p.move))throw Error('Invalid stored move');p.position=p.move;}
 const confidence=Math.max(0,...decision.heard.map(h=>h.confidence));
 const steps=g.turn>=10&&confidence>=.8?2:1;
 const creaturePath=[oldCreature];for(let i=0;i<steps;i++)creaturePath.push(nextStep(creaturePath.at(-1),decision.target.node));
 g.creaturePosition=creaturePath.at(-1);
 const events=[];
 for(const p of g.players){
 if(p.static)continue;
 // Survivors move simultaneously; check edge-swap on the first step and every traversed destination.
 const swap=oldPositions[p.id]===creaturePath[1]&&p.position===oldCreature;
 if(creaturePath.slice(1).includes(p.position)||swap){p.static=true;events.push({turn:g.turn,type:'CAPTURE',node:p.position,speaker:p.name});for(const part of g.parts)if(part.carrier===p.id){part.carrier=null;part.node=p.position;}}
 }
 // Stable seat order assigns a pickup when survivors land together. Captures precede delivery.
 for(const p of g.players.filter(p=>!p.static))for(const part of g.parts){
 if(!part.delivered&&!part.carrier&&part.node===p.position){part.carrier=p.id;part.node=null;events.push({turn:g.turn,type:'CLANG',node:p.position});}
 if(part.carrier===p.id&&p.position==='Radio Tower'){part.carrier=null;part.delivered=true;events.push({turn:g.turn,type:'DELIVERED',node:'Radio Tower',part:part.id});}
 }
 // Confirm only against public capture evidence for that speaker; secret positions never certify a guess.
 const learned=[];
 for(const proposal of decision.notebook_proposals){const evidence=decision.heard.find(h=>h.quote===proposal.phrase&&h.guess_node===proposal.node);
 if(evidence&&g.transcript.some(m=>m.turn===g.turn&&m.speaker===evidence.speaker&&m.text.includes(proposal.phrase))&&events.some(e=>e.type==='CAPTURE'&&e.speaker===evidence.speaker&&e.node===proposal.node)&&!g.notebook.some(n=>n.phrase===proposal.phrase&&n.node===proposal.node)){const entry={phrase:proposal.phrase,node:proposal.node};g.notebook.push(entry);learned.push(entry);}}
 g.publicEvents.push(...events);
 g.lastReveal={turn:g.turn,heard:decision.heard,taunt:decision.taunt,learned,events};
 g.tape.push({turn:g.turn,messages:g.transcript.filter(m=>m.turn===g.turn).map(({speaker,text})=>({speaker,text})),heard:decision.heard,moves:g.players.map(p=>({speaker:p.name,from:oldPositions[p.id],to:p.position,intent:p.intent,static:p.static})),creaturePath,events});
 const won=g.parts.every(p=>p.delivered),lost=g.players.every(p=>p.static)||g.turn===12;
 if(won||lost){g.phase='ended';g.outcome=won?'won':'lost';g.deadline=null;return;}
 g.turn++;g.phase='radio';g.phaseStartedAt=now;g.deadline=now+TURN_MS;
 for(const p of g.players){p.locked=false;p.move=null;p.intent='';}
}
