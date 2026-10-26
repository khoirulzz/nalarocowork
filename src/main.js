import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {CSS2DRenderer} from "three/addons/renderers/CSS2DRenderer.js";
import {STAFF} from "./roster.js";
import {createOffice,WORLD_OBJECTS} from "./office.js";
import {OfficeSimulation} from "./behaviors.js";
import {interpretCommand,commandText} from "./commands.js";
import "./styles.css";
const $=id=>document.getElementById(id);
const view=$("viewport"),scene=new THREE.Scene();
createOffice(scene);
const camera=new THREE.PerspectiveCamera(43,1,.1,100);
camera.position.set(24,25,30);
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:"low-power"});
renderer.setPixelRatio(Math.min(1.3,window.devicePixelRatio||1));
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setSize(view.clientWidth,view.clientHeight);
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
view.append(renderer.domElement);
const labels=new CSS2DRenderer();labels.setSize(view.clientWidth,view.clientHeight);
labels.domElement.className="labels-layer";view.append(labels.domElement);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.08;controls.target.set(0,0,0);
controls.minDistance=11;controls.maxDistance=62;controls.minPolarAngle=.24;controls.maxPolarAngle=Math.PI*.47;
controls.update();
let selected="ulum",groqReady=false,logCount=0,quality=0,drawer=null;
const activity=$("activity-log");
function log(message){
 const el=document.createElement("div");el.className="log-item";
 const time=document.createElement("time");
 time.textContent=new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"});
 const text=document.createElement("span");text.textContent=message;el.append(time,text);
 activity.prepend(el);logCount++;
 if(logCount>120){activity.lastElementChild?.remove();logCount--;}
 $("activity-count").textContent=String(logCount);
}
const sim=new OfficeSimulation(scene,log);
const statuses={typing:"Mengetik",designing:"Mendesain",filing:"Memeriksa berkas",reading:"Membaca",thinking:"Berpikir",
 phone:"Menelepon",stretch:"Peregangan",cleaning:"Membersihkan",wiping:"Merapikan",carrying:"Membawa barang",
 rest:"Istirahat",idle:"Berdiri",walking:"Berjalan",talking:"Berbicara",wave:"Melambaikan tangan",reaching:"Mengambil",
 inspecting:"Memeriksa",making_coffee:"Membuat kopi"};
