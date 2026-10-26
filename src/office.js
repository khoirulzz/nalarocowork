import * as THREE from "three";
const blocked=[];
export const WORLD_OBJECTS=new Map();
const materials=new Map();
const mat=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshLambertMaterial({color}));return materials.get(color);};
const rect=(x,z,w,d)=>blocked.push({x,z,w,d});
function cube(parent,size,pos,color,name){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(color));
 mesh.position.set(...pos);mesh.name=name||"prop";parent.add(mesh);return mesh;
}
function put(root,id,type,pos,{size=[.5,.5,.5],color="#b6aca0",portable=false,actions=[],solid=false,interaction=null}={}){
 const [x,y,z]=pos;
 const mesh=cube(root,size,pos,color,id);
 mesh.userData.objectId=id;
 const obj={id,type,label:id.replace(/_/g," "),x,z,y,portable,actions,mesh,interaction:interaction||[x,z+Math.max(.75,size[2]/2+.55)],owner:null};
 WORLD_OBJECTS.set(id,obj);
 if(solid)rect(x,z,size[0],size[2]);
 return obj;
}
function wall(root,x,z,w,d,{height=2.5,color="#c9d6d4",glass=false}={}){
 cube(root,[w,height,d],[x,height/2,z],glass?"#a8c9cb":color,"partition");
 rect(x,z,w,d);
}
function divider(root,z,range,doors){
 // break the wall into explicit segments and leave human-sized door apertures
 const all=[range[0],...doors.flatMap(([start,end])=>[start,end]),range[1]];
 for(let i=0;i<all.length-1;i+=2)if(all[i+1]-all[i]>.05)
  wall(root,(all[i]+all[i+1])/2,z,all[i+1]-all[i],.15,{height:2.3,glass:true});
}
function desk(root,id,x,z){
 put(root,"desk_"+id,"desk",[x,.78,z],{size:[1.65,.12,.78],color:"#b58b6d",solid:true,actions:["place","work"]});
 for(const side of [-.67,.67])for(const depth of [-.27,.27])
  cube(root,[.07,.74,.07],[x+side,.38,z+depth],"#4d5b60");
 put(root,"monitor_"+id,"monitor",[x,1.15,z-.22],{size:[.68,.45,.065],color:"#37464c",actions:["use"]});
 put(root,"keyboard_"+id,"keyboard",[x,.87,z+.18],{size:[.55,.025,.18],color:"#424e53",actions:["use"]});
 put(root,"chair_"+id,"chair",[x,.48,z+1.03],{size:[.55,.13,.53],color:"#59656c",actions:["sit"]});
 cube(root,[.54,.55,.08],[x,.79,z+.78],"#59656c");
 const p=WORLD_OBJECTS.get("chair_"+id);p.interaction=[x,z+1.12];p.seat=[x,z+1.06];
}
function plant(root,id,x,z){
 put(root,"plant_"+id,"plant",[x,.26,z],{size:[.42,.52,.42],color:"#968777"});
 for(const [dx,dz,h] of [[-.13,-.13,1],[.17,.12,.8],[.0,.20,1.24]]){
  cube(root,[.13,h,.14],[x+dx,.52+h/2,z+dz],"#4b725b");
  cube(root,[.26,.25,.26],[x+dx,.59+h,z+dz],"#6b8c6c");
 }
}
export function createOffice(scene){
 WORLD_OBJECTS.clear();blocked.length=0;
 const g=new THREE.Group();g.name="office_world";scene.add(g);
 cube(g,[34,.3,24],[0,-.17,0],"#c4c4bb","floor");
 for(let x=-16;x<=16;x+=2)cube(g,[.012,.002,23.5],[x,-.014,0],"#b7b6af");
 for(let z=-11;z<=11;z+=2)cube(g,[33.6,.002,.012],[0,-.013,z],"#b7b6af");
 // Outer shell: back and left walls are tall, front and right remain open for camera.
 wall(g,0,-11.8,34,.2,{height:3.1,color:"#b5c4c4"});
 wall(g,-16.9,0,.2,24,{height:3.1,color:"#b5c4c4"});
 cube(g,[34,.35,.22],[0,.1,11.8],"#3d4f54");cube(g,[.22,.35,24],[16.9,.1,0],"#3d4f54");
 // Windows on the outside wall.
 for(const x of [-13.4,-7.2,-1.0,5.2,11.4]){
  cube(g,[4.4,1.45,.025],[x,2.02,-11.64],"#a9c3c9");
  cube(g,[.07,1.5,.08],[x,2.02,-11.59],"#4b666b");
 }
 // Enclosed owner room (-16 to -8, -11 to -3), entry at x=-11.
 divider(g,-3,[-16.7,-8.0],[[-12,-10]]);
 wall(g,-8,-7.35,.15,8.7,{glass:true});
 // Enclosed finance area on left (-16 to -8, -3 to 4.1). Corridor via door at z=0.
 wall(g,-8,.6,.15,6.85,{glass:true});
 divider(g,4,[-16.7,-8],[[-12.6,-10.4]]);
 // Meeting room with glass partitions. Two entrances so pathfinding stays accessible.
 divider(g,-3,[8,16.7],[[10.2,12.2]]);
 wall(g,8,-7.4,.15,8.65,{glass:true});
 // Semi-separated creative workshop, left foreground. Open entry near center.
 divider(g,6,[-16.7,-6],[[-9,-6.5]]);
 // Individual tech zone left middle, open area shared through wide walkway.
 divider(g,-3.0,[-6.1,-.2],[[-3.9,-2.1]]);
 // Meeting furniture
 put(g,"meeting_table","meeting_table",[12,.77,-7.6],{size:[3.3,.16,1.23],color:"#a47f62",solid:true,actions:["place","work"]});
 for(const [index,x,z] of [[0,10.8,-5.9],[1,12,-5.9],[2,13.2,-5.9],[3,11,-9.4],[4,13,-9.4]])
  put(g,"meeting_chair_"+index,"chair",[x,.48,z],{size:[.5,.12,.52],color:"#626c6b",actions:["sit"]});
 // Employee desks, each ID is queryable in natural language.
 desk(g,"owner",-12,-8.4);desk(g,"finance",-12,-.9);
 desk(g,"technical",-3,-8.35);desk(g,"creative",-12,6.9);
 desk(g,"operations",1,-3.6);desk(g,"supportA",3.6,2.6);desk(g,"supportB",6.6,2.6);
 // Glass-limited pantry and utility area, not a private OB room.
 wall(g,10.0,9.6,.14,3.3,{height:1.5,glass:true});
 put(g,"pantry_counter","counter",[13.8,.58,9.4],{size:[3.8,1.0,.7],color:"#85978b",solid:true,actions:["place"]});
 put(g,"coffee_machine","coffee_machine",[13.4,1.24,9.27],{size:[.5,.49,.48],color:"#3e494b",actions:["make_coffee"],interaction:[13.2,8.24]});
 put(g,"water_dispenser","water_dispenser",[10.9,.65,10.2],{size:[.48,1.15,.46],color:"#a9c3c8",actions:["drink"]});
 put(g,"coffee_cup_1","cup",[14.5,1.12,9.18],{size:[.19,.17,.19],color:"#f0eee8",portable:true,actions:["take","place"]});
 put(g,"coffee_cup_2","cup",[14.8,1.12,9.18],{size:[.19,.17,.19],color:"#eeeeea",portable:true,actions:["take","place"]});
 put(g,"printer_shared","printer",[-2,.61,2.0],{size:[.70,.55,.65],color:"#5b737b",actions:["use"],solid:true});
 put(g,"supply_cabinet","cabinet",[15,.95,5.6],{size:[.9,1.85,.6],color:"#758b87",solid:true,actions:["open"]});
 put(g,"notebook_owner","notebook",[-11.25,.88,-8.17],{size:[.27,.03,.34],color:"#edcfab",portable:true,actions:["take","place"]});
 put(g,"document_finance","document",[-11.3,.88,-.72],{size:[.31,.02,.32],color:"#f4ede0",portable:true,actions:["take","place"]});
 put(g,"tablet_creative","tablet",[-11.27,.89,7.03],{size:[.3,.04,.43],color:"#35474e",portable:true,actions:["take","place"]});
 put(g,"broom_utility","broom",[14.8,.58,6.6],{size:[.05,1.12,.05],color:"#997b5d",portable:true,actions:["take","place"]});
 put(g,"trash_bin_support","bin",[8.0,.35,3.9],{size:[.45,.68,.45],color:"#768984",actions:["empty"]});
 put(g,"lounge_sofa","sofa",[-3,.44,4.1],{size:[2.7,.78,.7],color:"#839891",solid:true,actions:["sit"]});
 put(g,"lounge_table","table",[-3,.46,2.1],{size:[1.4,.14,.65],color:"#b08c6b",solid:true,actions:["place"]});
 for(const [id,x,z] of [["nw",-15.7,-9.8],["sw",-15.6,10.3],["ne",15.4,-10.5],["se",15.5,10.8],["center",-.3,10.3]])plant(g,id,x,z);
 // Decorative LED strips, no floating room labels.
 cube(g,[2.8,.055,.1],[-12,2.68,-3.12],"#f2cf96");
 cube(g,[3.6,.055,.1],[12,2.68,-3.12],"#f2cf96");
 scene.add(new THREE.HemisphereLight("#e5f2f4","#92918c",2.05));
 const sun=new THREE.DirectionalLight("#fff2de",2.25);sun.position.set(12,16,7);scene.add(sun);
 scene.background=new THREE.Color("#d6dcdb");
 scene.fog=new THREE.Fog("#d6dcdb",34,72);
 return g;
}
export function isBlocked(x,z,extra=[]){
 if(x<=-16.3||x>=16.3||z<=-11.35||z>=11.25)return true;
 return blocked.some(b=>Math.abs(x-b.x)<b.w/2+.26&&Math.abs(z-b.z)<b.d/2+.26)
   || extra.some(p=>Math.hypot(x-p.x,z-p.z)<(p.radius||.52));
}
export function getObject(id){return WORLD_OBJECTS.get(id)||null;}
export function findObject(text){
 const query=String(text||"").toLowerCase().trim().replace(/^@/,"").replace(/ /g,"_");
 return WORLD_OBJECTS.get(query)||[...WORLD_OBJECTS.values()].find(o=>o.id.includes(query))||null;
}
function nearestWalkable(goal,extra=[]){
 if(!isBlocked(goal[0],goal[1],extra))return goal;
 for(const radius of [.6,1.15,1.8,2.5]){
  for(let j=0;j<20;j++){
   const angle=j*Math.PI/10,trial=[goal[0]+radius*Math.cos(angle),goal[1]+radius*Math.sin(angle)];
   if(!isBlocked(...trial,extra))return trial;
  }
 }
 return null;
}
export function pathfind(start,goal,extra=[]){
 const end=nearestWalkable(goal,extra);if(!end)return [];
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
   if(isBlocked(px,pz,extra) && !(x===gx&&z===gz))continue;
   if(dx&&dz&&(isBlocked((cur.x+dx)*size,cur.z*size,extra)||isBlocked(cur.x*size,(cur.z+dz)*size,extra)))continue;
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
 points.reverse();points.push(end);return points;
}
export const COLLIDERS=blocked;
