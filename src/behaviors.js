import * as THREE from 'three';
import {STAFF,PLACES} from './roster.js';
import {createAvatar,animateAvatar} from './avatars.js';
import {pathfind,isBlocked,getObject,WORLD_OBJECTS,FLOOR_HEIGHT,STAIRS,PLACE_LEVELS} from './office.js';
import {validatePlan} from './action-contract.js';
const between=(a,b)=>a+Math.random()*(b-a),distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const SEATS={owner:[-12,-7.26],finance:[-12,.24],technical:[-3,-7.21],creative:[-12,8.04],operations:[1,-2.46],supportA:[3.6,3.74],supportB:[6.6,3.74]};
const WORK={
 'CEO / Owner':[['typing',7,18,42],['reading',5,9,26],['thinking',4,6,16],['phone',3,10,23],['stretch',1,4,7]],
 Accountant:[['typing',9,24,55],['filing',6,12,30],['reading',5,14,35],['calculating',4,8,17],['stretch',1,4,8]],
 'Customer Support':[['typing',8,16,36],['phone',8,12,32],['listening',5,6,16],['reading',2,9,22],['stretch',1,4,7]],
 Designer:[['designing',12,20,48],['reading',3,9,22],['thinking',5,8,19],['sketching',7,12,27],['stretch',1,5,9]],
 Technician:[['typing',6,18,37],['inspecting',8,10,24],['reading',3,8,18],['repairing',6,12,27],['stretch',1,5,9]],
 'Office Assistant':[['typing',7,18,36],['reading',5,7,18],['phone',3,7,18],['filing',6,10,22],['stretch',1,4,8]],
 'Office Boy':[['cleaning',10,14,28],['wiping',8,10,24],['rest',2,6,12],['inspecting',2,8,14]]
};
const ZONES={owner:[[-14.5,-5.7],[-10.5,-5.2]],finance:[[-14.3,2.4],[-10.8,2.75]],creative:[[-14.3,9],[-9.7,8.4]],
 technical:[[-4.3,-5.5],[-1.2,-5.5]],supportA:[[3,5.3],[5.4,5.6]],supportB:[[7.3,5.7],[7.4,2.2]],
 operations:[[-.3,-1],[2.8,-1]],pantry:[[12.2,7.2],[14.8,7.1]],hall:[[-1.4,1],[1.2,1.1]],lobby:[[-1,8.8],[1,8.8]],lounge:[[-4.7,3],[-1.3,4.9]]};
