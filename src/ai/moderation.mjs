export async function moderate(texts,{apiKey,fetchImpl=fetch}={}){
 if(!apiKey)return {allowed:true,mode:'offline-private-playtest'};
 try{const response=await fetchImpl('https://api.openai.com/v1/moderations',{method:'POST',signal:AbortSignal.timeout(1000),headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:'omni-moderation-latest',input:texts})});
 if(!response.ok)throw Error('moderation unavailable');const body=await response.json();return {allowed:Array.isArray(body.results)&&body.results.length===texts.length&&body.results.every(r=>r.flagged===false),mode:'live'};
 }catch{return {allowed:false,mode:'unavailable'};}
}
