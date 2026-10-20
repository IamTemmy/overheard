const $=id=>document.getElementById(id);
let session=null,current=null,selected='STAY',lastTurn=null,busy=false,offset=0;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const coords={'Radio Tower':[300,32],Church:[170,100],'Power Plant':[440,100],Library:[75,180],Hospital:[235,180],Stadium:[440,195],Docks:[555,245],Diner:[160,270],'East Line Station':[335,220],Bridge:[310,315],Mall:[165,375],'Ferris Wheel':[455,365]};
function error(e){$('error').textContent=e?.message??'';}
async function api(path,body){const r=await fetch(`/api/rooms${path}`,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(session?{Authorization:`Bearer ${session.token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();if(!r.ok)throw Error(data.error);return data;}
function save(data){session={code:data.code,token:data.token};try{sessionStorage.setItem('overheard-seat',JSON.stringify(session));}catch{}render(data);}
async function action(name,body){if(busy)return;busy=true;error(null);try{render(await api(`/${session.code}/${name}`,body));}catch(e){error(e);}finally{busy=false;}}
$('create').onclick=async()=>{try{save(await api('',{name:$('character').value}));}catch(e){error(e);}};
$('join').onclick=async()=>{try{save(await api(`/${$('code').value.trim().toUpperCase()}/join`,{name:$('character').value}));}catch(e){error(e);}};
$('start').onclick=()=>action('start',{count:Number($('count').value)});
$('lock').onclick=()=>action('lock',{turn:current.game.turn,move:selected});
$('message-form').onsubmit=async e=>{e.preventDefault();if(busy)return;const text=$('message').value;await action('message',{turn:current.game.turn,text});if(!$('error').textContent)$('message').value='';};
$('again').onclick=()=>{try{sessionStorage.removeItem('overheard-seat');}catch{}location.href='/';};
function show(id){for(const name of ['home','lobby','game','end'])$(name).hidden=name!==id;}
function render(data){current=data;offset=data.serverNow-Date.now();$('status').textContent=data.mode;
 if(!data.game){show('lobby');$('room').textContent=`ROOM ${data.code}`;$('roster').innerHTML=data.roster.map(p=>`<p>${esc(p.name)}</p>`).join('');$('start').disabled=!data.host;return;}
 const g=data.game;
 if(g.phase==='ended'){show('end');$('result').textContent=g.outcome==='won'?'The city has a voice again.':'The frequency went silent.';$('tape').innerHTML=g.tape.map(t=>`<details><summary>Turn ${t.turn} · ${t.events.filter(e=>e.type==='CAPTURE').length} captures</summary><pre>${esc(t.messages.map(m=>`${m.speaker}: ${m.text}`).join('\n'))}\n\n${esc(t.heard.map(h=>`Listener: “${h.quote}” → ${h.guess_node} (${Math.round(h.confidence*100)}%)`).join('\n')||'No grounded decoding recorded.')}\n\n${esc(t.moves.map(m=>`${m.speaker}: ${m.from} → ${m.to}${m.static?' [STATIC]':''}`).join('\n'))}\nListener route: ${esc(t.creaturePath.join(' → '))}</pre></details>`).join('');return;}
 show('game');if(lastTurn!==g.turn){selected='STAY';lastTurn=g.turn;}
 $('turn').textContent=`TURN ${g.turn} / 12 · ${g.self.name}${g.self.static?' [STATIC]':''}`;
 $('parts').textContent=g.parts.map(p=>`${p.status==='delivered'?'●':p.status==='carried'?'◐':'○'} ${p.id}`).join('  ');
 $('location').textContent=g.self.position;$('cue').textContent=g.cue+(g.creature?` Near ${g.creature}.`:'');
 const edges=new Set();let svg='';for(const [a,neighbors]of Object.entries(g.map))for(const b of neighbors){const key=[a,b].sort().join(':');if(edges.has(key))continue;edges.add(key);svg+=`<line x1="${coords[a][0]}" y1="${coords[a][1]}" x2="${coords[b][0]}" y2="${coords[b][1]}"/>`;}
 for(const [name,[x,y]]of Object.entries(coords))svg+=`<g class="${name===g.self.position?'self':name===g.creature?'creature':''}"><circle cx="${x}" cy="${y}" r="${name===g.self.position?8:5}"/><text x="${x}" y="${y+18}">${esc(name)}</text></g>`;
 $('map').innerHTML=svg;
 const disabled=g.phase!=='radio'||g.self.locked;
 $('moves').innerHTML=['STAY',...(g.self.static?[]:g.map[g.self.position])].map(n=>`<button data-move="${esc(n)}" class="${selected===n?'selected':''}" ${disabled?'disabled':''}>${esc(n==='STAY'?'Stay here':n)}</button>`).join('');
 for(const b of $('moves').querySelectorAll('button'))b.onclick=()=>{selected=b.dataset.move;render(current);};
 $('knowledge').textContent=`${g.visibleParts?.length?'HERE: '+g.visibleParts.map(p=>p.id+(p.heavy?' (needs two survivors)':'')).join(', ')+'. ':''}Your intel: ${g.self.known.map(k=>`${k.part} started at ${k.node}`).join('; ')}. Carrying: ${g.self.carrying.join(', ')||'nothing'}.`;
 $('lock').textContent=g.self.locked?'Locked · waiting for crew':`Lock in: ${selected==='STAY'?'stay':selected}`;$('lock').disabled=disabled;
 const logKey=JSON.stringify([g.transcript,g.publicEvents,g.lastReveal]);
 if($('log').dataset.key!==logKey){$('log').dataset.key=logKey;$('log').innerHTML=g.transcript.map(m=>`<div class="transmission"><strong>${esc(m.speaker)} / ${m.turn}</strong>${esc(m.text)}</div>`).join('')+g.publicEvents.slice(-5).map(e=>`<p class="event">${esc(e.type)} · ${esc(e.node)}${e.speaker?' · '+esc(e.speaker):''}</p>`).join('')+(g.lastReveal?`<p class="event">THE LISTENER: ${esc(g.lastReveal.taunt)}</p>`:'');$('log').scrollTop=$('log').scrollHeight;}
 $('send').disabled=disabled;$('message').disabled=disabled;
 $('memories').innerHTML=g.memories.map(m=>{let story=esc(m.story);for(const tell of m.tells)story=story.replace(new RegExp('\\b'+tell+'\\b','gi'),'<mark>$&</mark>');return `<div class="memory"><span><b>${esc(m.node)}</b><br>${story}<br><small>Risky tells: ${esc(m.tells.join(', '))}</small></span></div>`;}).join('');
 $('notebook').innerHTML=(g.notebook.length?g.notebook.map(n=>`<p class="burned">${esc(n.phrase)} → ${esc(n.node)}<br><small>Corroborated by ${esc(n.evidence?.type??'public evidence')} · could be a bluff.</small></p>`).join(''):'<p class="small">No corroborated guesses yet.</p>')+(g.suspicions??[]).map(n=>`<p class="pencil">“${esc(n.phrase)}” → ${esc(n.node)}? · unconfirmed</p>`).join('');
 $('listening').hidden=!['planning','listening'].includes(g.phase);
}
setInterval(()=>{if(current?.game?.deadline)$('clock').textContent=`${Math.max(0,Math.ceil((current.game.deadline-Date.now()-offset)/1000))}s`;},200);
let thinking=false;setInterval(async()=>{if(!session||thinking||!current?.game||current.game.phase==='ended')return;thinking=true;try{await api(`/${session.code}/think`,{});}catch{}finally{thinking=false;}},500);
let polling=false;setInterval(async()=>{if(!session||polling)return;polling=true;try{render(await api(`/${session.code}`));}catch(e){error(e);}finally{polling=false;}},750);
// Only a reload resumes the seat; ordinary return visits start on the home screen.
if(performance.getEntriesByType('navigation')[0]?.type==='reload'){try{session=JSON.parse(sessionStorage.getItem('overheard-seat'));if(session)render(await api(`/${session.code}`));}catch(e){session=null;error(e);}}