const weighted=(items,previous)=>{
 const list=items.map(([name,w,low,high])=>({name,w:name===previous?w*.05:w,low,high}));
 let roll=Math.random()*list.reduce((n,x)=>n+x.w,0);return list.find(x=>(roll-=x.w)<0)||list[0];
};
const clipMode={idle:'idle',reach:'reaching',bend:'bending',kneel:'kneeling',squat:'squatting',push_up:'push_up',point:'pointing',nod:'nodding',wave:'wave',stretch:'stretch',wipe:'wiping',inspect:'inspecting',drink:'drinking',type:'typing',read:'reading',phone:'phone',celebrate:'celebrating',balance:'balancing'};
export class OfficeSimulation {
 constructor(scene,report=()=>{}) {
  this.report=report;this.staff=new Map();this.people=this.staff;this.steps=[];this.active=null;this.clock=0;this.nextBatch=0;
  this.paused=false;this.reservations=new Map();this.completed=0;this.lastResult=null;
  for(const p of STAFF) {
   const avatar=createAvatar(p),home=(SEATS[p.home]||PLACES[p.home]).slice(),isOB=p.role==='Office Boy';
   avatar.root.position.set(home[0],0,home[1]);avatar.root.rotation.y=isOB?0:Math.PI;scene.add(avatar.root);
   const selected=weighted(WORK[p.role],null);
   this.staff.set(p.id,{p,avatar,home,x:home[0],z:home[1],level:0,elevation:0,perch:0,route:[],destination:null,
    mode:isOB?'rest':selected.name,previous:selected.name,duration:between(2,selected.high),speed:between(1.05,1.35),
    holding:null,handMesh:null,blockedFor:0,idleCycle:Math.floor(Math.random()*10),walkAfter:null,followTarget:null});
  }
 }
 get(id){return this.staff.get(id);}
 snapshot(){return [...this.staff.values()].map(a=>({id:a.p.id,role:a.p.role,mode:a.mode,x:+a.x.toFixed(1),z:+a.z.toFixed(1),level:a.level,holding:a.holding}));}
 nearby(p,level=p.level){return [...this.staff.values()].filter(a=>a!==p&&a.level===level);}
 pointNear(point,p,spread=.85,level=p.level) {
  const offsets=[[spread,0],[-spread,0],[0,spread],[0,-spread],[spread,spread],[-spread,spread],[0,0]];
  return offsets.map(([x,z])=>[point[0]+x,point[1]+z]).filter(pt=>!isBlocked(...pt,[],level)&&
   this.nearby(p,level).every(a=>distance([a.x,a.z],pt)>.85)).sort((a,b)=>distance([p.x,p.z],a)-distance([p.x,p.z],b))[0]||null;
 }
 go(p,to,{near=0,level=p.level}={}) {
  const target=near?this.pointNear(to,p,near,level):to;if(!target)return false;
  const wrap=(route,l)=>route.map(point=>({point,level:l}));
  let route=[];
  if(level!==p.level) {
   const start=p.level===0?STAIRS.lower:STAIRS.upper,end=level===0?STAIRS.lower:STAIRS.upper;
   const first=pathfind([p.x,p.z],start,[],p.level),last=pathfind(end,target,[],level);
   if((!first.length&&distance([p.x,p.z],start)>.2)||(!last.length&&distance(end,target)>.2))return false;
   route=wrap(first,p.level);
   for(let i=1;i<=28;i++) {
    const t=i/28;route.push({point:[start[0]+(end[0]-start[0])*t,start[1]+(end[1]-start[1])*t],
     elevation:(p.level+(level-p.level)*t)*FLOOR_HEIGHT,level:i===28?level:p.level,stairs:true});
   }
   route.push(...wrap(last,level));
  } else {
   const obstacles=this.nearby(p).filter(a=>distance([a.x,a.z],target)>1.1).map(a=>({x:a.x,z:a.z,radius:.45}));
   const nodes=pathfind([p.x,p.z],target,obstacles,level);
   if(!nodes.length&&distance([p.x,p.z],target)>.2)return false;route=wrap(nodes,level);
  }
  p.route=route;p.destination={point:target,level};p.mode='walking';p.blockedFor=0;p.lastProgress=this.clock;p.perch=0;return true;
 }
 dispatch(raw) {
  const plan=validatePlan(raw,getObject);if(!plan.steps.length)return false;
  if(this.steps.length+plan.steps.length>64)throw Error('Antrean penuh. Tunggu beberapa aksi selesai.');
  for(const step of plan.steps.filter(s=>s.action==='stop')){if(this.active?.p.p.id===step.actor)this.fail('Perintah dihentikan oleh owner.');const actor=this.get(step.actor);actor.route=[];actor.destination=null;actor.followTarget=null;}
  const batch=++this.nextBatch;this.steps.push(...plan.steps.map(s=>({...s,batch})));
  for(const s of plan.steps){const p=this.get(s.actor);p.followTarget=null;}
  this.report(plan.steps.length+' aksi masuk antrean.');return true;
 }
 setHeld(p,obj) {
  if(p.holding||!obj.portable||obj.owner)return false;
  obj.owner=p.p.id;obj.mesh.visible=false;p.holding=obj.id;
  const proxy=new THREE.Mesh(new THREE.BoxGeometry(...(obj.type==='cup'?[.2,.2,.2]:[.26,.1,.25])),
   new THREE.MeshStandardMaterial({color:obj.type==='cup'?'#e8ddc5':'#c3a87a',roughness:.8}));
  proxy.position.set(0,-.64,.2);p.avatar.arms.right.add(proxy);p.handMesh=proxy;return true;
 }
 dropHeld(p,receiver=null,location=null,surface=null) {
  const obj=getObject(p.holding);if(!obj||receiver?.holding)return false;
  if(p.handMesh){p.handMesh.removeFromParent();p.handMesh.geometry.dispose();p.handMesh.material.dispose();p.handMesh=null;}
  p.holding=null;obj.owner=null;
  if(receiver)return this.setHeld(receiver,obj);
  const point=surface?[surface.x,surface.z]:(location?PLACES[location]:[p.x,p.z]);
  obj.x=point[0];obj.z=point[1];obj.level=surface?.level??(location?PLACE_LEVELS[location]||0:p.level);
  obj.y=surface?surface.surface+obj.mesh.scale.y/2+obj.level*FLOOR_HEIGHT:.14+obj.level*FLOOR_HEIGHT;
  obj.interaction=surface?.interaction.slice()||point.slice();obj.mesh.position.set(obj.x,obj.y,obj.z);obj.mesh.visible=true;return true;
 }
 fail(message) {
  const job=this.active;if(!job)return;
  this.steps=this.steps.filter(s=>s.batch!==job.step.batch);
  this.report(message+' Sisa rangkaian dibatalkan.');job.p.route=[];job.p.mode='idle';job.p.duration=8;
  this.lastResult={ok:false,batch:job.step.batch,error:message};this.active=null;
 }
 begin(step) {
  const p=this.get(step.actor),target=step.target?this.get(step.target):null,obj=getObject(step.objectId);
  if(p.perch>0&&!['stand','animate','wave','talk','stop'].includes(step.action)){
   this.steps.unshift(step);return this.begin({...step,action:'stand',target:null,location:null,objectId:null,internal:true});
  }
  p.route=[];p.destination=null;p.followTarget=null;p.walkAfter=null;
  const job=this.active={step,p,target,obj,stage:'doing',time:0,duration:1};
  let point=null,level=p.level,near=0;
  if(['move_to','follow','place_object','talk'].includes(step.action)) {
   if(target){point=[target.x,target.z];level=target.level;near=1.05;}
   else if(obj){point=obj.interaction;level=obj.level;}
   else if(step.location){point=PLACES[step.location];level=PLACE_LEVELS[step.location]||0;}
  }
  if(step.action==='return_to_desk'){point=p.home;level=0;}
  if(step.action==='meet'){point=PLACES.meeting;level=1;}
  if(['take_object','use_object','clean_object','climb_object'].includes(step.action)) {
   if(obj.owner&&obj.owner!==p.p.id)return this.fail('Objek sedang dipegang '+obj.owner+'.');
   if(!obj.owner){point=obj.interaction;level=obj.level;}
  }
  if(step.action==='make_coffee'){const m=getObject('coffee_machine');point=m.interaction;level=m.level;}
  if(step.action==='clean_area'){point=PLACES[step.location||'hall'];level=PLACE_LEVELS[step.location]||0;}
  if(step.action==='sit'){const seat=obj||getObject('chair_'+p.p.home);if(!seat?.seat)return this.fail('Kursi belum dipilih.');point=seat.seat;level=seat.level;job.obj=seat;}
  if(point&&(level!==p.level||distance([p.x,p.z],point)>(near?1.25:.18))) {
   if(!this.go(p,point,{near,level}))return this.fail(p.p.name+' tidak menemukan rute ke tujuan.');
   job.stage='moving';job.goal={point,level,near};return;
  }
  this.perform(job);
 }
 face(p,point) {p.facing=Math.atan2(point[0]-p.x,point[1]-p.z);}
 perform(job) {
  if(this.active!==job)return;
  const {step,p,target,obj}=job;job.stage='doing';job.time=0;job.duration=step.duration||1.2;
  if(target)this.face(p,[target.x,target.z]);else if(obj)this.face(p,[obj.x,obj.z]);
  switch(step.action) {
   case 'stand':
    if(p.perch){job.duration=1.6;job.descendStart=[p.x,p.z,p.perch];job.descendEnd=getObject(p.perchedOn)?.interaction||[p.x,p.z+.9];p.mode='climbing';job.onDone=()=>{p.perch=0;p.perchedOn=null;p.mode='idle';return true;};}
    else p.mode='idle';break;
   case 'sit':p.mode='seated';p.perch=0;break;
   case 'talk':p.mode='talking';job.duration=step.duration||2.4;break;
   case 'wave':p.mode='wave';job.duration=step.duration||2.5;break;
   case 'stop':p.mode='idle';break;
   case 'move_to':case 'return_to_desk':case 'meet':p.mode='idle';break;
   case 'follow':p.mode='idle';p.followTarget=target.p.id;p.followUntil=this.clock+(step.duration||35);break;
   case 'make_coffee': {
    const held=getObject(p.holding),cup=held?.type==='cup'&&!held.filled?held:[...WORLD_OBJECTS.values()].find(o=>o.type==='cup'&&!o.owner&&!o.filled&&o.level===0&&distance([o.x,o.z],[13.4,9.27])<2.8);
    if(!cup||(p.holding&&p.holding!==cup.id))return this.fail('Perlu cangkir kosong di pantry dan tangan yang bebas.');
    p.mode='making_coffee';job.duration=5.5;this.face(p,[13.4,9.27]);
    job.onDone=()=>{cup.filled=true;return p.holding===cup.id||this.setHeld(p,cup);};break;
   }
   case 'take_object':
    if(!obj?.portable||obj.owner||p.holding)return this.fail('Barang tidak tersedia atau tangan sedang penuh.');
    p.mode='reaching';job.duration=1.8;job.onDone=()=>this.setHeld(p,obj);break;
   case 'place_object':
    if(!p.holding||target?.holding)return this.fail(!p.holding?'Tidak ada barang yang dibawa.':'Tangan penerima sedang penuh.');
    if(obj&&!obj.actions.includes('place'))return this.fail('Barang tidak dapat diletakkan pada objek itu.');
    p.mode='reaching';job.duration=1.8;job.onDone=()=>this.dropHeld(p,target,step.location,obj);break;
   case 'clean_area':p.mode='cleaning';job.duration=step.duration||12;break;
   case 'clean_object':p.mode='wiping';job.duration=step.duration||8;break;
   case 'climb_object':
    if(this.nearby(p).some(other=>distance([other.x,other.z],obj.seat)<.8))return this.fail('Kursi sedang dipakai karyawan lain.');
    p.mode='climbing';job.duration=2.6;job.climbStart=[p.x,p.z];job.onDone=()=>{p.x=obj.seat[0];p.z=obj.seat[1];p.perch=obj.surface;p.perchedOn=obj.id;p.mode='balancing';return true;};break;
   case 'push_up': {
    // Floor exercise uses open floor so the body cannot intersect a desk or chair.
    if(!this.exerciseSpace(p,[p.x,p.z])) {
     const candidates=[[p.x,p.z+2.7],[p.x+2.7,p.z],[p.x-2.7,p.z],PLACES.hall];
     const point=candidates.find(pt=>this.exerciseSpace(p,pt));
     if(!point||!this.go(p,point))return this.fail('Tidak ada ruang untuk push up.');
     job.stage='moving';return;
    }
    p.mode='push_up';p.facing=0;job.duration=step.duration||8;break;
   }
   case 'use_object':
    p.mode=['cup','water_dispenser'].includes(obj.type)?'drinking':obj.type==='monitor'?'typing':'inspecting';job.duration=step.duration||5;
    if(obj.type==='cup'){if(!obj.filled)return this.fail('Cangkir belum berisi kopi.');if(!p.holding&&!this.setHeld(p,obj))return this.fail('Tangan sedang penuh.');job.onDone=()=>{obj.filled=false;return true;};}
    break;
   case 'animate':p.mode=clipMode[step.motion[0].pose];job.duration=step.motion.reduce((n,c)=>n+c.seconds*c.repeat,0);break;
  }
 }
 finish() {
  const job=this.active;if(!job)return;
  if(job.onDone&&job.onDone()===false)return this.fail('Dunia berubah sebelum aksi selesai.');
  const done={move_to:'tiba di tujuan',stand:'berdiri',sit:'duduk',talk:'selesai berbicara',follow:'mulai mengikuti',wave:'selesai melambai',return_to_desk:'kembali ke meja',stop:'berhenti',meet:'tiba di ruang rapat',take_object:'mengambil barang',place_object:'mengantar barang',make_coffee:'selesai membuat kopi',clean_area:'selesai membersihkan area',clean_object:'selesai membersihkan objek',use_object:'selesai menggunakan objek',push_up:'selesai push up',climb_object:'berdiri di kursi',animate:'selesai melakukan gerakan'};
  this.report(job.p.p.name+' '+done[job.step.action]+'.');
  if(!['sit','climb_object'].includes(job.step.action))job.p.mode=job.p.perch?'balancing':'idle';
  job.p.duration=between(8,20);if(!job.step.internal)this.completed++;this.lastResult={ok:true,batch:job.step.batch,action:job.step.action};this.active=null;
 }
 exerciseSpace(p,point){
  const samples=[];
  for(const x of [-.65,0,.65])for(const z of [0,.6,1.2,1.8,2.4,2.9])samples.push([point[0]+x,point[1]+z]);
  const seats=[...WORLD_OBJECTS.values()].filter(o=>o.type==='chair'&&o.level===p.level);
  return samples.every(([x,z])=>!isBlocked(x,z,[],p.level)&&seats.every(o=>Math.hypot(x-o.x,z-o.z)>.65))&&
   this.nearby(p).every(other=>samples.every(pt=>distance([other.x,other.z],pt)>1));
 }
 freeRoamPoint(p) {
  const zones=p.p.role==='Office Boy'?['supportA','finance','owner','operations','creative','technical','hall','pantry','lobby']:[p.p.home,'hall','lounge',p.p.home];
  const zone=zones[Math.floor(Math.random()*zones.length)],points=ZONES[zone]||[PLACES[zone]],point=points[Math.floor(Math.random()*points.length)];
  if(!point||this.nearby(p,0).some(a=>distance([a.x,a.z],point)<1.4||a.destination&&distance(a.destination.point,point)<1.4))return null;
  for(const [key,value] of this.reservations){if(value.until<this.clock)this.reservations.delete(key);}
  if([...this.reservations.values()].some(r=>r.actor!==p.p.id&&distance(r.point,point)<1.4))return null;
  this.reservations.set(p.p.id,{point,actor:p.p.id,until:this.clock+40});return point;
 }
 chooseIdle(p) {
  const ob=p.p.role==='Office Boy';
  if(p.perch){p.mode='balancing';p.duration=8;return;}
  if(!ob&&(p.level!==0||distance([p.x,p.z],p.home)>1.1)&&Math.random()<.88) {
   if(this.go(p,p.home,{level:0})){p.walkAfter=weighted(WORK[p.p.role],p.previous).name;p.duration=between(15,35);return;}
  }
  const selected=weighted(WORK[p.p.role],p.previous);p.previous=selected.name;p.duration=between(selected.low,selected.high);
  if(ob||Math.random()<(p.p.wander||0)) {
   const point=this.freeRoamPoint(p);
   if(point&&this.go(p,point,{level:0})){p.walkAfter=ob?selected.name:'look';return;}
  }
  p.mode=selected.name;
 }
 update(dt) {
  if(this.paused)return;
  const frame=Math.min(dt,.05);this.clock+=frame;
  if(!this.active&&this.steps.length)this.begin(this.steps.shift());
  const reserved=new Set(this.steps.map(s=>s.actor));if(this.active){reserved.add(this.active.p.p.id);if(this.active.target)reserved.add(this.active.target.p.id);}
  for(const p of this.staff.values()) {
   if(p.followTarget&&!reserved.has(p.p.id)&&!p.route.length) {
    const target=this.get(p.followTarget);
    if(this.clock>p.followUntil)p.followTarget=null;
    else if(target.level!==p.level||distance([p.x,p.z],[target.x,target.z])>2)this.go(p,[target.x,target.z],{near:1.4,level:target.level});
   }
   if(p.route.length) {
    const node=p.route[0],[tx,tz]=node.point,dx=tx-p.x,dz=tz-p.z,len=Math.hypot(dx,dz);
    if(len<.035) {
     p.x=tx;p.z=tz;p.level=node.level;p.elevation=node.elevation??p.level*FLOOR_HEIGHT;p.route.shift();p.blockedFor=0;
     if(!p.route.length){p.destination=null;p.mode=p.walkAfter||'idle';p.walkAfter=null;}
    } else {
     const stride=Math.min(len,frame*p.speed*(node.stairs?.9:1.4)),nx=p.x+dx/len*stride,nz=p.z+dz/len*stride;
     const crowd=this.nearby(p).filter(other=>!other.route[0]?.stairs),collision=crowd.some(other=>{
      const sep=Math.hypot(nx-other.x,nz-other.z),old=Math.hypot(p.x-other.x,p.z-other.z);return sep<.65||(old<.85&&sep<old-.025);
     });
     if((node.stairs||!isBlocked(nx,nz,[],p.level))&&!collision) {
      p.x=nx;p.z=nz;p.blockedFor=0;p.lastProgress=this.clock;
      if(node.stairs)p.elevation+=(node.elevation-p.elevation)*Math.min(1,stride/len);else p.elevation=p.level*FLOOR_HEIGHT;
      this.face(p,[tx,tz]);
     } else {
      p.blockedFor+=frame;
      if(p.blockedFor>1&&!node.stairs&&p.destination?.level===p.level) {
       const dynamic=crowd.map(a=>({x:a.x,z:a.z,radius:.6})),route=pathfind([p.x,p.z],p.destination.point,dynamic,p.level);
       if(route.length){p.route=route.map(point=>({point,level:p.level}));p.blockedFor=0;}
      }
      if(p.blockedFor>7){p.route=[];p.destination=null;p.mode='idle';if(this.active?.p===p)this.fail(p.p.name+' terhalang di jalur.');else p.duration=4;}
     }
     if(p.route.length)p.mode=node.stairs?'stairs':'walking';
    }
   } else if(!reserved.has(p.p.id)&&!p.followTarget) {p.duration-=frame;if(p.duration<=0)this.chooseIdle(p);}
   if(p.route.length&&this.clock-p.lastProgress>6){p.route=[];p.destination=null;p.mode='idle';p.duration=between(2,4);if(this.active?.p===p)this.fail(p.p.name+' menunggu jalur yang terhalang.');}
   if(reserved.has(p.p.id)&&this.active?.p!==p&&p.route.length){p.route=[];p.destination=null;p.mode='idle';}
   if(['typing','reading','designing','filing','thinking','phone','calculating','sketching','listening'].includes(p.mode)&&distance([p.x,p.z],p.home)<1.3&&p.level===0)p.facing=Math.PI;
   if(p.facing!=null){const yaw=p.avatar.root.rotation.y;p.avatar.root.rotation.y+=Math.atan2(Math.sin(p.facing-yaw),Math.cos(p.facing-yaw))*Math.min(1,frame*7);}
   p.avatar.root.position.x=p.x;p.avatar.root.position.z=p.z;
   p.avatar.clipProgress=null;
   if(this.active?.p===p&&this.active.stage==='doing'&&this.active.step.action==='animate'){
    let time=this.active.time;for(const clip of this.active.step.motion){if(time<clip.seconds*clip.repeat){p.mode=clipMode[clip.pose];p.avatar.clipProgress=(time%clip.seconds)/clip.seconds;break;}time-=clip.seconds*clip.repeat;}
   }
   animateAvatar(p.avatar,frame,p.mode,p.speed,{elevation:p.elevation+p.perch,holding:!!p.holding,seated:p.mode==='seated'||(p.p.role!=='Office Boy'&&p.level===0&&distance([p.x,p.z],p.home)<.65&&['typing','reading','designing','filing','thinking','phone','calculating','sketching','listening'].includes(p.mode))});
  }
  const job=this.active;
  if(job) {
   if(job.stage==='moving') {
    if(!job.p.route.length) {
     if(job.goal && (job.p.level!==job.goal.level||distance([job.p.x,job.p.z],job.goal.point)>(job.goal.near?1.65:1.1)))this.fail('Tujuan belum tercapai.');
     else this.perform(job);
    }
   } else {
    job.time+=frame;
    if(job.descendStart){const t=Math.min(1,job.time/job.duration),e=t*t*(3-2*t);job.p.x=job.descendStart[0]+(job.descendEnd[0]-job.descendStart[0])*e;job.p.z=job.descendStart[1]+(job.descendEnd[1]-job.descendStart[1])*e;job.p.perch=job.descendStart[2]*(1-e);}
    if(job.step.action==='climb_object'){const t=Math.min(1,job.time/job.duration),e=t*t*(3-2*t);job.p.perch=job.obj.surface*e;job.p.x=job.climbStart[0]+(job.obj.seat[0]-job.climbStart[0])*e;job.p.z=job.climbStart[1]+(job.obj.seat[1]-job.climbStart[1])*e;}
    if(job.time>=job.duration)this.finish();
   }
  }
 }
}
