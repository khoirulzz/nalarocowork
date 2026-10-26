import {STAFF, PLACES, staffByName} from './roster.js';

export const ACTIONS = ['move_to','stand','sit','talk','follow','wave','return_to_desk','stop','meet',
  'take_object','place_object','make_coffee','clean_area','clean_object','use_object','push_up','climb_object','animate'];
export const POSES = ['idle','reach','bend','kneel','squat','push_up','point','nod','wave','stretch','wipe',
  'inspect','drink','type','read','phone','celebrate','balance'];
export const MAX_STEPS = 16;
const fields = ['actor','action','target','location','objectId','duration','motion'];
export const makeStep = (actor,action,target=null,location=null,objectId=null,duration=null,motion=null) =>
  ({actor,action,target,location,objectId,duration,motion});
const isRecord = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const exactKeys = (x, keys) => Object.keys(x).every(k => keys.includes(k));
const fail = text => { throw new Error(text); };

export function validatePlan(raw, resolveObject, {strict=false}={}) {
  if(!isRecord(raw) || !exactKeys(raw,['steps']) || !Array.isArray(raw.steps) || raw.steps.length > MAX_STEPS)
    fail('Rencana harus berisi daftar steps, maksimal 16 aksi.');
  return {steps:raw.steps.map((s,index) => {
    const at = `Aksi ${index+1}: `;
    if(!isRecord(s) || !exactKeys(s,fields) || (strict && fields.some(k=>!(k in s)))) fail(at+'struktur tidak sesuai.');
    const actor=staffByName(s.actor), target=s.target == null ? null : staffByName(s.target);
    if(!actor || !ACTIONS.includes(s.action)) fail(at+'karyawan atau aksi tidak dikenal.');
    if(s.target != null && !target) fail(at+'target karyawan tidak dikenal.');
    if(target?.id === actor.id) fail(at+'target harus karyawan lain.');
    if(s.location != null && !Object.hasOwn(PLACES,s.location)) fail(at+'lokasi tidak dikenal.');
    const obj=s.objectId == null ? null : resolveObject(s.objectId);
    if(s.objectId != null && !obj) fail(at+'objek tidak ditemukan.');
    if(['take_object','use_object','clean_object','climb_object'].includes(s.action) && !obj) fail(at+'sebutkan objek.');
    if(s.action==='take_object' && !obj.portable) fail(at+'objek ini tidak bisa diambil.');
    if(s.action==='climb_object' && !obj.actions.includes('climb')) fail(at+'objek ini tidak bisa dinaiki.');
    if(['move_to','follow'].includes(s.action) && !target && !s.location && !obj) fail(at+'tujuan belum disebutkan.');
    if(s.action==='follow' && !target) fail(at+'karyawan yang diikuti belum disebutkan.');
    if(s.action==='place_object' && !target && !s.location && !obj) fail(at+'tujuan barang belum disebutkan.');
    const duration=s.duration ?? null;
    if(duration !== null && (!Number.isFinite(duration)||duration<.5||duration>45)) fail(at+'durasi harus 0,5–45 detik.');
    const motion=s.motion ?? null;
    if(s.action==='animate') {
      if(!Array.isArray(motion)||!motion.length||motion.length>6) fail(at+'gerakan harus berisi 1–6 pose.');
      let total=0;
      for(const clip of motion) {
        if(!isRecord(clip)||!exactKeys(clip,['pose','seconds','repeat'])||!POSES.includes(clip.pose)||
          !Number.isFinite(clip.seconds)||clip.seconds<.3||clip.seconds>8||!Number.isInteger(clip.repeat)||clip.repeat<1||clip.repeat>8)
          fail(at+'pose, durasi, atau pengulangan tidak valid.');
        total+=clip.seconds*clip.repeat;
      }
      if(total>45) fail(at+'rangkaian gerakan maksimal 45 detik.');
    } else if(motion !== null) fail(at+'motion hanya dipakai oleh aksi animate.');
    return makeStep(actor.id,s.action,target?.id||null,s.location||null,obj?.id||null,duration,motion);
  })};
}

export function createPlanSchema(objectIds=[]) {
  const nullableEnum=values=>({type:['string','null'],enum:[null,...values]});
  return {type:'object',additionalProperties:false,required:['steps'],properties:{steps:{type:'array',maxItems:MAX_STEPS,
    items:{type:'object',additionalProperties:false,required:fields,properties:{
      actor:{type:'string',enum:STAFF.map(p=>p.id)}, action:{type:'string',enum:ACTIONS},
      target:nullableEnum(STAFF.map(p=>p.id)), location:nullableEnum(Object.keys(PLACES)), objectId:nullableEnum(objectIds),
      duration:{type:['number','null'],minimum:.5,maximum:45},
      motion:{type:['array','null'],minItems:1,maxItems:6,items:{type:'object',additionalProperties:false,
        required:['pose','seconds','repeat'],properties:{pose:{type:'string',enum:POSES},
          seconds:{type:'number',minimum:.3,maximum:8},repeat:{type:'integer',minimum:1,maximum:8}}}}
    }}}}};
}
