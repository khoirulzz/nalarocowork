import * as THREE from "three";
import {mergeGeometries} from "three/addons/utils/BufferGeometryUtils.js";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

const sharedMaterials = new Map();
function mat(c){ if(!sharedMaterials.has(c))sharedMaterials.set(c,new THREE.MeshLambertMaterial({color:c}));return sharedMaterials.get(c);}
function cube(parent, name, size, at, color) {
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(color));
  mesh.position.set(...at);mesh.name=name;mesh.castShadow=false;mesh.receiveShadow=false;parent.add(mesh);return mesh;
}
function rng(seed){let a=seed;return()=>{a=(a*1664525+1013904223)>>>0;return a/4294967296;};}
function tint(color,mult){const c=new THREE.Color(color);c.multiplyScalar(mult);return "#"+c.getHexString();}
function makeHair(head,p) {
 const r=rng(p.id.split("").reduce((n,c)=>n+c.charCodeAt(0),0)), h=p.hair;
 cube(head,"hair crown",[.78,.16,.72],[0,.77,-.01],h);
 cube(head,"hair left",[.10,.22,.62],[-.365,.63,-.02],h);
 cube(head,"hair right",[.10,.22,.62],[.365,.63,-.02],h);
 let rows=2,cols=5;
 if(["curly","curlyfront","wavy","tightcurl","textured"].includes(p.hairStyle))rows=3;
 for(let z=0;z<rows;z++) for(let x=0;x<cols;x++){
  const variation=.80+r()*.42;
  let height=.10;
  if(["curly","curlyfront","tightcurl","wavy"].includes(p.hairStyle))height=.14+r()*.12;
  if(p.hairStyle==="short")height=.05+r()*.035;
  if(p.hairStyle==="quiff" && z===rows-1)height=.18+r()*.12;
  if(p.hairStyle==="swept")height=.10+r()*.12;
  const px=-.29+x*.145+(r()-.5)*.026;
  const pz=-.24+z*.20;
  cube(head,"hair tuft",[.145*variation,height,.20],[px,.845+height*.13,pz],tint(h,.86+r()*.30));
 }
 const fringes={wavy:4,curlyfront:5,fringe:6,swept:5,textured:3,short:1,quiff:2,tightcurl:4,curly:4};
 const n=fringes[p.hairStyle]||4;
 for(let i=0;i<n;i++) {
  const len=p.hairStyle==="fringe"?.19:p.hairStyle==="swept"?.18:.08+r()*.09;
  cube(head,"front fringe",[.65/n+.015,len,.08],[-.33+(i+.5)*.66/n,.73-len*.4,.37],tint(h,.94+r()*.11));
 }
}
function makeFace(head,p){
 let wide=.72;
 if(p.face==="round")wide=.75; if(p.face==="slim"||p.face==="long")wide=.665;
 cube(head,"head",[wide,.69,.67],[0,.38,0],p.skin);
 cube(head,"ear left",[.105,.16,.16],[-wide/2-.048,.37,0],p.skin);
 cube(head,"ear right",[.105,.16,.16],[wide/2+.048,.37,0],p.skin);
 const browY=p.face==="long"?.53:.535, eyeY=p.face==="smile"?.442:.435;
 for(const sign of [-1,1]){
  const x=sign*(p.face==="slim"?.145:.16);
  cube(head,"eye",[.14,.075,.018],[x,eyeY,.346],"#f6f1e8");
  cube(head,"iris",[.060,.07,.02],[x,eyeY,.361],"#25232a");
  cube(head,"eye glint",[.018,.018,.012],[x-.012,eyeY+.025,.374],"#ffffff");
  cube(head,"brow",[.15,p.face==="angular"?.046:.033,.019],[x,browY,.347],p.hair);
 }
 cube(head,"nose",[.067,.062,.038],[0,.316,.358],tint(p.skin,1.07));
 cube(head,"mouth",[p.face==="smile"?.215:.155,.020,.012],[0,.200,.355],p.face==="smile"?"#7b3f36":"#855c50");
 if(p.face==="round")cube(head,"cheek",[.085,.033,.018],[.23,.286,.339],tint(p.skin,1.025));
 makeHair(head,p);
}
function accessory(g,p,arms,torso,head){
 const accent=p.id==="ulum"?"#ff5b2e":tint(p.color,1.35);
 if(p.accessory==="headset"){
  cube(head,"headset band",[.77,.055,.09],[0,.87,-.01],"#3a4550");
  cube(head,"ear cup",[.09,.20,.15],[-.435,.42,0],"#343a43");
  cube(head,"ear cup",[.09,.20,.15],[.435,.42,0],"#343a43");
  cube(head,"mic",[.02,.02,.26],[-.442,.325,.22],"#a3adb8");
 }
 if(p.accessory==="lanyard"){
  cube(torso,"lanyard",[.022,.30,.019],[0,.21,.22],accent);
  cube(torso,"staff card",[.145,.165,.025],[0,.035,.24],"#e5eff4");
  cube(torso,"card N",[.082,.064,.028],[0,.064,.26],accent);
  cube(torso,"blazer left",[.18,.70,.06],[-.25,-.05,.23],"#272b32");
  cube(torso,"blazer right",[.18,.70,.06],[.25,-.05,.23],"#272b32");
 }
 if(p.accessory==="tie"){
  cube(torso,"collar",[.14,.075,.036],[-.075,.31,.22],"#f4f0e8");
  cube(torso,"collar",[.14,.075,.036],[.075,.31,.22],"#f4f0e8");
  cube(torso,"tie",[.045,.29,.027],[0,.13,.246],"#40495a");
 }
 if(p.accessory==="tool"){
  cube(torso,"tool patch",[.14,.10,.027],[.23,.12,.231],"#ebbd5b");
  cube(g,"tool pouch",[.2,.21,.12],[.27,1.05,.21],"#28313a");
 }
 if(p.accessory==="notebook"){
  cube(arms.right,"notebook",[.25,.32,.055],[0,-.61,.21],"#e9d0a1");
  cube(arms.right,"notebook mark",[.022,.28,.06],[.09,-.61,.24],"#e67b4f");
 }
 if(p.accessory==="tablet"){
  cube(arms.left,"tablet",[.32,.34,.052],[0,-.60,.17],"#24333b");
  cube(arms.left,"tablet screen",[.27,.29,.010],[0,-.60,.199],"#a9c5c7");
 }
 if(p.accessory==="broom"){
  cube(arms.right,"broom pole",[.043,1.16,.043],[0,-.93,.18],"#a88160");
  cube(arms.right,"broom brush",[.31,.19,.18],[0,-1.52,.18],"#dbc498");
 }
 if(p.accessory==="tray"){
  cube(arms.left,"tray",[.36,.042,.30],[0,-.77,.23],"#9eaaa8");
  cube(arms.left,"cup",[.11,.16,.11],[0,-.67,.26],"#eeece5");
 }
}
function batchJoint(joint) {
 const buckets=new Map();
 for(const mesh of [...joint.children]) {
  if(!mesh.isMesh||['broom pole','broom brush','tray','cup','phone prop','paper prop','cloth prop'].includes(mesh.name))continue;
  if(!buckets.has(mesh.material))buckets.set(mesh.material,[]);
  mesh.updateMatrix();buckets.get(mesh.material).push(mesh.geometry.clone().applyMatrix4(mesh.matrix));mesh.removeFromParent();mesh.geometry.dispose();
 }
 for(const [material,geos] of buckets){const merged=mergeGeometries(geos);geos.forEach(g=>g.dispose());joint.add(new THREE.Mesh(merged,material));}
}
const shadowTexture=(()=>{
 const size=32,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=(y*size+x)*4,r=Math.hypot((x-size/2)/(size/2),(y-size/2)/(size/2));
  data[i]=data[i+1]=data[i+2]=35;data[i+3]=Math.round(Math.max(0,1-r)**2*95);
 }
 const texture=new THREE.DataTexture(data,size,size);texture.needsUpdate=true;return texture;
})();
export function createAvatar(p) {
 const root=new THREE.Group();root.name=p.name;root.userData.staffId=p.id;
 const rig=new THREE.Group();root.add(rig);
 const torso=new THREE.Group();torso.position.y=1.39;rig.add(torso);
 cube(torso,"shirt",[.68,.78,.40],[0,0,0],p.shirt);
 cube(torso,"hem",[.68,.10,.41],[0,-.37,0],p.shirt);
 cube(torso,"belt",[.70,.07,.42],[0,-.425,0],"#303239");
 cube(torso,"buckle",[.11,.061,.022],[0,-.424,.226],"#9ca4aa");
 cube(torso,"collar left",[.13,.09,.024],[-.13,.33,.218],"#e3e5e3");
 cube(torso,"collar right",[.13,.09,.024],[.13,.33,.218],"#e3e5e3");
 const head=new THREE.Group();head.position.y=1.78;rig.add(head);makeFace(head,p);
 const arms={},legs={},elbows={},knees={};
 for(const [side,sign] of [["left",-1],["right",1]]){
  const arm=new THREE.Group();arm.position.set(sign*.47,1.73,0);rig.add(arm);arms[side]=arm;
  cube(arm,"arm sleeve",[.24,.46,.31],[0,-.24,0],p.shirt);
  const elbow=new THREE.Group();elbow.position.y=-.39;arm.add(elbow);elbows[side]=elbow;
  cube(elbow,"forearm",[.22,.19,.28],[0,-.09,0],p.shirt);
  cube(elbow,"cuff",[.23,.055,.29],[0,-.18,0],tint(p.shirt,1.11));
  cube(elbow,"hand",[.21,.19,.27],[0,-.28,0],p.skin);
  const leg=new THREE.Group();leg.position.set(sign*.18,.98,0);rig.add(leg);legs[side]=leg;
  cube(leg,"thigh",[.285,.4,.35],[0,-.20,0],p.pants);
  const knee=new THREE.Group();knee.position.y=-.4;leg.add(knee);knees[side]=knee;
  cube(knee,"shin",[.27,.34,.33],[0,-.17,0],p.pants);
  cube(knee,"shoe",[.318,.175,.47],[0,-.395,.052],p.id==="ulum"?"#20252b":"#e4e3dc");
  cube(knee,"shoe sole",[.318,.05,.472],[0,-.44,.052],p.id==="ulum"?"#171a1e":"#b8b8b4");
 }
 accessory(rig,p,arms,torso,head);
 const props={};
 props.phone=cube(elbows.right,'phone prop',[.12,.22,.035],[0,-.3,.16],'#27372f');props.phone.visible=false;
 props.paper=cube(elbows.left,'paper prop',[.28,.32,.015],[0,-.32,.17],'#e2dcc9');props.paper.visible=false;
 props.cloth=cube(elbows.right,'cloth prop',[.22,.03,.21],[0,-.4,.04],'#bead7c');props.cloth.visible=false;
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.7,1.7),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));
 shadow.rotation.x=-Math.PI/2;shadow.position.y=.035;root.add(shadow);
 const label=document.createElement("div");label.className="nameplate";
 label.textContent=p.name;label.dataset.employee=p.id;
 const nameplate=new CSS2DObject(label);nameplate.position.set(0,3.06,0);root.add(nameplate);
 const bubble=document.createElement("div");bubble.className="speech";bubble.textContent="";bubble.hidden=true;
 const speech=new CSS2DObject(bubble);speech.position.set(0,3.12,0);root.add(speech);
 for(const joint of [head,torso,...Object.values(arms),...Object.values(legs),...Object.values(elbows),...Object.values(knees)])batchJoint(joint);
 root.traverse(obj=>{if(obj.isMesh)obj.userData.staffId=p.id;});
 return {root,rig,p,head,torso,arms,legs,elbows,knees,shadow,props,label,bubble,animationClock:Math.random()*90,tempo:.85+Math.random()*.3,pose:"idle",height:0};
}
export function animateAvatar(a,dt,mood,speed=1,{elevation=0,holding=false,seated=false}={}) {
 a.animationClock+=dt*a.tempo;
 const cycleRate={push_up:3.5,wave:8,nodding:3.5,squatting:2,celebrating:4,wiping:3,stretch:1.4};
 const t=a.clipProgress==null?a.animationClock:a.clipProgress*Math.PI*2/(cycleRate[mood]||2),walking=mood==='walking'||mood==='stairs';
 const stride=walking?Math.sin(t*(mood==='stairs'?7:7.8)*speed):0;
 const ease=1-Math.exp(-dt*9),pose=(joint,axis,value)=>joint.rotation[axis]+=(value-joint.rotation[axis])*ease;
 const movement=(Math.sin(t*.79)+Math.sin(t*1.37+.6))*.5;
 let height=seated?-.31:walking?Math.abs(stride)*.045:Math.sin(t*1.2)*.009;
 let bodyX=0,bodyZ=0,rigX=0,headX=0,headY=movement*.06,la=0,ra=0,lz=.025,rz=-.025,le=0,re=0,lk=0,rk=0;
 let ll=seated?-1.35:-stride*.45,rl=seated?-1.35:stride*.45;
 if(seated){lk=rk=1.35;}
 if(walking){la=stride*.35;ra=-stride*.35;lk=Math.max(0,stride)*.6;rk=Math.max(0,-stride)*.6;bodyZ=stride*.016;}
 const typing=['typing','designing','calculating','sketching'].includes(mood);
 if(typing) {
  const pause=Math.sin(t*.9)>.77?.18:1;
  la=-.68+Math.sin(t*12.3)*.05*pause;ra=-.65+Math.sin(t*15.7+.6)*.07*pause;le=re=-.28;bodyX=.045;headX=.10;
 }
 if(mood==='designing'||mood==='sketching'){ra=-.7+Math.sin(t*3.2)*.15;headY=Math.sin(t*.4)*.12;}
 if(mood==='reading'){la=-.65;ra=-.43;headX=.23;headY=Math.sin(t*.6)*.05;le=-.3;}
 if(mood==='filing'){la=-.5+Math.sin(t*1.8)*.18;ra=-.7+Math.sin(t*1.8+.8)*.25;bodyZ=Math.sin(t*1.8)*.03;headX=.16;}
 if(mood==='thinking'){ra=-1.6;re=-.3;rz=-.15;headX=.15;headY=.15+Math.sin(t*.5)*.07;}
 if(mood==='phone'||mood==='listening'){ra=-2;re=-.25;rz=-.15;headY=-.12;headX=Math.sin(t*1.2)*.04;}
 if(mood==='stretch'){la=-2.7;ra=-2.7;bodyZ=Math.sin(t*1.4)*.06;headX=-.12;}
 if(mood==='cleaning'){la=-.5+Math.sin(t*2.6)*.13;ra=-.85+Math.sin(t*2.6+Math.PI)*.3;bodyX=.1;bodyZ=Math.sin(t*2.6)*.04;}
 if(mood==='wiping'){ra=-1.1+Math.sin(t*4)*.12;rz=Math.sin(t*3)*.25;bodyX=.19;headX=.16;}
 if(mood==='inspecting'||mood==='repairing'){la=-.5;ra=-.8+Math.sin(t*6)*.12;headX=.22;bodyX=.12;re=-.25;}
 if(mood==='making_coffee'){la=-.6;ra=-1.1+Math.sin(t*2.6)*.16;headX=.12;}
 if(mood==='reaching'){ra=-1.2+Math.sin(t*2)*.12;bodyX=.09;}
 if(mood==='wave'){ra=-2.65;rz=Math.sin(t*8)*.27;re=-.15;}
 if(mood==='talking'){la=-.35+Math.sin(t*3.5)*.14;ra=-.5+Math.sin(t*2.6+.5)*.16;headY=Math.sin(t*.7)*.09;}
 if(mood==='drinking'){ra=-2.1;re=-.3;headX=-.14;}
 if(mood==='nodding')headX=Math.sin(t*3.5)*.18;
 if(mood==='pointing'){ra=-1.5;rz=-.17;headY=-.12;}
 if(mood==='bending'){rigX=.65;height=-.12;headX=.2;ra=-.4;}
 if(mood==='kneeling'){height=-.55;ll=-.9;rl=.45;lk=1.6;rk=1.7;ra=-.7;}
 if(mood==='squatting'){const cycle=(Math.sin(t*2)+1)*.5;height=-.7*cycle;ll=rl=-1.2*cycle;lk=rk=2*cycle;la=ra=-.75*cycle;}
 if(mood==='push_up'){
  const cycle=(Math.sin(t*3.5)+1)*.5;
  rigX=Math.PI/2; height=.65+cycle*.10;la=ra=-1.25;le=re=-.45-cycle*.4;ll=rl=-.8;lk=rk=.1;headX=.12;
 }
 if(mood==='climbing'){ll=-.9;rl=-.2;lk=1.25;rk=.6;la=-.5;ra=-.75;bodyX=.12;}
 if(mood==='balancing'){la=-.2;ra=-.2;lz=.25;rz=-.25;bodyZ=Math.sin(t*1.7)*.015;}
 if(mood==='celebrating'){la=-2.5;ra=-2.5;le=re=-.4;height+=Math.abs(Math.sin(t*4))*.13;}
 if(holding&&!['reaching','drinking','making_coffee'].includes(mood)){ra=-.85;re=-.1;}
 if(mood==='stairs'){height+=.025;la*=.5;ra*=.5;}
 a.height+=(height-a.height)*ease;a.root.position.y=elevation;
 a.rig.position.y=a.height;pose(a.rig,'x',rigX);
 pose(a.legs.left,'x',ll);pose(a.legs.right,'x',rl);pose(a.knees.left,'x',lk);pose(a.knees.right,'x',rk);
 pose(a.arms.left,'x',la);pose(a.arms.right,'x',ra);pose(a.arms.left,'z',lz);pose(a.arms.right,'z',rz);
 pose(a.elbows.left,'x',le);pose(a.elbows.right,'x',re);
 pose(a.torso,'x',bodyX);pose(a.torso,'z',bodyZ);pose(a.head,'x',headX);pose(a.head,'y',headY);pose(a.head,'z',Math.sin(t*.83)*.015);
 a.props.phone.visible=mood==='phone'&&!holding;a.props.paper.visible=['reading','filing'].includes(mood);a.props.cloth.visible=mood==='wiping'&&!holding;
 a.arms.right.children.forEach(child=>{if(['broom pole','broom brush'].includes(child.name))child.visible=mood==='cleaning'&&!holding;});
 a.arms.left.children.forEach(child=>{if(['tray','cup'].includes(child.name))child.visible=mood==='making_coffee'||mood==='carrying';});
 a.shadow.scale.setScalar(mood==='push_up'?1.5:1);a.bubble.hidden=true;
}
