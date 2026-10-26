import {STAFF,PLACES} from "./roster.js";
import {createAvatar,animateAvatar} from "./avatars.js";
import {pathfind,isBlocked} from "./office.js";
const chance=(a,b)=>a+Math.random()*(b-a);
const choices={
 "CEO / Owner":[["working",6,25,65],["look",3,3,10],["stretch",1,4,9],["walking",1,8,22]],
 "Office Boy":[["walking",5,8,22],["cleaning",5,15,38],["look",2,4,12],["sitting",1,9,18]],
 "Office Assistant":[["walking",5,8,21],["working",3,20,45],["look",2,4,12],["stretch",1,4,8]],
 "Accountant":[["working",9,24,65],["look",3,3,12],["stretch",1,5,8],["walking",1,6,18]],
 "Customer Support":[["working",9,18,55],["look",3,3,9],["stretch",1,4,8],["walking",1,8,16]],
 "Designer":[["working",8,18,60],["look",3,4,11],["stretch",2,4,9],["walking",2,8,18]],
 "Technician":[["working",4,14,36],["walking",4,10,20],["look",2,4,10],["stretch",1,5,10]]
};
const defaultChoices=[["working",7,16,35],["look",3,3,9],["walking",2,8,20]];
export class OfficeSimulation{
 constructor(scene,emit=()=>{}){
  this.emit=emit;this.people=new Map();this.pending=[];this.active=null;
  for(const profile of STAFF){
   const model=createAvatar(profile);const home=PLACES[profile.home]||[0,0];
   model.root.position.set(home[0],0,home[1]);
   model.root.rotation.y=0;
   scene.add(model.root);
   this.people.set(profile.id,{p:profile,avatar:model,x:home[0],z:home[1],home,route:[],
    mode:profile.role==="Office Boy"?"idle":"working",duration:chance(2,10),last:"",history:[],speed:.82+Math.random()*.22});
  }
 }
 get(id){return this.people.get(id);}
 snapshot(){return [...this.people.values()].map(v=>({id:v.p.id,name:v.p.name,role:v.p.role,mode:v.mode,position:[+v.x.toFixed(1),+v.z.toFixed(1)]}));}
 go(p,goal){
  if(!goal)return false;
  let dest=goal.slice();
  // Stop slightly short of a moving colleague, preventing character overlap.
  if(isBlocked(...dest))for(const shift of [[.8,0],[-.8,0],[0,.8],[0,-.8],[1.5,0],[-1.5,0]])
   if(!isBlocked(dest[0]+shift[0],dest[1]+shift[1])){dest=[dest[0]+shift[0],dest[1]+shift[1]];break;}
  p.route=pathfind([p.x,p.z],dest);
  p.mode="walking";return true;
 }
 dispatch(plan){
  if(!plan.steps.length){this.emit("Perintah tidak dapat dijalankan dengan kemampuan saat ini.");return false;}
  this.pending.push(...plan.steps);this.emit(plan.steps.length+" tindakan masuk antrean");return true;
 }
 runStep(step){
  const actor=this.get(step.actor);if(!actor)return;
  const target=step.target?this.get(step.target):null;
  const loc=step.location?PLACES[step.location]:null;
  this.active={step,actor,elapsed:0,wait:0};
  switch(step.action){
   case "move_to":this.go(actor,target?[target.x+(actor.x<=target.x?-.9:.9),target.z]:loc||actor.home);break;
   case "return_to_desk":this.go(actor,actor.home);break;
   case "follow":this.go(actor,target?[target.x+.75,target.z+.8]:actor.home);break;
   case "meet":this.go(actor,PLACES.meeting);break;
   case "stand":actor.route=[];actor.mode="idle";this.active.wait=.8;break;
   case "sit":actor.route=[];actor.mode="sitting";this.active.wait=.8;break;
   case "talk":actor.mode="talking";this.active.wait=2.4;break;
   case "wave":actor.mode="wave";this.active.wait=2.3;break;
   case "stop":actor.route=[];actor.mode="idle";this.active.wait=.2;break;
  }
  this.emit(step.actor.toUpperCase()+": "+step.action+(target?" → "+target.p.name:step.location?" → "+step.location:""));
 }
 chooseIdle(p){
  if(p.route.length)return;
  const list=choices[p.p.role]||defaultChoices;
  const weighted=list.map(([mode,weight,a,b])=>({mode,weight:weight*(p.last===mode?.08:1),a,b}));
  let roll=Math.random()*weighted.reduce((s,x)=>s+x.weight,0);
  const selected=weighted.find(x=>(roll-=x.weight)<=0)||weighted[0];
  p.last=selected.mode;p.duration=chance(selected.a,selected.b);
  if(selected.mode==="walking"){
   const candidates=[PLACES[p.p.home],PLACES.lounge,PLACES.lobby,PLACES.pantry,PLACES.meeting];
   const dest=candidates[Math.floor(Math.random()*candidates.length)];
   const offset=[chance(-1,1),chance(-.65,.65)];
   this.go(p,[dest[0]+offset[0],dest[1]+offset[1]]);
  } else if(selected.mode==="cleaning") {p.mode="working";p.duration=chance(12,24);}
  else p.mode=selected.mode;
 }
 update(dt,time){
  const frame=Math.min(.05,dt);
  if(!this.active&&this.pending.length)this.runStep(this.pending.shift());
  for(const p of this.people.values()){
   const a=p.avatar;
   if(p.route.length){
    const [tx,tz]=p.route[0],dx=tx-p.x,dz=tz-p.z,dist=Math.hypot(dx,dz);
    if(dist<.12){p.route.shift();}
    else {
     const speed= Math.min(dist,frame*p.speed*1.9);
     p.x+=dx/dist*speed;p.z+=dz/dist*speed;
     const angle=Math.atan2(dx,dz),diff=Math.atan2(Math.sin(angle-a.root.rotation.y),Math.cos(angle-a.root.rotation.y));
     a.root.rotation.y+=diff*Math.min(1,frame*9);
    }
    p.mode="walking";
   } else if((!this.active||this.active.actor!==p)&& p.duration<=0){this.chooseIdle(p);}
   if(p!==this.active?.actor)p.duration-=frame;
   a.root.position.x=p.x;a.root.position.z=p.z;
   animateAvatar(a,frame,p.mode,p.speed);
  }
  if(this.active){
   const t=this.active;t.elapsed+=frame;
   const shouldWalk=["move_to","return_to_desk","follow","meet"].includes(t.step.action);
   if((shouldWalk&&!t.actor.route.length)||(!shouldWalk&&t.elapsed>=t.wait)){
    this.emit(t.actor.p.name+" menyelesaikan "+t.step.action);
    if(shouldWalk)t.actor.mode="idle";
    t.actor.duration=chance(5,14);this.active=null;
   }
  }
 }
}
