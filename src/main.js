import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { STAFF } from "./roster.js";
import { createOffice } from "./office.js";
import { OfficeSimulation } from "./behaviors.js";
import { interpretCommand,commandText } from "./commands.js";
import "./styles.css";

const $=id=>document.getElementById(id),view=$("viewport");
const scene=new THREE.Scene();createOffice(scene);
const camera=new THREE.PerspectiveCamera(42,1,.1,80);
camera.position.set(15,16,19);camera.lookAt(0,0,0);
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:"low-power"});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.25));renderer.setSize(view.clientWidth,view.clientHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.25;view.appendChild(renderer.domElement);
const labels=new CSS2DRenderer();labels.setSize(view.clientWidth,view.clientHeight);
labels.domElement.className="labels-layer";view.appendChild(labels.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.07;
controls.target.set(0,0,0);controls.minDistance=8;controls.maxDistance=34;
controls.maxPolarAngle=Math.PI*.46;controls.minPolarAngle=.28;
controls.update();
const logContainer=$("activity-log");let logCount=0,selection="ulum",engineReady=false;
function log(message){
 const line=document.createElement("div");line.className="log-item";
 const when=document.createElement("time");when.textContent=new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"});
 const desc=document.createElement("span");desc.textContent=message;
 line.append(when,desc);logContainer.prepend(line);logCount++;
 if(logCount>60){logContainer.lastElementChild?.remove();logCount--;}
}
const sim=new OfficeSimulation(scene,log);
function stateText(mode){
 return {working:"Bekerja",walking:"Berjalan",idle:"Santai",sitting:"Duduk",look:"Melihat sekitar",
  stretch:"Peregangan",wave:"Melambaikan tangan",talking:"Berbicara"}[mode]||mode;
}
function populatePeople(query=""){
 const parent=$("people-list");parent.replaceChildren();
 for(const profile of STAFF.filter(p=>(p.name+" "+p.role).toLowerCase().includes(query.toLowerCase()))){
  const p=sim.get(profile.id),row=document.createElement("button");row.className="person-row"+(profile.id===selection?" current":"");
  row.dataset.person=profile.id;
  const avatar=document.createElement("span");avatar.className="person-icon";avatar.style.background=profile.color;
  avatar.textContent=profile.name.slice(0,1);
  const info=document.createElement("span");info.className="person-info";
  const name=document.createElement("strong");name.textContent=profile.name;
  const role=document.createElement("small");role.textContent=profile.role;
  info.append(name,role);
  const status=document.createElement("span");status.className="person-status";status.dataset.statusFor=profile.id;
  status.textContent=stateText(p.mode);
  row.append(avatar,info,status);row.onclick=()=>select(profile.id);
  parent.appendChild(row);
 }
 $("people-count").textContent=STAFF.length+" orang";
}
function selectedDetails(){
 const p=sim.get(selection);if(!p)return;
 const container=$("selected-employee");container.replaceChildren();
 const top=document.createElement("div");top.className="employee-head";
 const avatar=document.createElement("div");avatar.className="large-avatar";avatar.style.background=p.p.color;avatar.textContent=p.p.name[0];
 const copy=document.createElement("div"),name=document.createElement("strong"),role=document.createElement("small");
 name.textContent=p.p.name;role.textContent=p.p.role;copy.append(name,role);top.append(avatar,copy);container.append(top);
 const status=document.createElement("p");status.className="selected-status";status.id="detail-status";
 status.textContent="Status · "+stateText(p.mode);container.append(status);
 const quick=document.createElement("div");quick.className="personal-actions";
 for(const [label,action] of [["Datangi","move_to"],["Berdiri","stand"],["Duduk","sit"],["Lambai","wave"]]){
  const b=document.createElement("button");b.textContent=label;
  b.onclick=()=>{if(action==="move_to")sim.dispatch({steps:[{actor:selection,action,target:null,location:"meeting"}]});
   else sim.dispatch({steps:[{actor:selection,action,target:null,location:null}]});};
  quick.append(b);
 }
 container.append(quick);
}
function select(id){
 selection=id;populatePeople($("people-search").value);selectedDetails();
 for(const p of sim.people.values())p.avatar.label.classList.toggle("selected",p.p.id===id);
}
$("people-search").addEventListener("input",e=>populatePeople(e.target.value));
$("reset-camera").addEventListener("click",()=>{camera.position.set(15,16,19);controls.target.set(0,0,0);controls.update();});
$("clear-log").addEventListener("click",()=>{logContainer.replaceChildren();logCount=0;});
let quality=0;
$("quality-btn").addEventListener("click",()=>{
 quality=(quality+1)%3;const presets=[["Auto",1.25],["Hemat",.8],["Detail",1.7]];
 const [name,dpr]=presets[quality];renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,dpr));
 renderer.setSize(view.clientWidth,view.clientHeight);$("quality-btn").textContent="Grafis: "+name;
});
for(const button of document.querySelectorAll("[data-prompt]")){
 button.addEventListener("click",()=>{$("command-input").value=button.dataset.prompt;$("command-input").focus();});
}
$("command-form").addEventListener("submit",async e=>{
 e.preventDefault();const field=$("command-input"),prompt=field.value.trim();if(!prompt)return;
 $("send-command").disabled=true;$("send-command").textContent="Memproses…";
 log("Owner: "+prompt);
 try{
  const result=await interpretCommand(prompt,engineReady);
  if(result.plan.steps.length===0)log("Tidak bisa: aksi belum tersedia di simulasi saat ini.");
  else {sim.dispatch(result.plan);log("Rencana "+result.provider+": "+result.plan.steps.map(commandText).join(" → "));}
  $("command-mode").textContent=result.provider;field.value="";
 }catch(err){log("Gagal: "+err.message);}
 finally{$("send-command").disabled=false;$("send-command").textContent="Kirim ↗";}
});
$("command-input").addEventListener("keydown",e=>{
 if(e.key==="Enter" && (e.ctrlKey||e.metaKey)){$("command-form").requestSubmit();}
});
async function probeGroq(){
 try{
  const ctr=new AbortController();const timeout=setTimeout(()=>ctr.abort(),1500);
  const res=await fetch("http://127.0.0.1:8787/api/health",{signal:ctr.signal});clearTimeout(timeout);
  const data=await res.json();engineReady=!!data.ready;
 }catch{engineReady=false;}
 $("ai-state").textContent=engineReady?"Groq siap":"Simulasi lokal";
 $("ai-state").classList.toggle("online",engineReady);
}
probeGroq(); // No repeated polling: avoids background network overhead.
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
renderer.domElement.addEventListener("pointerdown",e=>{
 if(e.button!==0)return;
 const rect=renderer.domElement.getBoundingClientRect();
 pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
 raycaster.setFromCamera(pointer,camera);
 const hits=raycaster.intersectObjects(scene.children,true);
 for(const hit of hits){let obj=hit.object;while(obj){
   if(obj.userData?.staffId){select(obj.userData.staffId);return;}
   obj=obj.parent;
 }}
});
function resize(){
 const w=view.clientWidth,h=view.clientHeight;if(!w||!h)return;
 camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);labels.setSize(w,h);
}
new ResizeObserver(resize).observe(view);
select("ulum");log("Kantor siap. Semua rutinitas karyawan berjalan lokal.");
let last=performance.now(),frames=0,windowTime=0,uiTimer=0;
function frame(now){
 requestAnimationFrame(frame);
 const dt=Math.min((now-last)/1000,.05);last=now;frames++;windowTime+=dt;uiTimer+=dt;
 sim.update(dt,now/1000);controls.update();renderer.render(scene,camera);labels.render(scene,camera);
 if(windowTime>=2){$("scene-fps").textContent=Math.round(frames/windowTime)+" FPS";frames=0;windowTime=0;}
 if(uiTimer>1.25){
  for(const el of document.querySelectorAll("[data-status-for]")){const p=sim.get(el.dataset.statusFor);if(p)el.textContent=stateText(p.mode);}
  const active=sim.get(selection);
  if(active && $("detail-status"))$("detail-status").textContent="Status · "+stateText(active.mode);
  uiTimer=0;
 }
}
requestAnimationFrame(frame);
