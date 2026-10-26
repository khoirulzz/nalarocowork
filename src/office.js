import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const blocked=[];
export const WORLD_OBJECTS=new Map();
export const FLOOR_HEIGHT=3.65;
export const STAIRS={lower:[9.7,7.3],upper:[9.7,.9]};
export const PLACE_LEVELS={meeting:1,mezzanine:1};
const materials=new Map(),geometry=new THREE.BoxGeometry(1,1,1);
const mat=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.04}));return materials.get(color);};
const rect=(x,z,w,d,level=0)=>blocked.push({x,z,w,d,level});
function cube(parent,size,pos,color,name) {
 const mesh=new THREE.Mesh(geometry,mat(color));mesh.scale.set(...size);mesh.position.set(...pos);mesh.name=name||'detail';parent.add(mesh);return mesh;
}
function put(root,id,type,pos,{size=[.5,.5,.5],color='#b6aca0',portable=false,actions=[],solid=false,interaction=null,level=0}={}) {
 const [x,y,z]=pos,mesh=cube(root,size,[x,y+level*FLOOR_HEIGHT,z],color,id);mesh.userData.objectId=id;
 const obj={id,type,label:id.replace(/_/g,' '),x,z,y:y+level*FLOOR_HEIGHT,level,portable,actions,mesh,
  interaction:interaction||[x,z+Math.max(.75,size[2]/2+.55)],owner:null,surface:y+size[1]/2};
 WORLD_OBJECTS.set(id,obj);if(solid)rect(x,z,size[0],size[2],level);return obj;
}
function wall(root,x,z,w,d,{height=2.5,color='#ddd7cb',glass=false}={}) {
 if(glass) {
  // Thin clear panes and opaque mullions keep rooms legible from an elevated camera.
  const pane=cube(root,[w,height,d],[x,height/2,z],'#c5d3cf','glass');
  pane.material=new THREE.MeshStandardMaterial({color:'#c0d1cb',transparent:true,opacity:.14,roughness:.25,depthWrite:false});
  for(const y of [.14,height])cube(root,[w,.055,d+.025],[x,y,z],'#4b554f');
  const length=Math.max(w,d),n=Math.ceil(length/2.5);
  for(let i=0;i<=n;i++)cube(root,[.045,height,.045],[x+(w>d?(i/n-.5)*w:0),height/2,z+(d>w?(i/n-.5)*d:0)],'#4b554f');
 } else {
  cube(root,[w,height,d],[x,height/2,z],color,'wall');
  cube(root,[w,.12,d+.03],[x,.07,z],'#726f62');
 }
 rect(x,z,w,d);
}
function divider(root,z,range,doors) {
 const all=[range[0],...doors.flatMap(([a,b])=>[a,b]),range[1]];
 for(let i=0;i<all.length-1;i+=2)if(all[i+1]-all[i]>.05)wall(root,(all[i]+all[i+1])/2,z,all[i+1]-all[i],.10,{height:2.3,glass:true});
}
function chair(root,id,x,z,level=0) {
 const y=level*FLOOR_HEIGHT;
 const obj=put(root,id,'chair',[x,.56,z],{size:[.64,.16,.62],color:'#48564e',actions:['sit','climb'],level});
 cube(root,[.64,.62,.10],[x,1+y,z-.25],'#48564e');
 cube(root,[.08,.52,.08],[x,.27+y,z],'#454540');
 for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]) {
  const foot=cube(root,[.55,.045,.055],[x,.07+y,z],'#454540');foot.rotation.y=a;
  cube(root,[.1,.10,.1],[x+Math.sin(a)*.25,.06+y,z+Math.cos(a)*.25],'#252c27');
 }
 for(const sign of [-1,1])cube(root,[.08,.055,.40],[x+sign*.38,.84+y,z],'#444b43');
 obj.interaction=[x,z+.86];obj.seat=[x,z];return obj;
}
function desk(root,id,x,z) {
 put(root,'desk_'+id,'desk',[x,.88,z],{size:[1.95,.13,.92],color:'#b28a60',solid:true,actions:['place','work','clean']});
 cube(root,[1.94,.03,.91],[x,.96,z],'#c8a67c');
 for(const sign of [-1,1])cube(root,[.09,.85,.74],[x+sign*.79,.43,z],'#3b443d');
 put(root,'monitor_'+id,'monitor',[x,1.35,z-.25],{size:[.86,.52,.065],color:'#26322f',actions:['use']});
 cube(root,[.78,.43,.01],[x,1.35,z-.211],'#72908c');
 cube(root,[.07,.18,.09],[x,1.04,z-.25],'#333c36');cube(root,[.36,.03,.23],[x,.98,z-.23],'#333c36');
 for(let i=0;i<5;i++)cube(root,[.22+(i%3)*.13,.012,.012],[x-.12,1.49-i*.065,z-.2],i%2?'#c9ceab':'#a5c0b3');
 put(root,'keyboard_'+id,'keyboard',[x,.98,z+.21],{size:[.61,.04,.23],color:'#46514a',actions:['use']});
 for(let i=0;i<3;i++)cube(root,[.54,.007,.008],[x,1.004,z+.14+i*.06],'#a2aaa0');
 cube(root,[.12,.04,.18],[x+.56,.98,z+.21],'#414a44');
 chair(root,'chair_'+id,x,z+1.14);
 cube(root,[.48,.69,.53],[x+.57,.38,z-.03],'#8a7356');
 for(const y of [.23,.47,.67])cube(root,[.15,.025,.02],[x+.57,y,z+.25],'#d9c5a1');
}
function plant(root,id,x,z) {
 put(root,'plant_'+id,'plant',[x,.26,z],{size:[.46,.52,.46],color:'#827461'});
 for(const [dx,dz,h] of [[-.13,-.13,1],[.17,.12,.8],[0,.2,1.24]]) {
  cube(root,[.045,h,.045],[x+dx,.52+h/2,z+dz],'#626b43');
  const leaf=cube(root,[.48,.1,.26],[x+dx,.59+h,z+dz],'#55735b');leaf.rotation.z=dx>0?.5:-.5;
 }
}
function flooring(root) {
 cube(root,[34,.36,24],[0,-.2,0],'#a59a85','foundation');
 const stone=new THREE.MeshStandardMaterial({color:'#dfd8c8',roughness:.32,metalness:.06});
 // A single deterministic texture avoids hundreds of individual floor tiles.
 if(typeof document!=='undefined') {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#ddd7c9';ctx.fillRect(0,0,512,512);
  let seed=73;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  for(let i=0;i<42;i++) {
   ctx.beginPath();ctx.moveTo(rnd()*512,0);const x=rnd()*512;
   ctx.bezierCurveTo(x,160,x+80,320,rnd()*512,512);ctx.strokeStyle=i%3?'#cfc9bc':'#ece6dc';ctx.globalAlpha=.32;ctx.lineWidth=rnd()*1.7+.3;ctx.stroke();
  }
  ctx.globalAlpha=1;ctx.strokeStyle='#beb8ab';ctx.lineWidth=1.5;ctx.strokeRect(0,0,512,512);
  const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(11,8);texture.colorSpace=THREE.SRGBColorSpace;stone.map=texture;
 }
 const floor=cube(root,[33.8,.025,23.8],[0,-.005,0],'#ddd7c9','limestone');floor.material=stone;
 for(const [x,z,w,d] of [[-12,-7.5,7.9,8],[-12,7.8,8.7,6]]) {
  cube(root,[w,.025,d],[x,.018,z],'#a88b67','oak flooring');
  for(let i=-Math.floor(w);i<Math.floor(w);i++)cube(root,[.009,.005,d],[x+i*.48,.033,z],'#927958');
 }
 // Inlaid brass defines the central circulation path.
 for(const x of [-6.7,7.3])cube(root,[.035,.008,22.4],[x,.025,0],'#ad9872');
}
function mezzanine(root) {
 const g=new THREE.Group();g.name='mezzanine';root.add(g);g.userData.upperFloor=true;
 cube(g,[8.4,.26,13.2],[12.4,FLOOR_HEIGHT-.15,-5.1],'#938570','mezzanine slab');
 cube(g,[8.35,.035,13.15],[12.4,FLOOR_HEIGHT,-5.1],'#c3ae8d');
 for(let i=0;i<17;i++)cube(g,[.012,.008,13.1],[8.3+i*.49,FLOOR_HEIGHT+.025,-5.1],'#ad9776');
 for(const [x,z] of [[8.25,-10.8],[16.3,-10.8],[8.25,.9],[16.3,.9]])cube(root,[.19,FLOOR_HEIGHT,.19],[x,FLOOR_HEIGHT/2,z],'#4b5045');
 for(const z of [-11.3,1.5]) {
  for(let x=8.3;x<16.6;x+=1.35)cube(g,[.045,1,.045],[x,FLOOR_HEIGHT+.55,z],'#656653');
  cube(g,[8.35,.07,.08],[12.4,FLOOR_HEIGHT+1.05,z],'#7d7157');
 }
 for(let z=-11;z<1.4;z+=1.5)cube(g,[.05,1,.05],[8.25,FLOOR_HEIGHT+.55,z],'#656653');
 cube(g,[.07,.07,12.8],[8.25,FLOOR_HEIGHT+1.05,-4.9],'#7d7157');
 // The stair ribbon has matching navigation endpoints on both storeys.
 for(let i=0;i<16;i++) {
  const y=(i+1)*FLOOR_HEIGHT/16,z=6.9-i*.39;
  cube(root,[1.38,.14,.43],[9.7,y-.07,z],'#c2b397','stair tread');
  cube(root,[1.36,.025,.035],[9.7,y+.01,z+.2],'#a28b62');
 }
 rect(9.7,3.6,1.5,6.2,0);
 for(const x of [8.96,10.44]) {
  const rail=cube(root,[.05,.05,7.3],[x,2.55,3.8],'#665d49');rail.rotation.x=.52;
  for(let i=0;i<5;i++)cube(root,[.04,.9,.04],[x,.85+i*.72,6.85-i*1.42],'#665d49');
 }
 put(g,'meeting_table','meeting_table',[12.8,.88,-7.6],{size:[3.4,.17,1.4],color:'#94744f',solid:true,actions:['place','clean'],level:1});
 for(const [i,x,z] of [[0,11.6,-5.9],[1,13,-5.9],[2,14.4,-5.9],[3,11.6,-9.5],[4,13.6,-9.5]])chair(g,'meeting_chair_'+i,x,z,1);
 put(g,'mezzanine_sofa','sofa',[14.5,.55,-1.2],{size:[2.9,.9,.85],color:'#777e61',solid:true,actions:['sit'],level:1});
 cube(g,[3,.65,.12],[14.5,FLOOR_HEIGHT+1,-1.58],'#777e61');
 put(g,'mezzanine_table','table',[13.9,.48,.2],{size:[1.3,.13,.7],color:'#9c825c',solid:true,actions:['place','clean'],level:1});
 return g;
}
function batchDetails(group) {
 const buckets=new Map(),removed=[];
 group.updateMatrixWorld(true);
 group.traverse(mesh=>{
  if(!mesh.isMesh||mesh.userData.objectId||mesh.material.transparent||mesh.material.map)return;
  const key=mesh.material.uuid;
  if(!buckets.has(key))buckets.set(key,{material:mesh.material,geometries:[]});
  buckets.get(key).geometries.push(mesh.geometry.clone().applyMatrix4(mesh.matrixWorld));removed.push(mesh);
 });
 for(const mesh of removed)mesh.removeFromParent();
 for(const {material,geometries} of buckets.values()){
  const merged=mergeGeometries(geometries);for(const geo of geometries)geo.dispose();
  const mesh=new THREE.Mesh(merged,material);mesh.name='batched architectural details';group.add(mesh);
 }
}
export function createOffice(scene) {
 WORLD_OBJECTS.clear();blocked.length=0;
 const g=new THREE.Group();g.name='office_world';scene.add(g);flooring(g);
 wall(g,0,-11.8,34,.2,{height:3.1});wall(g,-16.9,0,.2,24,{height:3.1});
 cube(g,[34,.12,.16],[0,.04,11.8],'#786f5d');cube(g,[.16,.12,24],[16.9,.04,0],'#786f5d');
 for(const x of [-13.4,-7.2,-1,5.2,11.4]) {
  cube(g,[4.9,1.95,.025],[x,1.75,-11.64],'#98b3b0');
  for(const offset of [-2.48,0,2.48])cube(g,[.065,2.02,.07],[x+offset,1.75,-11.6],'#62695c');
  cube(g,[5.08,.06,.08],[x,.75,-11.6],'#62695c');
 }
 divider(g,-3,[-16.7,-8],[[-12,-10]]);wall(g,-8,-7.35,.1,8.7,{glass:true});
 wall(g,-8,.6,.1,6.85,{glass:true});divider(g,4,[-16.7,-8],[[-12.6,-10.4]]);
 divider(g,6,[-16.7,-6],[[-9,-6.5]]);divider(g,-3,[-6.1,-.2],[[-3.9,-2.1]]);
 desk(g,'owner',-12,-8.4);desk(g,'finance',-12,-.9);desk(g,'technical',-3,-8.35);
 desk(g,'creative',-12,6.9);desk(g,'operations',1,-3.6);desk(g,'supportA',3.6,2.6);desk(g,'supportB',6.6,2.6);
 // Owner cabinetry and slatted acoustic wall.
 for(let x=-15.6;x<-8.4;x+=.28)cube(g,[.10,2.65,.10],[x,1.35,-11.47],'#8b7558');
 put(g,'owner_cabinet','cabinet',[-15.9,.77,-7],{size:[.65,1.5,2.7],color:'#998265',solid:true,actions:['use']});
 for(const z of [-7.8,-7,-6.2])cube(g,[.69,.025,.3],[-15.9,1.54,z],'#d0bd94');
 // Storage, task lighting and pinboards use shared primitive meshes.
 for(const [x,z] of [[-15.7,1.2],[-5.8,-10.7]]) {
  put(g,'bookcase_'+(x===-15.7?'finance':'technical'),'cabinet',[x,1.05,z],{size:[.6,2,1.8],color:'#78694f',solid:true,actions:['use']});
  for(let i=0;i<8;i++)cube(g,[.63,.32,.11],[x,.45+(i%3)*.52,z-.65+Math.floor(i/3)*.5],['#b3a183','#647866','#c5b899'][i%3]);
 }
 const board=cube(g,[.06,1.2,2.6],[-16.72,1.8,8],'#f1e9d3');
 for(let i=0;i<3;i++)cube(g,[.07,.2,.36],[-16.67,1.95-i*.27,7.4+i*.36],['#cc9b69','#a9b49a','#c5b28b'][i]);
 for(const [x,z] of [[-12,-8.4],[-12,-.9],[-3,-8.35],[-12,6.9],[1,-3.6]]){
  cube(g,[.18,.025,.2],[x-.75,.99,z],'#5d6758');cube(g,[.035,.42,.035],[x-.75,1.2,z],'#5d6758');
  cube(g,[.32,.05,.22],[x-.63,1.43,z],'#d6c6a5');
 }
 const upper=mezzanine(g);
 put(g,'pantry_counter','counter',[13.8,.59,9.4],{size:[3.8,1.12,.85],color:'#68796d',solid:true,actions:['place','clean']});
 cube(g,[4,.09,.98],[13.8,1.2,9.4],'#d2c8b2');
 for(const x of [12.5,13.4,14.3,15.2])cube(g,[.03,.78,.02],[x,.6,9.84],'#495a4e');
 put(g,'coffee_machine','coffee_machine',[13.4,1.51,9.27],{size:[.53,.54,.48],color:'#343b35',actions:['make_coffee'],interaction:[13.2,8.2]});
 cube(g,[.36,.20,.03],[13.4,1.5,9.52],'#8f9b89');cube(g,[.33,.035,.2],[13.4,1.26,9.58],'#353e35');
 put(g,'water_dispenser','water_dispenser',[10.9,.65,10.2],{size:[.48,1.15,.46],color:'#91a7a2',actions:['drink']});
 for(let i=1;i<=4;i++)put(g,'coffee_cup_'+i,'cup',[14.2+i*.28,1.35,9.18],{size:[.19,.19,.19],color:'#eee6d6',portable:true,actions:['take','place','drink']});
 put(g,'printer_shared','printer',[-2,.61,2],{size:[.7,.55,.65],color:'#52665d',actions:['use'],solid:true});
 cube(g,[.55,.02,.29],[-2,.9,2],'#dedbd0');cube(g,[.38,.05,.20],[-2,.53,2.34],'#293e35');
 put(g,'supply_cabinet','cabinet',[15,.95,5.6],{size:[.9,1.85,.6],color:'#758275',solid:true,actions:['use']});
 put(g,'notebook_owner','notebook',[-11.25,.99,-8.17],{size:[.27,.03,.34],color:'#e0c392',portable:true,actions:['take','place']});
 put(g,'document_finance','document',[-11.3,.99,-.72],{size:[.31,.02,.32],color:'#ece6d7',portable:true,actions:['take','place']});
 put(g,'tablet_creative','tablet',[-11.27,1,7.03],{size:[.3,.04,.43],color:'#35473e',portable:true,actions:['take','place']});
 put(g,'broom_utility','broom',[14.8,.58,6.6],{size:[.05,1.12,.05],color:'#997b5d',portable:true,actions:['take','place']});
 put(g,'cleaning_cloth','cloth',[14.5,1.31,9.5],{size:[.24,.02,.24],color:'#d2b889',portable:true,actions:['take','place','clean']});
 put(g,'trash_bin_support','bin',[8,.35,3.9],{size:[.45,.68,.45],color:'#778171',actions:['use']});
 put(g,'lounge_sofa','sofa',[-3,.44,4.1],{size:[2.7,.78,.8],color:'#727f62',solid:true,actions:['sit']});
 cube(g,[2.8,.65,.14],[-3,.92,4.42],'#727f62');
 for(const x of [-4.35,-1.65])cube(g,[.16,.54,.83],[x,.7,4.1],'#727f62');
 put(g,'lounge_table','table',[-3,.46,2.1],{size:[1.4,.14,.65],color:'#a48a62',solid:true,actions:['place','clean']});
 for(const [id,x,z] of [['nw',-15.7,-9.8],['sw',-15.6,10.3],['ne',15.4,-10.5],['se',15.5,10.8],['center',-.3,10.3]])plant(g,id,x,z);
 // Large rugs and acoustic dividers anchor the open workspace.
 cube(g,[6,.015,4.7],[5,.03,2.4],'#b3b5a2');
 for(let i=0;i<7;i++)cube(g,[.05,1.1,.12],[2+i*.25,.56,.5],'#a69170');
 scene.add(new THREE.HemisphereLight('#f5f0e5','#797c68',2));
 const sun=new THREE.DirectionalLight('#fff0d4',2.5);sun.position.set(4,18,12);scene.add(sun);
 scene.background=new THREE.Color('#c2c6b8');
 // Keep the upper floor in its own batch so the cutaway toggle stays interactive.
 upper.removeFromParent();batchDetails(g);batchDetails(upper);g.add(upper);
 return {root:g,upper};
}
export function isBlocked(x,z,extra=[],level=0) {
 if(level===1) {if(x<8.6||x>16||z< -11.2||z>1.1)return true;}
 else if(x<=-16.3||x>=16.3||z<=-11.35||z>=11.25)return true;
 return blocked.some(b=>b.level===level&&Math.abs(x-b.x)<b.w/2+.26&&Math.abs(z-b.z)<b.d/2+.26)||extra.some(p=>Math.hypot(x-p.x,z-p.z)<(p.radius||.52));
}
export function getObject(id){return WORLD_OBJECTS.get(id)||null;}
export function findObject(text) {const q=String(text||'').toLowerCase().trim().replace(/ /g,'_');return WORLD_OBJECTS.get(q)||[...WORLD_OBJECTS.values()].find(o=>o.id.includes(q))||null;}
function nearestWalkable(goal,extra=[],level=0){
 if(!isBlocked(goal[0],goal[1],extra,level))return goal;
 for(const radius of [.6,1.15,1.8,2.5]){
  for(let j=0;j<20;j++){
   const angle=j*Math.PI/10,trial=[goal[0]+radius*Math.cos(angle),goal[1]+radius*Math.sin(angle)];
   if(!isBlocked(...trial,extra,level))return trial;
  }
 }
 return null;
}
export function pathfind(start,goal,extra=[],level=0){
 const end=nearestWalkable(goal,extra,level);if(!end)return [];
 const size=.65, snap=v=>Math.round(v/size),id=(x,z)=>x+","+z;
 const sx=snap(start[0]),sz=snap(start[1]),gx=snap(end[0]),gz=snap(end[1]);
 let queue=[{x:sx,z:sz,g:0,f:Math.hypot(gx-sx,gz-sz)}];
 const seen=new Map([[id(sx,sz),0]]),prev=new Map();
 const directions=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
 let reached=null;
 for(let checks=0;queue.length&&checks<5000;checks++){
  queue.sort((a,b)=>a.f-b.f);const cur=queue.shift();const k=id(cur.x,cur.z);
  if(cur.x===gx&&cur.z===gz){reached=k;break;}
  for(const [dx,dz] of directions){
   const x=cur.x+dx,z=cur.z+dz,px=x*size,pz=z*size;
   if(isBlocked(px,pz,extra,level) && !(x===gx&&z===gz))continue;
   if(dx&&dz&&(isBlocked((cur.x+dx)*size,cur.z*size,extra,level)||isBlocked(cur.x*size,(cur.z+dz)*size,extra,level)))continue;
   const key=id(x,z),dist=cur.g+Math.hypot(dx,dz);
   if(dist>= (seen.get(key)??Infinity))continue;
   seen.set(key,dist);prev.set(key,k);
   queue.push({x,z,g:dist,f:dist+Math.hypot(gx-x,gz-z)});
  }
 }
 if(!reached)return [];
 const points=[];let item=reached;
 while(item!==id(sx,sz)&&item){
  const [x,z]=item.split(",").map(Number);points.push([x*size,z*size]);item=prev.get(item);
 }
 points.reverse();
 // Never append an exact destination with a blocked intermediate segment.
 // A last segment is valid only when samples along it stay collision-free.
 const last=points.at(-1)||start;
 const length=Math.hypot(end[0]-last[0],end[1]-last[1]);
 const samples=Math.max(1,Math.ceil(length/.16));
 let clear=true;
 for(let i=1;i<=samples;i++){
  const t=i/samples,px=last[0]+(end[0]-last[0])*t,pz=last[1]+(end[1]-last[1])*t;
  if(isBlocked(px,pz,extra,level)){clear=false;break;}
 }
 if(clear)points.push(end);
 return points;
}
export const COLLIDERS=blocked;
