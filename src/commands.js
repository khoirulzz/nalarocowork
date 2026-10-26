import {STAFF,PLACES,PLACE_ALIASES,staffByName} from "./roster.js";
import {WORLD_OBJECTS,getObject,findObject} from "./office.js";
export const ACTIONS=["move_to","stand","sit","talk","follow","wave","return_to_desk","stop","meet","take_object","place_object","make_coffee","clean_area","use_object"];
const objectActions=["take_object","place_object","use_object"];
const step=(actor,action,target=null,location=null,objectId=null)=>({actor,action,target,location,objectId});
export function normalizePlan(raw){
 if(!raw||!Array.isArray(raw.steps)||raw.steps.length>7)throw Error("Format aksi tidak valid");
 return {steps:raw.steps.map(s=>{
  const employee=staffByName(s.actor);
  if(!employee||!ACTIONS.includes(s.action))throw Error("Karyawan atau aksi tidak dikenal");
  if(s.target!=null&&!staffByName(s.target))throw Error("Target karyawan tidak dikenal");
  if(s.location!=null&&!PLACES[s.location])throw Error("Lokasi tidak dikenal");
  if(s.objectId!=null&&!getObject(s.objectId))throw Error("Objek tidak ditemukan: "+s.objectId);
  if(objectActions.includes(s.action)&&s.action!=="place_object"&&!getObject(s.objectId))throw Error("Objek perlu disebutkan");
  return step(employee.id,s.action,s.target||null,s.location||null,s.objectId||null);
 })};
}
export function parseLocal(input){
 const text=String(input||"").toLowerCase().trim(),mention=text.match(/@([a-z0-9_-]+)/);
 if(!mention)return null;
 const person=staffByName(mention[1]);if(!person)return null;
 const rest=text.replace(mention[0]," ");
 const others=STAFF.filter(p=>p.id!==person.id);
 const target=others.find(p=>new RegExp("(^|[^a-z])"+p.id+"([^a-z]|$)").test(rest));
 const location=Object.entries(PLACE_ALIASES).sort((a,b)=>b[0].length-a[0].length).find(([alias])=>rest.includes(alias))?.[1]||null;
 const item=[...WORLD_OBJECTS.values()].filter(o=>rest.includes(o.id.replace(/_/g," "))||rest.includes(o.id))
  .sort((a,b)=>b.id.length-a.id.length)[0]||null;
 const source = item || ([...WORLD_OBJECTS.values()].find(o=> (o.type==="cup"&&/gelas|cangkir/.test(rest)) || (o.type==="document"&&/berkas|dokumen/.test(rest)) || (o.type==="notebook"&&/buku|notebook/.test(rest)))||null);
 const from=person.id;
 const walk=/samperin|hampiri|temui|datangi|menuju|pergi ke|jalan ke|panggil|antarkan|antar|ajak/.test(rest);
 const standing=/berdiri|bangun dari kursi/.test(rest);
 const sitting=/duduk|duduklah/.test(rest);
 const calling=/panggil|suruh|bilang|sampaikan|ajak/.test(rest);
 const take=/ambil|bawa|pungut/.test(rest);
 const place=/letakkan|taruh|serahkan|berikan|antar|kirim ke/.test(rest);
 const brew=/buat kopi|seduh kopi|bikin kopi|membuat kopi/.test(rest);
 const clean=/bersih|sapu|pel |rapikan/.test(rest);
 const steps=[];
 if(/kembali ke meja|balik ke meja/.test(rest))return {steps:[step(from,"return_to_desk")]};
 if(/berhenti|diam di tempat|stop/.test(rest))return {steps:[step(from,"stop")]};
 if(/lambai|dadah|melambai/.test(rest))return {steps:[step(from,"wave")]};
 if(brew)return {steps:[step(from,"make_coffee"),...(target?[step(from,"move_to",target.id),step(from,"place_object",target.id)]:[])]};
 if(clean)return {steps:[step(from,"clean_area",null,location||"hall")]};
 if(take&&source?.portable){
  steps.push(step(from,"take_object",null,null,source.id));
  if(place&&(target||location))steps.push(step(from,"place_object",target?.id||null,location||null));
  return {steps};
 }
 if(/pakai|gunakan|operasikan/.test(rest)&&item)return {steps:[step(from,"use_object",null,null,item.id)]};
 if(walk&&(target||location))steps.push(step(from,"move_to",target?.id||null,location));
 if(standing)steps.push(step(calling&&target?target.id:from,"stand"));
 if(sitting)steps.push(step(calling&&target?target.id:from,"sit"));
 if(/ikuti|ikut kamu|mengikuti/.test(rest)&&target)steps.push(step(target.id,"follow",from));
 if(!steps.length)return null;
 return {steps};
}
export function commandText(s){
 const a=staffByName(s.actor)?.name||s.actor,t=staffByName(s.target)?.name||s.location||s.objectId||"";
 return {move_to:a+" menuju "+t,stand:a+" berdiri",sit:a+" duduk",talk:a+" berbicara",follow:a+" mengikuti "+t,wave:a+" melambaikan tangan",
 return_to_desk:a+" kembali ke meja",stop:a+" berhenti",meet:a+" menuju ruang rapat",take_object:a+" mengambil "+t,
 place_object:a+" menyerahkan atau menaruh barang",make_coffee:a+" menyiapkan kopi",clean_area:a+" membersihkan "+t,
 use_object:a+" menggunakan "+t}[s.action];
}
export async function interpretCommand(prompt,engineReady){
 const parsed=parseLocal(prompt);
 if(parsed)return {plan:normalizePlan(parsed),provider:"Lokal"};
 if(!engineReady)throw Error("Perintah belum tersedia secara lokal. Groq belum aktif: isi GROQ_API_KEY di .env, lalu restart npm run dev.");
 const context=STAFF.map(p=>({id:p.id,role:p.role,home:p.home}));
 const objects=[...WORLD_OBJECTS.values()].map(o=>({id:o.id,type:o.type,portable:o.portable,available:!o.owner,actions:o.actions}));
 const response=await fetch("/api/plan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,context,objects})});
 let data;try{data=await response.json();}catch{throw Error("Proxy Groq tidak memberi JSON yang valid");}
 if(!response.ok)throw Error(data.error||"Groq tidak tersedia");
 return {plan:normalizePlan(data.plan),provider:"Groq",usage:data.usage};
}
