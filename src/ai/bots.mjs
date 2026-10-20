import {nextStep} from '../game/map.mjs';
// This function receives ONLY a seat view, never the game or another bot's private state.
export function planBot(view){
 const me=view.self;
 const code=node=>view.memories.find(m=>m.node===node)?.phrase??node;
 if(me.static)return {move:'STAY',messages:[`Static eyes: it is at ${code(view.creature)}.`],intent:'Report the creature from Static vision'};
 const taken=new Set(view.publicEvents.filter(e=>e.type==='CLANG').map(e=>e.node));
 const dropped=[...view.publicEvents].reverse().find(e=>e.type==='CAPTURE'&&!view.publicEvents.some(n=>n.type==='CLANG'&&n.node===e.node&&n.turn>=e.turn));
 let goal=me.carrying.length?'Radio Tower':me.known.find(k=>!taken.has(k.node))?.node??dropped?.node;
 // Human can give a simple team instruction in the prototype: "help <shared reference>".
 const request=[...view.transcript].reverse().find(m=>m.turn===view.turn&&/^help\b/i.test(m.text));
 const decoded=request&&view.memories.find(m=>request.text.toLowerCase().includes(m.phrase.toLowerCase()));
 if(!goal&&decoded)goal=decoded.node;
 if(!goal)goal='Radio Tower';
 let move=nextStep(me.position,goal);
 if(view.creature&&move===view.creature){move=Object.keys(view.map).find(n=>view.map[me.position].includes(n)&&n!==view.creature&&n!=='Radio Tower')??me.position;}
 return {move,messages:[`${me.carrying.length?'Carrying cargo. ':''}Heading to ${code(goal)}.`.slice(0,80)],intent:`Travel toward ${goal}; avoid a creature visible in my own cue`};
}
