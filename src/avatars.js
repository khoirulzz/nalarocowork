import * as THREE from "three";
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
export function createAvatar(p) {
 const root=new THREE.Group();root.name=p.name;root.userData.staffId=p.id;
 const torso=new THREE.Group();torso.position.y=1.39;root.add(torso);
 cube(torso,"shirt",[.68,.78,.40],[0,0,0],p.shirt);
 cube(torso,"hem",[.68,.10,.41],[0,-.37,0],p.shirt);
 cube(torso,"belt",[.70,.07,.42],[0,-.425,0],"#303239");
 cube(torso,"buckle",[.11,.061,.022],[0,-.424,.226],"#9ca4aa");
 cube(torso,"collar left",[.13,.09,.024],[-.13,.33,.218],"#e3e5e3");
 cube(torso,"collar right",[.13,.09,.024],[.13,.33,.218],"#e3e5e3");
 const head=new THREE.Group();head.position.y=1.78;root.add(head);makeFace(head,p);
 const arms={},legs={};
 for(const [side,sign] of [["left",-1],["right",1]]){
  const arm=new THREE.Group();arm.position.set(sign*.47,1.73,0);root.add(arm);arms[side]=arm;
  cube(arm,"arm sleeve",[.24,.46,.31],[0,-.24,0],p.shirt);
  cube(arm,"cuff",[.248,.07,.31],[0,-.48,0],tint(p.shirt,1.11));
  cube(arm,"hand",[.22,.22,.29],[0,-.63,0],p.skin);
  const leg=new THREE.Group();leg.position.set(sign*.18,.98,0);root.add(leg);legs[side]=leg;
  cube(leg,"leg",[.285,.72,.35],[0,-.355,0],p.pants);
  cube(leg,"shoe",[.318,.175,.47],[0,-.795,.052],p.id==="ulum"?"#20252b":"#e4e3dc");
  cube(leg,"shoe toe",[.318,.05,.472],[0,-.84,.052],p.id==="ulum"?"#171a1e":"#b8b8b4");
 }
 accessory(root,p,arms,torso,head);
 const label=document.createElement("div");label.className="nameplate";
 label.textContent=p.name;label.dataset.employee=p.id;
 const nameplate=new CSS2DObject(label);nameplate.position.set(0,2.74,0);root.add(nameplate);
 const bubble=document.createElement("div");bubble.className="speech";bubble.textContent="";bubble.hidden=true;
 const speech=new CSS2DObject(bubble);speech.position.set(0,3.12,0);root.add(speech);
 root.traverse(obj=>{if(obj.isMesh)obj.userData.staffId=p.id;});
 return {root,p,head,torso,arms,legs,label,bubble,animationClock:Math.random()*9,pose:"idle"};
}
export function animateAvatar(a,dt,mood,speed=1) {
 const t=a.animationClock+=dt;
 const typing=["typing","designing","filing"].includes(mood),seated=["typing","designing","reading","filing","thinking","phone"].includes(mood);
 const walking=mood==="walking",cleaning=["cleaning","wiping"].includes(mood);
 const wave=mood==="wave",reach=mood==="reaching",coffee=mood==="making_coffee",carrying=mood==="carrying";
 const looking=mood==="look"||mood==="inspecting"||mood==="thinking";
 const leftStep=walking?Math.sin(t*8.5)*(.42+speed*.04):0;
 const ease=Math.min(1,dt*7.5);
 const pose=(joint,axis,target)=>joint.rotation[axis]+=(target-joint.rotation[axis])*ease;
 a.root.position.y=seated?-.29:walking?Math.abs(Math.sin(t*8.5))*.036:Math.sin(t*.8)*.009;
 const leg=seated?-1.13:0;
 pose(a.legs.left,"x",leg-leftStep);pose(a.legs.right,"x",leg+leftStep);
 const small=Math.sin(t*7.4)*.08,large=Math.sin(t*3.2)*.16;
 let la=0,ra=0,lz=0,rz=0,tilt=0,body=0,look=Math.sin(t*.41)*.045;
 if(walking){la=leftStep*.64;ra=-leftStep*.64;tilt=.018*Math.sin(t*8.5);}
 if(typing){la=-.74+small;ra=-.74+Math.sin(t*9.1)*.09;tilt=.012*Math.sin(t*2.3);}
 if(mood==="reading"){la=-.55;ra=-.20;lz=-.16;look=.1+Math.sin(t*.6)*.02;}
 if(mood==="designing"){la=-.75+small;ra=-.62+Math.sin(t*11)*.13;look=-.08;}
 if(mood==="filing"){la=-.45+Math.sin(t*2)*.18;ra=-.6+Math.sin(t*2+.7)*.20;look=.07;}
 if(mood==="phone"){ra=-1.85;rz=-.18;la=-.20;look=.08;}
 if(mood==="thinking"){ra=-1.42;rz=-.10;look=.22+Math.sin(t*.3)*.06;}
 if(mood==="inspecting"){la=-.66;ra=-.4+large;look=.28;}
 if(mood==="stretch"){la=-2.75+Math.sin(t*1.1)*.07;ra=-2.65+Math.sin(t*1.1)*.07;body=Math.sin(t*1.6)*.075;}
 if(mood==="cleaning"){la=-.52+Math.sin(t*3)*.16;ra=-.85+Math.sin(t*3+Math.PI)*.35;body=Math.sin(t*3)*.08;tilt=.10;}
 if(mood==="wiping"){la=-.45;ra=-.67+Math.sin(t*4)*.29;body=Math.sin(t*4)*.05;}
 if(coffee){la=-.80;ra=-.84+Math.sin(t*2.6)*.19;look=.13;}
 if(carrying){la=-.26;ra=-.78;look=Math.sin(t*.41)*.06;}
 if(reach){ra=-1.25+Math.sin(t*3)*.16;body=.05;}
 if(wave){ra=-2.25;rz=Math.sin(t*10)*.33;look=.13;}
 if(mood==="talking"){la=-.45+Math.sin(t*5)*.18;ra=-.22+Math.sin(t*4)*.15;look=.1;}
 if(looking){look=.22+Math.sin(t*.7)*.15;}
 pose(a.arms.left,"x",la);pose(a.arms.right,"x",ra);
 pose(a.arms.left,"z",lz);pose(a.arms.right,"z",rz);
 pose(a.torso,"z",body);pose(a.torso,"x",tilt);
 pose(a.head,"y",look);pose(a.head,"z",Math.sin(t*.9)*.018);
 // Only nickname remains in the scene. No chat bubble overlays.
 a.bubble.hidden=true;
}
