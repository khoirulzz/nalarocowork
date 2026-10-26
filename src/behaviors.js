import * as THREE from "three";
import {STAFF,PLACES} from "./roster.js";
import {createAvatar,animateAvatar} from "./avatars.js";
import {pathfind,isBlocked,getObject,WORLD_OBJECTS} from "./office.js";
const between=(a,b)=>a+Math.random()*(b-a);
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const SEATS={owner:[-12,-7.28],finance:[-12,.14],technical:[-3,-7.29],creative:[-12,7.99],
 operations:[1,-2.56],supportA:[3.6,3.67],supportB:[6.6,3.67]};
const WORK={
 "CEO / Owner":[["typing",10,35,90],["reading",4,15,35],["thinking",3,7,17],["phone",1,9,20],["stretch",.5,4,9]],
 "Accountant":[["typing",12,40,105],["filing",4,14,38],["reading",5,16,42],["phone",1,8,17],["stretch",.5,4,8]],
 "Customer Support":[["typing",12,32,88],["phone",5,12,40],["reading",3,9,21],["thinking",1,5,13]],
 "Designer":[["designing",13,34,92],["reading",4,9,24],["thinking",5,8,19],["stretch",1,6,9]],
 "Technician":[["typing",8,20,55],["inspecting",5,11,29],["reading",3,8,18],["stretch",1,5,11]],
 "Office Assistant":[["typing",7,18,48],["reading",3,6,18],["phone",2,6,18],["thinking",2,5,15]],
 "Office Boy":[["cleaning",12,18,48],["wiping",6,15,36],["carrying",2,10,23],["rest",1,7,18]]
};
const ZONES={
 owner:[[-14.8,-5.7],[-10.5,-5.2]],finance:[[-14.6,2.4],[-10.8,2.75]],
 creative:[[-14.3,9],[-9.7,8.4]],technical:[[-4.3,-5.5],[-1.2,-5.5]],
 supportA:[[3,5.3],[5.4,5.6]],supportB:[[7.6,5.7],[8.5,2.5]],
 operations:[[-.3,-1],[2.8,-1]],pantry:[[12.2,7.2],[14.8,7.1]],
 meeting:[[9.8,-4.9],[14.4,-5.0]],hall:[[-1.4,1.0],[1.2,1.1]],lobby:[[-1,8.8],[1,8.8]]
};
const OB_ROUTE=["supportA","finance","meeting","owner","operations","creative","technical","hall","pantry","lobby"];
const chooseWeighted=(items,previous)=>{
 const weights=items.map(([name,weight,low,high])=>({name,weight:name===previous?weight*.12:weight,low,high}));
 let roll=Math.random()*weights.reduce((n,x)=>n+x.weight,0);
 return weights.find(item=>(roll-=item.weight)<0)||weights[0];
};
export class OfficeSimulation {
 constructor(scene,report=()=>{}){
  this.report=report;this.staff=new Map();this.people=this.staff;this.steps=[];this.active=null;
  this.clock=0;this.obRound=0;
  for(const profile of STAFF){
   const avatar=createAvatar(profile),home=SEATS[profile.home]||PLACES[profile.home];
   const [x,z]=home;avatar.root.position.set(x,0,z);
   scene.add(avatar.root);
   const isOB=profile.role==="Office Boy",mode=isOB?"rest":"typing";
   avatar.root.rotation.y=isOB?0:Math.PI;
   const data={p:profile,avatar,x,z,home:home.slice(),route:[],destination:null,mode,
    previous:mode,duration:between(10,26),speed:between(1.05,1.25),holding:null,handMesh:null,wait:0,blockedFor:0,
    idleCycle:isOB && profile.id==="ulin"?5:0,cleanCycle:0};
   this.staff.set(profile.id,data);
  }
 }
 get(id){return this.staff.get(id);}
 snapshot(){return [...this.staff.values()].map(a=>({id:a.p.id,name:a.p.name,role:a.p.role,mode:a.mode,x:+a.x.toFixed(1),z:+a.z.toFixed(1),holding:a.holding}));}
 pointNear(point,actor,spread=.75){
  const offsets=[[spread,0],[-spread,0],[0,spread],[0,-spread],[spread*.7,spread*.7],[-spread*.7,spread*.7]];
  const crowded=this.nearby(actor).map(p=>({x:p.x,z:p.z,radius:.7}));
  const candidates=[...offsets.map(([x,z])=>[point[0]+x,point[1]+z]),point];
  return candidates.filter(pt=>!isBlocked(...pt,crowded)).sort((a,b)=>distance([actor.x,actor.z],a)-distance([actor.x,actor.z],b))[0]||null;
 }
 nearby(except){return [...this.staff.values()].filter(a=>a!==except);}
 go(p,to,{near=.7,avoidStaff=true}={}){
  if(!to)return false;
  const target=near>0?this.pointNear(to,p,near):to;
  if(!target)return false;
  const obstacles=avoidStaff?this.nearby(p).filter(a=>distance([a.x,a.z],target)>1.2)
    .map(a=>({x:a.x,z:a.z,radius:.48})):[];
  const route=pathfind([p.x,p.z],target,obstacles);
  if(!route.length && distance([p.x,p.z],target)>.2)return false;
  p.route=route;p.destination=target;p.mode="walking";p.wait=0;
  return true;
 }
 dispatch(plan){
  if(!plan.steps.length){this.report("Tidak ada aksi yang dapat dilakukan.");return false;}
  // Commands interrupt wandering, but don't teleport characters.
  this.steps.push(...plan.steps);
  this.report(plan.steps.length+" aksi diterima");
  return true;
 }
 logAction(s){this.report(s);}
 setHeld(p,obj){
  if(p.holding)return false;
  if(obj.owner && obj.owner!==p.p.id)return false;
  obj.owner=p.p.id;obj.mesh.visible=false;
  p.holding=obj.id;
  const geom=new THREE.BoxGeometry(.20,.18,.18);
  const proxy=new THREE.Mesh(geom,new THREE.MeshLambertMaterial({color:obj.type==="cup"?"#ece5d9":"#cba782"}));
  proxy.position.set(0,-.62,.20);p.avatar.arms.right.add(proxy);p.handMesh=proxy;
  return true;
 }
 dropHeld(p,receiver=null,location=null){
  const obj=getObject(p.holding);if(!obj)return false;
  if(p.handMesh){p.handMesh.parent.remove(p.handMesh);p.handMesh.geometry.dispose();p.handMesh.material.dispose();p.handMesh=null;}
  p.holding=null;
  if(receiver){
   obj.owner=null;
   return this.setHeld(receiver,obj);
  }
  const point=location?PLACES[location]:[p.x,p.z];
  obj.owner=null;
  obj.x=point[0];obj.z=point[1];
  obj.mesh.position.set(point[0],obj.type==="broom"?.56:.15,point[1]);obj.mesh.visible=true;
  return true;
 }
 begin(step){
  const p=this.get(step.actor),target=step.target?this.get(step.target):null,obj=step.objectId?getObject(step.objectId):null;
  if(!p){this.report("Karyawan tidak ditemukan.");return;}
  p.route=[];p.destination=null;
  this.active={step,p,target,obj,stage:"action",time:0,duration:0};
  const act=this.active;
  let place=null;
  switch(step.action){
   case "move_to":case "follow":
    place=target?[target.x,target.z]:PLACES[step.location];break;
   case "return_to_desk":place=p.home;break;
   case "meet":place=PLACES.meeting;break;
   case "take_object":case "use_object":place=obj?.interaction;break;
   case "make_coffee":place=getObject("coffee_machine")?.interaction;break;
   case "clean_area":place=PLACES[step.location||"hall"];break;
   case "place_object":place=target?[target.x,target.z]:step.location?PLACES[step.location]:null;break;
  }
  if(place){
   const close=distance([p.x,p.z],place)<(target?1.2:.8);
   if(!close&&!this.go(p,place,{near:target?1.05:0})){
    this.report(p.p.name+" tidak menemukan rute aman.");
    this.active=null;return;
   }
   if(!close){act.stage="moving";this.report(p.p.name+" bergerak.");return;}
  }
  this.perform(act);
 }
 perform(job){
  const {step,p,target,obj}=job;
  job.stage="doing";job.time=0;job.duration=1.2;
  switch(step.action){
   case "stand":
    if(distance([p.x,p.z],p.home)<.45){
     if(this.go(p,[p.home[0]+.82,p.home[1]+.35],{near:0})){job.stage="moving";return;}
    }
    p.mode="idle";p.duration=between(20,40);break;
   case "sit":
    if(distance([p.x,p.z],p.home)>1.2){
     if(this.go(p,p.home,{near:0})){job.stage="moving";return;}
    }
    p.mode="typing";p.duration=between(30,70);break;
   case "talk":p.mode="talking";job.duration=3.5;break;
   case "wave":p.mode="wave";job.duration=2.3;break;
   case "stop":p.route=[];p.mode="idle";break;
   case "move_to":case "return_to_desk":case "follow":case "meet":
    p.mode="idle";p.duration=between(12,27);break;
   case "make_coffee":{
    const machine=getObject("coffee_machine");
    const cup=[...WORLD_OBJECTS.values()].find(o=>o.type==="cup"&&!o.owner&&Math.hypot(o.x-machine.x,o.z-machine.z)<2);
    if(!cup||p.holding){this.report("Perlu gelas kosong atau tangan yang bebas.");job.duration=0;break;}
    p.mode="making_coffee";job.duration=5;
    job.onDone=()=>{this.setHeld(p,cup);this.report(p.p.name+" selesai membuat kopi.");};
    break;
   }
   case "take_object":{
    if(!obj?.portable||p.holding||obj.owner){this.report("Benda tidak dapat diambil.");job.duration=0;break;}
    p.mode="reaching";job.duration=1.7;
    job.onDone=()=>{this.setHeld(p,obj);this.report(p.p.name+" mengambil "+obj.id);};
    break;
   }
   case "place_object":{
    if(!p.holding){this.report("Tidak ada benda di tangan "+p.p.name+".");job.duration=0;break;}
    if(target?.holding){this.report(target.p.name+" sedang membawa benda lain.");job.duration=0;break;}
    p.mode="reaching";job.duration=1.7;
    job.onDone=()=>{this.dropHeld(p,target,step.location);this.report(p.p.name+" menyerahkan atau meletakkan barang.");};
    break;
   }
   case "clean_area":p.mode="cleaning";job.duration=between(9,20);break;
   case "use_object":
    if(!obj){job.duration=0;break;}p.mode="inspecting";job.duration=between(3,7);break;
  }
 }
 finish(){
  const a=this.active;if(!a)return;
  a.onDone?.();this.report(a.p.p.name+" · "+a.step.action+" selesai");
  if(["talk","wave","reaching","making_coffee","inspecting"].includes(a.p.mode))a.p.mode="idle";
  a.p.duration=between(8,19);this.active=null;
 }
 freeRoamPoint(p){
  const zones=p.p.role==="Office Boy"?OB_ROUTE:[p.p.home,"hall",p.p.home,"lounge"];
  const zone=zones[p.idleCycle++%zones.length];
  // Idle travel never uses a target employee's current position.
  const points=ZONES[zone]||[PLACES[zone]];const pt=points[p.idleCycle%points.length];
  if(!pt)return null;
  if(this.nearby(p).some(other=>distance([other.x,other.z],pt)<1.3))return null;
  return pt;
 }
 chooseIdle(p){
  const isOB=p.p.role==="Office Boy";
  if(!isOB && distance([p.x,p.z],p.home)>1.3 && Math.random()<.85){
   if(this.go(p,p.home,{near:0,avoidStaff:true})){p.duration=between(7,20);return;}
  }
  const selected=chooseWeighted(WORK[p.p.role]||WORK["Office Assistant"],p.previous);
  p.previous=selected.name;p.duration=between(selected.low,selected.high);
  if(isOB){
   const place=this.freeRoamPoint(p);
   if(place&&this.go(p,place,{near:0,avoidStaff:true})){
    p.afterWalk=selected.name==="carrying"?"carrying":selected.name==="wiping"?"wiping":"cleaning";
    p.duration=between(18,45);
   }else{p.mode="cleaning";p.duration=between(18,32);}
   return;
  }
  if(Math.random()<(p.p.wander||0)){
   const dest=this.freeRoamPoint(p);
   if(dest&&this.go(p,dest,{near:0})){p.afterWalk="look";return;}
  }
  p.mode=selected.name;
 }
 update(dt){
  const frame=Math.min(dt,.05);this.clock+=frame;
  if(!this.active && this.steps.length)this.begin(this.steps.shift());
  for(const p of this.staff.values()){
   if(p.route.length){
    const [tx,tz]=p.route[0],dx=tx-p.x,dz=tz-p.z,len=Math.hypot(dx,dz);
    if(len<.10){p.route.shift();p.blockedFor=0;}
    else{
     const stride=Math.min(len,frame*p.speed*1.55);
     const nx=p.x+dx/len*stride,nz=p.z+dz/len*stride;
     const dynamic=this.nearby(p).map(other=>({x:other.x,z:other.z,radius:.51}));
     if(!isBlocked(nx,nz,dynamic)){
      p.x=nx;p.z=nz;p.blockedFor=0;
      const heading=Math.atan2(dx,dz),yaw=p.avatar.root.rotation.y;
      p.avatar.root.rotation.y+=Math.atan2(Math.sin(heading-yaw),Math.cos(heading-yaw))*Math.min(1,frame*8);
     }else{
      p.blockedFor+=frame;
      if(p.blockedFor>.65 && p.destination){
       // Re-plan around other characters. If no path exists, stop instead of clipping through them.
       const updated=pathfind([p.x,p.z],p.destination,dynamic);
       if(updated.length)p.route=updated;
       else if(p.blockedFor>3){p.route=[];p.mode="idle";this.report(p.p.name+" menunggu jalur terbuka.");}
       p.blockedFor=0;
      }
     }
    }
    p.mode="walking";
   }else if(p.mode==="walking"){
    p.mode=p.afterWalk||"idle";p.afterWalk=null;
   }
   if(this.active?.p!==p){
    p.duration-=frame;
    if(p.duration<=0&&!p.route.length)this.chooseIdle(p);
   }
   if(["typing","reading","designing","filing","thinking","phone"].includes(p.mode)&&distance([p.x,p.z],p.home)<1.3){
    const angle=Math.PI,heading=p.avatar.root.rotation.y;
    p.avatar.root.rotation.y+=Math.atan2(Math.sin(angle-heading),Math.cos(angle-heading))*Math.min(1,frame*3);
   }
   p.avatar.root.position.x=p.x;p.avatar.root.position.z=p.z;
   animateAvatar(p.avatar,frame,p.mode,p.speed);
  }
  const job=this.active;
  if(job){
   if(job.stage==="moving"){
    if(!job.p.route.length)this.perform(job);
   }else{
    job.time+=frame;if(job.time>=job.duration)this.finish();
   }
  }
 }
}
