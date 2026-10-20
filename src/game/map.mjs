export const MAP = Object.freeze({
 'Radio Tower':['Church','Power Plant'], Church:['Radio Tower','Library','Hospital'],
 'Power Plant':['Radio Tower','Stadium','Docks'], Library:['Church','Diner','East Line Station'],
 Hospital:['Church','Diner','Mall'], Diner:['Library','Hospital','Bridge'],
 'East Line Station':['Library','Stadium','Bridge'], Stadium:['Power Plant','East Line Station','Docks'],
 Docks:['Power Plant','Stadium','Ferris Wheel'], 'Ferris Wheel':['Docks','Bridge','Mall'],
 Bridge:['Diner','East Line Station','Ferris Wheel','Mall'], Mall:['Hospital','Bridge','Ferris Wheel']
});
export const NODES = Object.keys(MAP);
export function nextStep(from,to) {
 if (!NODES.includes(from)||!NODES.includes(to)) throw Error('Unknown node');
 const queue=[[from]],seen=new Set([from]);
 for(const path of queue){const last=path.at(-1);if(last===to)return path[1]??from;
 for(const n of MAP[last])if(!seen.has(n)){seen.add(n);queue.push([...path,n]);}}
 throw Error('Disconnected map');
}
