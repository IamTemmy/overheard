import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {randomBytes,createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createGame,sendMessage,lockMove,seatView,startListening,resolveTurn} from '../game/engine.mjs';
import {CHARACTERS} from '../content/memories.mjs';
import {planBot} from '../ai/bots.mjs';
import {listen,publicView,fallback} from '../ai/listener.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
export function createApp({now=Date.now,listener=listen,live=false}={}){
 const rooms=new Map();
 function seedBots(room){for(const p of room.game.players.filter(p=>p.bot)){const plan=planBot(seatView(room.game,p.id));p.intent=plan.intent;for(const msg of plan.messages)sendMessage(room.game,p.id,msg,now());}}
 async function advance(room){
 const g=room.game;if(!g||g.phase!=='radio')return;
 if(now()<g.deadline&&!g.players.filter(p=>!p.bot).every(p=>p.locked))return;
 for(const p of g.players.filter(p=>p.bot)){
 const plan=planBot(seatView(g,p.id));p.intent=plan.intent;
 // Deadline resolution is server-owned; bot plans are still validated by the engine.
 lockMove(g,p.id,plan.move,Math.min(now(),g.deadline-1));
 }
 if(!startListening(g,now()))return;
 room.pending=null;
 try{room.pending=await listener(g,{offline:!live});}catch{room.pending={decision:fallback(publicView(g)),source:'fallback'};}
 console.log(JSON.stringify({event:'listener',source:room.pending.source,latencyMs:room.pending.latencyMs??null,turn:g.turn}));
 }
 async function tick(){for(const [code,room]of rooms){
 if(now()-room.touched>2*60*60*1000){rooms.delete(code);continue;}
 if(room.game?.phase==='listening'&&now()>=room.game.deadline&&room.pending){const result=room.pending;room.pending=null;resolveTurn(room.game,result.decision,now());if(room.game.phase==='radio')seedBots(room);}
 void advance(room).catch(error=>console.error('Turn advance failed:',error.message));
 }}
 const timer=setInterval(tick,100);timer.unref();
 function auth(room,req){const value=req.headers.authorization?.replace(/^Bearer /,'')??'';const seat=room.seats.find(p=>p.tokenHash===hash(value));if(!seat)throw Error('Invalid seat token');return seat;}
 function view(room,seat){return {code:room.code,host:room.host===seat.id,mode:live?'Live Listener · scripted teammates':'Offline prototype · scripted opponents',roster:room.seats.map(({id,name})=>({id,name})),game:room.game?seatView(room.game,seat.id):null,serverNow:now()};}
 function issueSeat(room,name){const id=randomBytes(8).toString('hex'),token=randomBytes(32).toString('hex');const seat={id,name,tokenHash:hash(token)};room.seats.push(seat);return {seat,token};}
 const server=http.createServer(async(req,res)=>{
 const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 try{
 if(req.url?.startsWith('/api/')){
 if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)return reply(403,{error:'Origin denied'});
 let body={};if(req.method==='POST'){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>2048)return reply(413,{error:'Request too large'});}body=JSON.parse(raw||'{}');}
 if(req.url==='/api/rooms'&&req.method==='POST'){
 if(rooms.size>=100)throw Error('Prototype room limit reached');
 const name=String(body.name??'').trim();if(!CHARACTERS.includes(name))throw Error('Choose a character');
 let code;do{code=randomBytes(3).toString('hex').toUpperCase();}while(rooms.has(code));
 const room={code,seats:[],host:null,game:null,touched:now(),pending:null};const {seat,token}=issueSeat(room,name);room.host=seat.id;rooms.set(code,room);return reply(201,{token,...view(room,seat)});
 }
 const match=req.url.match(/^\/api\/rooms\/([A-F0-9]{6})(?:\/(join|start|message|lock))?$/);
 if(!match)return reply(404,{error:'Route not found'});
 const room=rooms.get(match[1]);if(!room)return reply(404,{error:'Room expired or server restarted'});
 const action=match[2];room.touched=now();
 if(action==='join'&&req.method==='POST'){
 if(room.game)throw Error('Match already started');if(room.seats.length>=5)throw Error('Room full');
 if(!CHARACTERS.includes(body.name)||room.seats.some(s=>s.name===body.name))throw Error('Choose an unused character');
 const {seat,token}=issueSeat(room,body.name);return reply(201,{token,...view(room,seat)});
 }
 const seat=auth(room,req);
 if(!action&&req.method==='GET')return reply(200,view(room,seat));
 if(req.method!=='POST')return reply(405,{error:'Method not allowed'});
 if(action==='start'){
 if(room.host!==seat.id)throw Error('Only the host can start');if(room.game)throw Error('Already started');
 const count=body.count;if(!Number.isInteger(count)||count<Math.max(2,room.seats.length)||count>5)throw Error('Choose 2–5 total survivors');
 const roster=room.seats.map(({id,name})=>({id,name,bot:false}));
 for(const name of CHARACTERS.filter(n=>!roster.some(s=>s.name===n)).slice(0,count-roster.length))roster.push({id:`bot-${name}`,name,bot:true});
 room.game=createGame(roster,{now:now()});seedBots(room);
 }else{
 if(!room.game)throw Error('Start the match first');
 if(body.turn!==room.game.turn)throw Error('That turn has ended');
 if(action==='message')sendMessage(room.game,seat.id,body.text,now());
 else if(action==='lock')lockMove(room.game,seat.id,body.move,now());
 else return reply(404,{error:'Route not found'});
 }
 void advance(room).catch(error=>console.error('Turn advance failed:',error.message));
 return reply(200,view(room,seat));
 }
 const paths={'/':'index.html','/client.js':'client.js','/style.css':'style.css'};
 if(req.method!=='GET'||!paths[req.url])return reply(404,{error:'Not found'});
 const content=await readFile(new URL(`../../public/${paths[req.url]}`,import.meta.url));
 res.writeHead(200,{'Content-Type':req.url.endsWith('.js')?'text/javascript':req.url.endsWith('.css')?'text/css':'text/html','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self'; frame-ancestors 'none'",'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});res.end(content);
 }catch(error){reply(400,{error:error.message});}
 });
 server.on('close',()=>clearInterval(timer));return {server,tick};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const live=process.env.LIVE_LISTENER==='1';
 if(live&&(!process.env.OPENAI_API_KEY||!process.env.OPENAI_MODEL))throw Error('Live mode requires OPENAI_API_KEY and OPENAI_MODEL');
 const {server}=createApp({live});const port=Number(process.env.PORT??3000);
 server.listen(port,'127.0.0.1',()=>console.log(`OVERHEARD: http://127.0.0.1:${port} (${live?'live Listener':'offline prototype'})`));
}
