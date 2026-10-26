const ACTIONS=["move_to","stand","sit","talk","follow","wave","return_to_desk","stop","meet","take_object","place_object","make_coffee","clean_area","use_object"];
const PEOPLE=["ulum","adi","agil","ulin","lukman","siswo","huda","fadil","sumanto"];
const LOCATIONS=["owner","finance","technical","creative","operations","supportA","supportB","pantry","utility","meeting","lobby","lounge","hall","printer","storage"];
const planSchema={type:"object",properties:{steps:{type:"array",maxItems:7,items:{type:"object",properties:{
 actor:{type:"string",enum:PEOPLE},action:{type:"string",enum:ACTIONS},target:{type:["string","null"]},
 location:{type:["string","null"]},objectId:{type:["string","null"]}},
 required:["actor","action","target","location","objectId"],additionalProperties:false}}},
 required:["steps"],additionalProperties:false};
const json=(res,status,data)=>{res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});res.end(JSON.stringify(data));};
let queue=Promise.resolve(),lastRequest=0;
export function officeApi(config={}){
 const key=config.GROQ_API_KEY||"",model=config.GROQ_MODEL||"openai/gpt-oss-20b";
 return async function handle(req,res,next){
  const route=String(req.url||"").split("?")[0];
  if(route!=="/api/health"&&route!=="/api/plan")return next?.();
  if(route==="/api/health")return json(res,200,{ready:!!key,model:key?model:null,provider:key?"groq":"offline"});
  if(req.method!=="POST")return json(res,405,{error:"Metode tidak diizinkan"});
  if(!key)return json(res,503,{error:"GROQ_API_KEY belum tersedia. Restart npm run dev setelah mengedit .env."});
  if(req.headers.origin && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.origin))
   return json(res,403,{error:"Origin tidak diizinkan"});
  if(!String(req.headers["content-type"]||"").includes("application/json"))return json(res,415,{error:"Gunakan JSON"});
  let size=0;const chunks=[];
  try{for await(const buf of req){size+=buf.length;if(size>24000)return json(res,413,{error:"Input terlalu panjang"});chunks.push(buf);}}
  catch{return json(res,400,{error:"Gagal membaca input"});}
  let input;try{input=JSON.parse(Buffer.concat(chunks).toString("utf8"));}catch{return json(res,400,{error:"JSON tidak valid"});}
  const prompt=String(input.prompt||"").trim().slice(0,500);
  if(!prompt)return json(res,400,{error:"Perintah kosong"});
  const context=Array.isArray(input.context)?input.context.slice(0,9):[];
  const objects=Array.isArray(input.objects)?input.objects.slice(0,55):[];
  const run=async()=>{
   // Queue requests to stay within small free-plan token budgets.
   const remaining=Math.max(0,250-(Date.now()-lastRequest));if(remaining)await new Promise(r=>setTimeout(r,remaining));
   lastRequest=Date.now();
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),21000);
   try{
    const response=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",signal:controller.signal,
      headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},
      body:JSON.stringify({model,temperature:0,max_completion_tokens:650,
       response_format:{type:"json_schema",json_schema:{name:"office_actions",strict:true,schema:planSchema}},
       messages:[{role:"system",content:"You control NPCs in a fictional 3D office. Interpret Indonesian commands, including slang. Output ONLY valid plan JSON. Available actor IDs: "+PEOPLE.join(", ")+". Locations: "+LOCATIONS.join(", ")+". Actions: "+ACTIONS.join(", ")+". Objects are in the user context. For 'A go tell B to stand', steps are A move_to B, then B stand. For coffee first make_coffee then move_to recipient then place_object. Never invent objects or unsupported actions. Max 7 steps. Empty steps for impossible requests. No external tools."},
       {role:"user",content:JSON.stringify({command:prompt,employees:context,objects})}]})});
    let data;try{data=await response.json();}catch{throw Error("Respons Groq tidak valid");}
    if(!response.ok)return {status:response.status,error:response.status===429?"Kuota/rate limit Groq tercapai. Coba lagi nanti.":(data.error?.message||"Groq error "+response.status),retryAfter:response.headers.get("retry-after")};
    const parsed=JSON.parse(data.choices?.[0]?.message?.content||"{}");
    if(!Array.isArray(parsed.steps)||parsed.steps.length>7)throw Error("Rencana AI tidak valid");
    const objectIds=new Set(objects.map(o=>o.id));
    for(const s of parsed.steps){
     if(!PEOPLE.includes(s.actor)||!ACTIONS.includes(s.action)||s.target!==null&&!PEOPLE.includes(s.target)||
       s.location!==null&&!LOCATIONS.includes(s.location)||s.objectId!==null&&!objectIds.has(s.objectId))
       throw Error("Rencana AI mengandung objek/aksi tak dikenal");
    }
    return {status:200,plan:parsed,usage:data.usage||null};
   }catch(error){return {status:502,error:error.name==="AbortError"?"Groq timeout":String(error.message||error)}}
   finally{clearTimeout(timer);}
  };
  const job=queue.then(run,run);queue=job.then(()=>undefined,()=>undefined);
  const result=await job;return result.error?json(res,result.status===429?429:502,{error:result.error,retryAfter:result.retryAfter}):json(res,200,{plan:result.plan,usage:result.usage});
 };
}
