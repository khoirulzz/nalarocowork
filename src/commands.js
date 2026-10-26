import {STAFF,PLACES,PLACE_ALIASES,staffByName} from './roster.js';
import {WORLD_OBJECTS,getObject} from './office.js';
import {ACTIONS,makeStep as step,validatePlan} from './action-contract.js';
export {ACTIONS};
export const normalizePlan=raw=>validatePlan(raw,getObject);
const mentions=text=>[...text.matchAll(/@?\b([a-z][a-z0-9_-]*)\b/g)].map(m=>staffByName(m[1])).filter(Boolean);

function parseClause(text,actor,delegate=false) {
 const others=mentions(text).filter(p=>p.id!==actor.id),target=others[0];
 const location=Object.entries(PLACE_ALIASES).sort((a,b)=>b[0].length-a[0].length).find(([a])=>text.includes(a))?.[1]||null;
 const objects=[...WORLD_OBJECTS.values()];
 const compact=text.replace(/\s+/g,'_');
 let item=objects.filter(o=>compact.includes(o.id)).sort((a,b)=>b.id.length-a.id.length)[0];
 if(!item && /meja/.test(text)) item=getObject('desk_'+(target?.home||actor.home));
 if(!item && /kursi/.test(text)) item=getObject('chair_'+(target?.home||actor.home));
 if(!item && /gelas|cangkir/.test(text)) item=objects.find(o=>o.type==='cup'&&!o.owner);
 if(!item && /dokumen|berkas/.test(text)) item=getObject('document_finance');
 if(!item && /sapu/.test(text)) item=getObject('broom_utility');
 const who=delegate&&target?target.id:actor.id;
 if(/kembali ke meja|balik ke meja/.test(text))return [step(who,'return_to_desk')];
 if(/berhenti|diam di tempat|stop/.test(text))return [step(who,'stop')];
 if(/minum/.test(text)){const cup=objects.find(o=>o.type==='cup'&&o.owner===who);return cup?[step(who,'use_object',null,null,cup.id)]:null;}
 if(/(?:buat|seduh|bikin|membuat)\s+kopi/.test(text))return [step(who,'make_coffee'),...(target?[step(who,'place_object',target.id)]:[])];
 if(/bersih|rapikan|lap meja|mengepel|menyapu/.test(text))return item?[step(who,'clean_object',null,null,item.id)]:[step(who,'clean_area',null,location||'hall')];
 if(/naik(?:i)?\s+(?:ke\s+)?kursi|naiki\s+chair_/.test(text)&&item)return [step(who,'climb_object',null,null,item.id)];
 if(/push[ -]?up/.test(text))return [step(who,'push_up',null,null,null,8)];
 if(/ambil|pungut/.test(text)&&item?.portable)return [step(who,'take_object',null,null,item.id)];
 if(/taruh|letak|serah|berikan|antar|kirim/.test(text)&&(target||location||item))return item?.actions.includes('place')&&!item.portable?[step(who,'place_object',null,null,item.id)]:[step(who,'place_object',target?.id||null,location,item?.id||null)];
 if(/gunakan|pakai|operasikan/.test(text)&&item)return [step(who,'use_object',null,null,item.id)];
 if(/samperin|hampiri|temui|datangi|menuju|pergi ke|jalan ke/.test(text)&&(target||location||item))return [step(actor.id,'move_to',target?.id||null,location,item?.id||null)];
 if(/berdiri|bangun dari kursi/.test(text))return [step(who,'stand')];
 if(/duduk/.test(text))return [step(who,'sit',null,null,item?.type==='chair'?item.id:null)];
 if(/lambai|dadah/.test(text))return [step(who,'wave')];
 if(/ikuti|mengikuti/.test(text)&&target)return [step(actor.id,'follow',target.id)];
 if(/bicara|mengobrol/.test(text))return target?[step(actor.id,'move_to',target.id),step(actor.id,'talk',target.id)]:[step(actor.id,'talk')];
 return null;
}
export function parseLocal(input) {
 const text=String(input||'').toLowerCase().trim();
 const group=text.match(/^((?:@[a-z0-9_-]+\s*(?:(?:dan|&|,)\s*)?){2,})(.+)$/);
 if(group){
  const actors=[...group[1].matchAll(/@([a-z0-9_-]+)/g)].map(m=>staffByName(m[1]));
  if(actors.some(p=>!p))return null;
  const plans=actors.map(p=>parseSequence(group[2],p));
  return plans.every(Boolean)?{steps:plans.flat()}:null;
 }
 const first=text.match(/^@([a-z0-9_-]+)\s+/);
 if(!first)return null;
 let actor=staffByName(first[1]);if(!actor)return null;
 const rest=text.slice(first[0].length),steps=[];
 // A clause with an explicit recipient delegates only the following instruction.
 const delegated=rest.match(/^(.*?)\b(?:dan\s+)?(?:suruh|minta|bilang ke)\s+(?:(dia|ia|mereka)\s+|@?([a-z]+)\s+)?(.+)$/);
 if(delegated) {
   const prefix=delegated[1].trim(),recipient=staffByName(delegated[3])||mentions(prefix).find(p=>p.id!==actor.id);
   if(!recipient)return null;
   if(prefix){const parsed=parseClause(prefix,actor);if(!parsed)return null;steps.push(...parsed);}
   else steps.push(step(actor.id,'move_to',recipient.id));
   steps.push(step(actor.id,'talk',recipient.id));actor=recipient;
   const parsed=parseSequence(delegated[4],actor);return parsed?{steps:[...steps,...parsed]}:null;
 }
 const parsed=parseSequence(rest,actor);return parsed?{steps:parsed}:null;
}
function parseSequence(text,actor) {
 const clauses=text.split(/\s*(?:,|\blalu\b|\bkemudian\b|\bsetelah itu\b|\bdan\b)\s*/).filter(Boolean),steps=[];
 for(let clause of clauses) {
  const named=clause.match(/^@([a-z0-9_-]+)\s+/);
  if(named){actor=staffByName(named[1]);if(!actor)return null;clause=clause.slice(named[0].length);}
  const parsed=parseClause(clause,actor);if(!parsed)return null;steps.push(...parsed);
 }
 return steps.length?steps:null;
}
export function commandText(s){
 const a=staffByName(s.actor)?.name||s.actor,t=staffByName(s.target)?.name||s.location||s.objectId||'';
 return {move_to:a+' menuju '+t,stand:a+' berdiri',sit:a+' duduk',talk:a+' berbicara',follow:a+' mengikuti '+t,wave:a+' melambai',
 return_to_desk:a+' kembali ke meja',stop:a+' berhenti',meet:a+' menuju ruang rapat',take_object:a+' mengambil '+t,
 place_object:a+' mengantar barang ke '+t,make_coffee:a+' menyiapkan kopi',clean_area:a+' membersihkan '+t,
 clean_object:a+' membersihkan '+t,use_object:a+' menggunakan '+t,push_up:a+' push up',climb_object:a+' menaiki '+t,animate:a+' melakukan gerakan'}[s.action];
}
export async function interpretCommand(prompt,engineReady,snapshot=[]) {
 const parsed=parseLocal(prompt);
 if(parsed)return {plan:normalizePlan(parsed),provider:'Lokal'};
 if(!engineReady)throw Error('Perintah ini memerlukan Groq. Hubungkan GROQ_API_KEY di .env lalu mulai ulang server.');
 const objects=[...WORLD_OBJECTS.values()].map(o=>({id:o.id,type:o.type,portable:o.portable,owner:o.owner,level:o.level,actions:o.actions}));
 const response=await fetch('/api/plan',{method:'POST',headers:{'Content-Type':'application/json'},
   signal:AbortSignal.timeout(48000),body:JSON.stringify({prompt,context:snapshot,objects})});
 let data;try{data=await response.json();}catch{throw Error('Server tidak memberi JSON yang valid.');}
 if(!response.ok)throw Error(data.error||'Groq tidak tersedia.');
 return {plan:normalizePlan(data.plan),provider:'Groq',usage:data.usage};
}