const statusOf=x=>statuses[x]||"Bekerja";
function renderStaff(){
 const list=$("people-list");list.replaceChildren();
 const query=$("people-search").value.trim().toLowerCase();
 for(const p of STAFF.filter(p=>(p.name+" "+p.role).toLowerCase().includes(query))){
  const button=document.createElement("button");button.className="person-row"+(selected===p.id?" current":"");
  button.type="button";button.title=p.name+" — "+p.role;
  const icon=document.createElement("span");icon.className="person-avatar";icon.textContent=p.name.slice(0,1);
  const info=document.createElement("span");info.className="person-info";
  const name=document.createElement("strong");name.textContent=p.name;
  const role=document.createElement("small");role.textContent=p.role;
  info.append(name,role);button.append(icon,info);
  button.onclick=()=>selectStaff(p.id);list.appendChild(button);
 }
}
function renderSelection(){
 const p=sim.get(selected),root=$("selected-employee");root.replaceChildren();
 const top=document.createElement("div");top.className="employee-head";
 const avatar=document.createElement("div");avatar.className="large-avatar";avatar.textContent=p.p.name[0];
 const bio=document.createElement("div"),name=document.createElement("strong"),role=document.createElement("small");
 name.textContent=p.p.name;role.textContent=p.p.role;bio.append(name,role);top.append(avatar,bio);
 const status=document.createElement("p");status.className="selected-status";status.id="detail-status";
 status.textContent=statusOf(p.mode);
 const tools=document.createElement("div");tools.className="personal-actions";
 for(const [label,action] of [["Ke rapat","move_to"],["Berdiri","stand"],["Duduk","sit"],["Lambai","wave"]]){
  const button=document.createElement("button");button.textContent=label;button.type="button";
  button.onclick=()=>sim.dispatch({steps:[{actor:selected,action,
   target:null,location:action==="move_to"?"meeting":null,objectId:null}]});
  tools.append(button);
 }
 root.append(top,status,tools);
}
function selectStaff(id){
 selected=id;renderStaff();renderSelection();
 for(const p of sim.staff.values())p.avatar.label.classList.toggle("selected",p.p.id===id);
}
function setCollapsed(which,collapsed){
 $("layout").classList.toggle(which+"-closed",collapsed);
 const btn=$(which==="people"?"toggle-people":"toggle-command");
 btn.setAttribute("aria-label",collapsed?"Buka panel "+which:"Tutup panel "+which);
 btn.setAttribute("aria-expanded",String(!collapsed));
 if(which==="command" && collapsed)closeDrawer();
}
for(const side of ["people","command"]){
 $(side==="people"?"toggle-people":"toggle-command").addEventListener("click",()=>{
  const closed=$("layout").classList.contains(side+"-closed");setCollapsed(side,!closed);
 });
}
$("people-search").addEventListener("input",renderStaff);
$("reset-camera").onclick=()=>{camera.position.set(24,25,30);controls.target.set(0,0,0);controls.update();};
const graphics=[["Auto",1.3],["Hemat",.8],["Detail",1.7]];
$("quality-btn").onclick=()=>{
 quality=(quality+1)%graphics.length;
 const [label,dpr]=graphics[quality];renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,dpr));
 resize();$("quality-btn").textContent="Grafis: "+label;
};
function openDrawer(type){
 if($("layout").classList.contains("command-closed"))setCollapsed("command",false);
 drawer=type;$("sidebar-scrim").hidden=false;
 $("sidebar-drawer").classList.add("open");
 $("sidebar-drawer").setAttribute("aria-hidden","false");
 $("drawer-title").textContent=type==="objects"?"Objek kantor":"Riwayat";
 $("activity-log").hidden=type!=="activity";$("drawer-tools").hidden=type!=="activity";
 $("object-browser").hidden=type!=="objects";
 if(type==="objects")renderObjects();
 $("close-drawer").focus();
}
function closeDrawer(){
 drawer=null;$("sidebar-drawer").classList.remove("open");
 $("sidebar-drawer").setAttribute("aria-hidden","true");$("sidebar-scrim").hidden=true;
}
$("open-activity").onclick=()=>openDrawer("activity");
$("open-objects").onclick=()=>openDrawer("objects");
$("close-drawer").onclick=closeDrawer;
$("sidebar-scrim").onclick=closeDrawer;
$("clear-log").onclick=()=>{activity.replaceChildren();logCount=0;$("activity-count").textContent="";};
window.addEventListener("keydown",e=>{if(e.key==="Escape"&&drawer)closeDrawer();});
function renderObjects(){
 const query=$("object-search").value.toLowerCase().trim(),root=$("object-list");root.replaceChildren();
 for(const o of WORLD_OBJECTS.values()){
  if(query && !(o.id+" "+o.type).toLowerCase().includes(query))continue;
  const row=document.createElement("div");row.className="object-row";
  const info=document.createElement("div"),title=document.createElement("strong");
  title.textContent=o.id;const secondary=document.createElement("small");
  secondary.textContent=o.type+(o.owner?" · dipegang "+o.owner:"");
  info.append(title,secondary);
  const copy=document.createElement("button");copy.type="button";copy.textContent="Salin";
  copy.onclick=async()=>{try{await navigator.clipboard.writeText(o.id);}catch{
   $("command-input").value+=(" "+o.id);closeDrawer();
  }};
  row.append(info,copy);root.append(row);
 }
}
$("object-search").addEventListener("input",renderObjects);
const form=$("command-form"),field=$("command-input"),send=$("send-command");
form.addEventListener("submit",async event=>{
 event.preventDefault();const prompt=field.value.trim();if(!prompt)return;
 send.disabled=true;send.textContent="Memproses";
 log("Owner: "+prompt);
 try{
  const {plan,provider,usage}=await interpretCommand(prompt,groqReady);
  if(!plan.steps.length)log("Permintaan belum dapat dilakukan.");
  else {sim.dispatch(plan);log(plan.steps.map(commandText).join(" → "));field.value="";}
  $("command-mode").textContent=provider+(usage?.total_tokens?" · "+usage.total_tokens+" token":"");
 }catch(e){log("Gagal: "+e.message);openDrawer("activity");}
 finally{send.disabled=false;send.textContent="Kirim ↗";}
});
field.addEventListener("keydown",event=>{if(event.key==="Enter"&&(event.ctrlKey||event.metaKey)){event.preventDefault();form.requestSubmit();}});
async function checkProvider(){
 try{
  const res=await fetch("/api/health",{cache:"no-store"});
  if(!res.ok)throw Error();
  const data=await res.json();groqReady=!!data.ready;
  $("connection-status").textContent=groqReady?"Groq siap":"Groq belum dikonfigurasi";
 }catch{groqReady=false;$("connection-status").textContent="Groq tidak terhubung";}
}
checkProvider();
document.addEventListener("visibilitychange",()=>{if(!document.hidden)checkProvider();});
window.addEventListener("focus",()=>checkProvider());
const ray=new THREE.Raycaster(),cursor=new THREE.Vector2();
let pointerStart=null;
renderer.domElement.addEventListener("pointerdown",e=>{pointerStart=[e.clientX,e.clientY];});
renderer.domElement.addEventListener("pointerup",e=>{
 if(!pointerStart||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>7)return;
 const rect=renderer.domElement.getBoundingClientRect();
 cursor.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
 ray.setFromCamera(cursor,camera);
 for(const hit of ray.intersectObjects(scene.children,true)){
  let obj=hit.object;while(obj){
   if(obj.userData?.staffId){selectStaff(obj.userData.staffId);return;}
   obj=obj.parent;
  }
  if(hit.object.userData?.objectId){
   const id=hit.object.userData.objectId;
   $("object-search").value=id;openDrawer("objects");return;
  }
 }
});
function resize(){
 const w=view.clientWidth,h=view.clientHeight;if(!w||!h)return;
 camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);labels.setSize(w,h);
}
new ResizeObserver(resize).observe(view);
selectStaff("ulum");log("Simulasi kantor aktif");
let last=performance.now(),elapsed=0,frames=0,uiTick=0;
function frame(now){
 requestAnimationFrame(frame);
 const dt=Math.min((now-last)/1000,.05);last=now;
 sim.update(dt);controls.update();renderer.render(scene,camera);labels.render(scene,camera);
 elapsed+=dt;frames++;uiTick+=dt;
 if(elapsed>=2){$("scene-fps").textContent=Math.round(frames/elapsed)+" FPS";frames=0;elapsed=0;}
 if(uiTick>=1.2){
  const p=sim.get(selected);
  if(p&&$("detail-status"))$("detail-status").textContent=statusOf(p.mode)+(p.holding?" · "+p.holding:"");
  uiTick=0;
 }
}
requestAnimationFrame(frame);
