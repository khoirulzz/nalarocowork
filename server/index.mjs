import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const cwd=path.dirname(fileURLToPath(import.meta.url));
try { const dotenv=fs.readFileSync(path.join(cwd,"../.env"),"utf8");
  for(const line of dotenv.split(/\r?\n/)){const m=line.match(/^([A-Z_]+)=(.*)$/);if(m && !process.env[m[1]])process.env[m[1]]=m[2].trim();}
} catch {}
const key=process.env.GROQ_API_KEY || "";
const model=process.env.GROQ_MODEL || "openai/gpt-oss-20b";
const port=Number(process.env.COWORK_PORT||8787);
const allowedActions=["move_to","stand","sit","talk","follow","wave","return_to_desk","stop","meet"];
const ids=["ulum","adi","agil","ulin","lukman","siswo","huda","fadil","sumanto"];
const places=["owner","supportA","supportB","finance","technical","creative","operations","pantry","utility","meeting","lobby","lounge"];
const schema={type:"object",properties:{steps:{type:"array",maxItems:7,items:{type:"object",properties:{
 actor:{type:"string",enum:ids},action:{type:"string",enum:allowedActions},
 target:{type:["string","null"]},location:{type:["string","null"]}},required:["actor","action","target","location"],additionalProperties:false}}},
 required:["steps"],additionalProperties:false};
const ok=(res,status,data,extra={})=>{res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Access-Control-Allow-Origin":"http://127.0.0.1:5173",...extra});res.end(JSON.stringify(data));};
function validate(result){
 if(!result || !Array.isArray(result.steps) || result.steps.length>7)throw Error("Rencana tidak valid");
 return {steps:result.steps.map(s=>{
  if(!ids.includes(s.actor)||!allowedActions.includes(s.action))throw Error("Aksi di luar kemampuan karakter");
  if(s.target!==null && !ids.includes(s.target))throw Error("Target tidak dikenal");
  if(s.location!==null && !places.includes(s.location))throw Error("Lokasi tidak dikenal");
  return {actor:s.actor,action:s.action,target:s.target,location:s.location};
 })};
}
let queue=Promise.resolve();
const server=http.createServer(async(req,res)=>{
 if(req.method==="OPTIONS"){res.writeHead(204,{"Access-Control-Allow-Origin":"http://127.0.0.1:5173","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type"});return res.end();}
 if(req.method==="GET"&&req.url==="/api/health")return ok(res,200,{ready:!!key,provider:key?"groq":"local",model});
 if(req.method!=="POST"||req.url!=="/api/plan")return ok(res,404,{error:"Tidak ditemukan"});
 if(!key)return ok(res,503,{error:"GROQ_API_KEY belum dikonfigurasi"});
 const chunks=[];let size=0;
 for await (const chunk of req){size+=chunk.length;if(size>12000)return ok(res,413,{error:"Perintah terlalu panjang"});chunks.push(chunk);}
 let data;try{data=JSON.parse(Buffer.concat(chunks).toString("utf8"));}catch{return ok(res,400,{error:"JSON tidak valid"});}
 const prompt=String(data.prompt||"").slice(0,500).trim();
 if(!prompt)return ok(res,400,{error:"Perintah kosong"});
 const context=Array.isArray(data.context)?data.context.slice(0,12):[];
 const run=async()=>{
  const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),16000);
  try{
   const body={model,temperature:0,max_completion_tokens:380,
    messages:[{role:"system",content:"You plan actions for a safe, fictional 3D voxel office simulator. Reply only using supplied schema. Interpret Indonesian informal commands and @names. Employees: "+ids.join(", ")+". Locations: "+places.join(", ")+". Available actions: "+allowedActions.join(", ")+". For 'A go tell B to stand' output A move_to B then B stand. No unsupported actions. Never invent new actor or place. Max seven steps. Return empty steps for an impossible request."},
      {role:"user",content:JSON.stringify({command:prompt,nearby:context})}],
    response_format:{type:"json_schema",json_schema:{name:"office_plan",strict:true,schema}}};
   const result=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",signal:ctrl.signal,
     headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify(body)});
   const payload=await result.json();
   if(!result.ok){return {error:result.status===429?"Rate limit Groq tercapai":("Groq error "+result.status),status:result.status,retryAfter:result.headers.get("retry-after")};}
   return {plan:validate(JSON.parse(payload.choices[0].message.content)),usage:payload.usage||null};
  } catch(e){return {error:e.name==="AbortError"?"Groq timeout":String(e.message||e),status:502};}
  finally{clearTimeout(timeout);}
 };
 // Sequential calls avoid concurrent spikes against free TPM.
 const task=queue.then(run,run);queue=task.then(()=>undefined,()=>undefined);
 const result=await task;
 return result.error?ok(res,result.status===429?429:502,result):ok(res,200,result);
});
server.listen(port,"127.0.0.1",()=>console.log("Nalaro Cowork AI proxy: http://127.0.0.1:"+port+" (Groq key "+(key?"set":"missing")+")"));
