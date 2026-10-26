import * as THREE from "three";
const palette={floor:"#b8b6ad",border:"#29333a",wood:"#a47d63",dark:"#334047",offwhite:"#e7e5db",carpet:"#8d9b99",glass:"#abc5ce"};
const material=c=>new THREE.MeshLambertMaterial({color:c});
const mats=new Map();
function box(parent,size,pos,color,name=""){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),mats.get(color)||(()=>{const m=material(color);mats.set(color,m);return m;})());
 mesh.position.set(...pos);mesh.name=name;mesh.receiveShadow=false;parent.add(mesh);return mesh;
}
export const BLOCKED=[];
function obstacle(x,z,w,d){BLOCKED.push({x,z,w,d});}
function desk(scene,x,z,title,angle=0){
 const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=angle;scene.add(g);
 box(g,[1.55,.12,.74],[0,.75,0],palette.wood,"Desk");
 for(const dx of [-.65,.65]) for(const dz of [-.25,.25])box(g,[.065,.71,.065],[dx,.37,dz],palette.dark);
 box(g,[.84,.06,.27],[0,.785,-.05],"#555b5b","Keyboard");
 box(g,[.72,.46,.045],[0,1.09,-.21],"#26313a","Monitor");
 box(g,[.64,.36,.01],[0,1.09,-.182],"#6e94a2");
 box(g,[.08,.12,.08],[0,.83,-.22],"#3b4650");
 box(g,[.17,.18,.18],[.61,.87,.12],"#f6f2e8","Cup");
 // Center obstacles only: employees can approach the chair at the open end.
 obstacle(x,z,1.65,.85);
}
function chair(scene,x,z,angle=0){
 const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=angle;scene.add(group);
 box(group,[.52,.10,.52],[0,.48,0],"#454a50");
 box(group,[.51,.60,.08],[0,.79,-.23],"#41454a");
 box(group,[.08,.46,.08],[0,.26,0],"#4e555c");
 box(group,[.60,.04,.07],[0,.08,0],"#67717a");
}
function plant(scene,x,z,scale=1){
 const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);scene.add(g);
 box(g,[.44,.45,.44],[0,.24,0],"#b5aaa0");
 box(g,[.32,.15,.32],[0,.5,0],"#594f41");
 for(const [dx,dz,h] of [[-.24,0,.9],[.20,.17,1.18],[.13,-.16,.82],[-.11,.2,1.27]]){
  box(g,[.12,h,.12],[dx,.52+h/2,dz],"#4c715a");
  box(g,[.27,.25,.23],[dx,.65+h,dz],"#608065");
 }
}
function officeSign(scene,text,x,z){
 // Scene label made from CSS world rendering later; no WebGL text to keep payload low.
 const sign=new THREE.Group();sign.position.set(x,0,z);scene.add(sign);
 box(sign,[2.3,.85,.1],[0,2.65,0],"#303b44");
 box(sign,[1.9,.06,.13],[0,2.43,.08],"#ff5b2e");
}
export function createOffice(scene){
 const root=new THREE.Group();root.name="Nalaro Office";scene.add(root);
 box(root,[22,.35,16],[0,-.21,0],palette.floor,"Floor");
 // light floor tile grid: modest number of draw calls
 for(let x=-10;x<=10;x+=2){box(root,[.015,.004,15.7],[x,-.03,0],"#aaa99f");}
 for(let z=-7;z<=7;z+=2){box(root,[21.7,.004,.015],[0,-.028,z],"#aaa99f");}
 box(root,[22,.28,.30],[0,.12,-7.85],palette.border);
 box(root,[.28,.28,16],[-10.85,.12,0],palette.border);
 box(root,[22,.12,.18],[0,.10,7.85],palette.border);
 // background facade and floor-to-ceiling glass on far side
 box(root,[22,2.9,.16],[0,1.55,-7.85],"#9eaaa9");
 for(const x of [-9.8,-5.8,-1.8,2.2,6.2,10.2]){
  box(root,[.10,2.5,.19],[x,1.45,-7.74],"#5e7378");
  box(root,[3.8,2.15,.025],[x+1.97,1.45,-7.72],palette.glass);
 }
 // Warm zoning carpets and clear circulation lanes
 box(root,[8.2,.015,3.5],[-5.3,-.014,-4.9],"#bcae9f");
 box(root,[6.0,.015,3.4],[4.4,-.014,-4.95],"#aab8b7");
 box(root,[8.3,.015,3.4],[-5.3,-.014,2.75],"#b4ada1");
 box(root,[5.8,.015,3.4],[4.4,-.014,2.75],"#b6b2a9");
 box(root,[5.0,.016,3.0],[0,-.009,5.28],"#86989c");
 // Desk positions, with room for character standing front-side
 const desks=[[-6.6,-5,"Owner"],[-3.2,-5,"Finance"],[2.75,-5,"Support"],[5.15,-5,"Support"],[-6.4,1.15,"Tech"],[-3.25,1.15,"Creative"],[2.8,1.15,"Ops"]];
 for(const [x,z,name] of desks){desk(root,x,z,name);chair(root,x,z+1.10);}
 // Meeting room, with chairs placed off the walking corridor
 box(root,[3.6,.13,1.3],[0,.72,5.55],palette.wood,"Meeting desk");
 for(const x of [-1.25,0,1.25]){chair(root,x,6.65,Math.PI);chair(root,x,4.52,0);}
 obstacle(0,5.55,3.8,1.45);
 // Pantry / utility service
 box(root,[2.6,.73,.65],[8.6,.45,4.95],"#7d8c85","Pantry cabinet");
 box(root,[.5,.9,.58],[8.0,.65,5.8],"#abb5b7","Water dispenser");
 box(root,[.38,.18,.32],[8.0,1.16,5.8],"#6398ac");
 obstacle(8.6,4.95,2.6,.7);
 // Lounge for varied routines
 box(root,[2.1,.33,.88],[7.1,.37,-.72],"#8c9a92","Sofa seat");
 box(root,[2.1,.72,.20],[7.1,.78,-1.13],"#758580","Sofa back");
 box(root,[1.12,.11,.75],[7.1,.42,.5],"#a37c62","Coffee table");
 obstacle(7.1,-.6,2.2,.9);
 // Plants and decor
 for(const [x,z,s] of [[-9.4,-6.35,1.1],[-9.35,6.6,1],[9.7,-6.15,1],[5.9,6.7,.85],[-1.1,-6.9,.7],[.7,-6.9,.7]]) plant(root,x,z,s);
 officeSign(root,"",-.1,-7.55);
 // light warm accent features
 box(root,[4.6,.08,.09],[0,2.92,-7.6],"#ff5b2e");
 const ambient=new THREE.HemisphereLight("#e5f4ff","#8c8c80",2.1);scene.add(ambient);
 const sunlight=new THREE.DirectionalLight("#fff0da",2.5);sunlight.position.set(9,15,8);sunlight.castShadow=false;scene.add(sunlight);
 scene.background=new THREE.Color("#d5dbda");
 scene.fog=new THREE.Fog("#d5dbda",19,48);
 return root;
}
export function isBlocked(x,z){
 if(x<-9.7||x>9.7||z<-6.85||z>6.85)return true;
 return BLOCKED.some(o=>Math.abs(x-o.x)<o.w/2+.33&&Math.abs(z-o.z)<o.d/2+.33);
}
export function pathfind(start,goal){
 // A* on a coarse .55m grid; calculated only when a destination changes.
 const step=.55, key=(x,z)=>x+","+z;
 const cell=p=>[Math.round(p[0]/step),Math.round(p[1]/step)];
 const [sx,sz]=cell(start),[gx,gz]=cell(goal);
 const open=[{x:sx,z:sz,g:0,f:Math.hypot(gx-sx,gz-sz)}],came=new Map(),cost=new Map([[key(sx,sz),0]]);
 const directions=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
 let found=null,visits=0;
 while(open.length&&visits++<4000){
  open.sort((a,b)=>a.f-b.f);
  const current=open.shift(),ck=key(current.x,current.z);
  if(current.x===gx && current.z===gz){found=ck;break;}
  for(const [dx,dz] of directions){
   const nx=current.x+dx,nz=current.z+dz,nk=key(nx,nz);
   const xx=nx*step,zz=nz*step;
   if(isBlocked(xx,zz) && Math.hypot(nx-gx,nz-gz)>1.5)continue;
   if(dx!==0&&dz!==0&&(isBlocked((current.x+dx)*step,current.z*step)||isBlocked(current.x*step,(current.z+dz)*step)))continue;
   const next=current.g+Math.hypot(dx,dz);
   if(next>=(cost.get(nk)??Infinity))continue;
   cost.set(nk,next);came.set(nk,ck);
   open.push({x:nx,z:nz,g:next,f:next+Math.hypot(gx-nx,gz-nz)});
  }
 }
 if(!found)return [goal];
 const points=[];let cur=found;
 while(cur&&cur!==key(sx,sz)){const [x,z]=cur.split(",").map(Number);points.push([x*step,z*step]);cur=came.get(cur);}
 points.reverse();
 // Always finish at exact target if not colliding.
 if(!isBlocked(goal[0],goal[1]))points.push(goal);
 return points;
}
