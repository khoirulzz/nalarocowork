import { STAFF, PLACES, PLACE_ALIASES, staffByName } from "./roster.js";
export const ACTIONS=["move_to","stand","sit","talk","follow","wave","return_to_desk","stop","meet"];
export function normalizePlan(raw){
 if(!raw||!Array.isArray(raw.steps)||raw.steps.length>7)throw new Error("Format aksi tidak valid");
 const steps=raw.steps.map(s=>{
  if(!staffByName(s.actor) || !ACTIONS.includes(s.action))throw new Error("Karyawan atau aksi tidak dikenal");
  if(s.target!=null&&!staffByName(s.target))throw new Error("Target tidak ditemukan");
  if(s.location!=null && !PLACES[s.location])throw new Error("Lokasi tidak ditemukan");
  return {actor:staffByName(s.actor).id,action:s.action,
   target:s.target==null?null:staffByName(s.target).id,
   location:s.location??null};
 });
 return {steps};
}
const step=(actor,action,target=null,location=null)=>({actor,action,target,location});
export function parseLocal(text){
 const input=String(text||"").trim().toLowerCase();
 const match=input.match(/@([a-z0-9_-]+)/);
 if(!match)return null;
 const from=staffByName(match[1]);if(!from)return null;
 const rest=input.replace(match[0]," ");
 const people=STAFF.filter(e=>e.id!==from.id);
 const target=people.find(e=>new RegExp("(^|[^a-z])"+e.id+"([^a-z]|$)").test(rest));
 const destination=Object.entries(PLACE_ALIASES).find(([alias])=>rest.includes(alias));
 const loc=destination?destination[1]:null;
 const walk=/samperin|hampiri|temui|datangi|pergi|menuju|ke meja|jalan ke|panggil|antarkan|antar/.test(rest);
 const standing=/berdiri|bangun dari kursi/.test(rest);
 const sitting=/duduk|duduklah/.test(rest);
 const calling=/panggil|suruh|bilang|sampaikan/.test(rest);
 const following=/ikuti|ikut kamu|mengikuti/.test(rest);
 const waving=/lambai|dadah|melambai/.test(rest);
 const returning=/kembali ke meja|balik ke meja|pulang ke meja/.test(rest);
 const stop=/berhenti|diam di tempat|stop/.test(rest);
 const steps=[];
 if(returning)return {steps:[step(from.id,"return_to_desk")]};
 if(stop)return {steps:[step(from.id,"stop")]};
 if(waving)return {steps:[step(from.id,"wave")]};
 if(walk&&(target||loc))steps.push(step(from.id,"move_to",target?.id||null,loc));
 if(calling&&target&&loc&&walk)steps.push(step(target.id,"move_to",null,loc));\n if(standing)steps.push(step(calling&&target?target.id:from.id,"stand"));
 if(sitting)steps.push(step(calling&&target?target.id:from.id,"sit"));
 if(following&&target)steps.push(step(target.id,"follow",from.id));
 // Avoid pretending a complex command worked when we do not recognize the intent.
 if(steps.length===0)return null;
 return {steps:steps.slice(0,7)};
}
export function commandText(s){
 const actor=staffByName(s.actor)?.name||s.actor;
 const target=staffByName(s.target)?.name||s.location||"";
 return {move_to:actor+" menuju "+target,stand:actor+" berdiri",sit:actor+" duduk",
  talk:actor+" berbicara dengan "+target,follow:actor+" mengikuti "+target,
  wave:actor+" melambaikan tangan",return_to_desk:actor+" kembali ke meja",
  stop:actor+" berhenti",meet:actor+" menuju ruang meeting"}[s.action]||"Aksi baru";
}
export async function interpretCommand(prompt, engineReady){
 // For familiar animation commands the local parser is cheaper and more reliable.
 const parsed=parseLocal(prompt);
 if(parsed)return {plan:normalizePlan(parsed),provider:"Lokal"};
 if(!engineReady)throw new Error("Perintah ini memerlukan Groq. Jalankan server dan atur GROQ_API_KEY.");
 const context=STAFF.map(p=>({id:p.id,role:p.role,home:p.home}));
 const res=await fetch("http://127.0.0.1:8787/api/plan",{
  method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,context})
 });
 const data=await res.json();
 if(!res.ok)throw new Error(data.error||"Groq tidak tersedia");
 return {plan:normalizePlan(data.plan),provider:"Groq"};
}
