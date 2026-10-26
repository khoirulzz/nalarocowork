import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {CSS2DRenderer} from 'three/addons/renderers/CSS2DRenderer.js';
import {STAFF} from './roster.js';
import {createOffice,WORLD_OBJECTS} from './office.js';
import {OfficeSimulation} from './behaviors.js';
import {interpretCommand,commandText} from './commands.js';
import {icon} from './icons.js';
import './styles.css';
const $=id=>document.getElementById(id);
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
const view=$('viewport'),scene=new THREE.Scene(),world=createOffice(scene);
const camera=new THREE.PerspectiveCamera(41,1,.1,150),homeCamera=new THREE.Vector3(23,25,29),homeTarget=new THREE.Vector3(0,.8,0);
camera.position.copy(homeCamera);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});
renderer.setPixelRatio(Math.min(1.3,devicePixelRatio||1));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;view.append(renderer.domElement);
renderer.domElement.setAttribute('aria-label','Kantor 3D. Gunakan kontrol kamera untuk zoom atau pilih karyawan dari toolbar.');
const labels=new CSS2DRenderer();labels.domElement.className='labels-layer';view.append(labels.domElement);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.09;controls.target.copy(homeTarget);controls.enableZoom=true;controls.zoomSpeed=.8;
controls.minDistance=5;controls.maxDistance=67;controls.minPolarAngle=.25;controls.maxPolarAngle=Math.PI*.46;controls.update();
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
if(reducedMotion.matches){controls.enableDamping=false;$('pause-sim').checked=true;}
let selected='ulum',groqReady=false,logCount=0,activePanel=null,returnFocus=null,noticeTimer=null,cameraTween=null;
const dialog=$('office-panel');
function notice(message) {
 $('notice').textContent=message;$('notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').hidden=true,6000);
}
function log(message) {
 const el=document.createElement('div');el.className='log-item';
 const time=document.createElement('time');time.textContent=new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
 const text=document.createElement('span');text.textContent=message;el.append(time,text);$('activity-log').prepend(el);
 if(++logCount>150){$('activity-log').lastElementChild?.remove();logCount--;}
 if(!/antrean/.test(message))notice(message);
}
const sim=new OfficeSimulation(scene,log);sim.paused=reducedMotion.matches;
const statuses={typing:'Mengetik',designing:'Mendesain',filing:'Memeriksa berkas',reading:'Membaca',thinking:'Berpikir',phone:'Menelepon',
 stretch:'Peregangan',cleaning:'Menyapu',wiping:'Mengelap',carrying:'Membawa barang',rest:'Istirahat',idle:'Berdiri',seated:'Duduk',
 walking:'Berjalan',stairs:'Melewati tangga',talking:'Berbicara',wave:'Melambai',reaching:'Mengambil',inspecting:'Memeriksa',
 making_coffee:'Membuat kopi',push_up:'Push up',climbing:'Menaiki kursi',balancing:'Berdiri di kursi',calculating:'Menghitung',sketching:'Membuat sketsa',
 repairing:'Memeriksa peralatan',listening:'Mendengarkan',drinking:'Minum',look:'Melihat sekitar',nodding:'Mengangguk',pointing:'Menunjuk',bending:'Membungkuk',kneeling:'Berlutut',squatting:'Jongkok',celebrating:'Merayakan'};
function renderStaff() {
 const root=$('people-list');root.replaceChildren();const query=$('people-search').value.trim().toLowerCase();
 for(const p of STAFF.filter(p=>(p.name+' '+p.role).toLowerCase().includes(query))) {
  const button=document.createElement('button');button.type='button';button.className='person-row'+(selected===p.id?' current':'');button.setAttribute('aria-pressed',String(selected===p.id));
  const avatar=document.createElement('span');avatar.className='person-avatar';avatar.textContent=p.name[0];
  const info=document.createElement('span');info.className='person-info';const name=document.createElement('strong'),role=document.createElement('small');
  name.textContent=p.name;role.textContent=p.role;info.append(name,role);button.append(avatar,info);button.insertAdjacentHTML('beforeend',icon('chevron'));
  button.onclick=()=>{selectStaff(p.id);$('selected-employee').scrollIntoView({block:'nearest',behavior:'instant'});};root.append(button);
 }
 if(!root.children.length){const p=document.createElement('p');p.textContent='Karyawan tidak ditemukan.';root.append(p);}
}
function renderSelection() {
 const p=sim.get(selected),root=$('selected-employee');root.replaceChildren();
 const top=document.createElement('div');top.className='employee-head';const avatar=document.createElement('div');avatar.className='large-avatar';avatar.textContent=p.p.name[0];
 const bio=document.createElement('div'),name=document.createElement('strong'),role=document.createElement('small');name.textContent=p.p.name;role.textContent=p.p.role;bio.append(name,role);top.append(avatar,bio);
 const status=document.createElement('p');status.className='selected-status';status.id='detail-status';status.textContent=statuses[p.mode]||p.mode;
 const tools=document.createElement('div');tools.className='personal-actions';
 const focus=document.createElement('button');focus.className='focus-action';focus.innerHTML=icon('focus')+'Dekati';focus.onclick=()=>{focusStaff(selected);closePanel();};tools.append(focus);
 for(const [label,action] of [['Berdiri','stand'],['Duduk','sit'],['Ke meja','return_to_desk']]) {
  const button=document.createElement('button');button.type='button';button.textContent=label;
  button.onclick=()=>{sim.dispatch({steps:[{actor:selected,action,target:null,location:null,objectId:null}]});closePanel();};tools.append(button);
 }
 root.append(top,status,tools);
}
function selectStaff(id,{open=false}={}) {
 selected=id;renderStaff();renderSelection();for(const p of sim.staff.values())p.avatar.label.classList.toggle('selected',p.p.id===id);
 if(open)openPanel('people');
}
function openPanel(type) {
 if(dialog.open&&type===activePanel){closePanel();return;}
 returnFocus=document.activeElement;activePanel=type;
 const titles={people:'Karyawan',command:'Perintah',objects:'Objek',history:'Riwayat',settings:'Pengaturan'};
 $('panel-title').textContent=titles[type];
 document.querySelectorAll('.panel-body').forEach(el=>el.hidden=el.id!=='panel-'+type);
 document.querySelectorAll('[data-panel]').forEach(btn=>btn.setAttribute('aria-expanded',String(btn.dataset.panel===type)));
 if(type==='objects')renderObjects();
 if(!dialog.open)dialog.showModal();
 if(type==='command')$('command-input').focus();else $('close-panel').focus();
}
function closePanel(){dialog.close();}
dialog.addEventListener('close',()=>{activePanel=null;document.querySelectorAll('[data-panel]').forEach(b=>b.setAttribute('aria-expanded','false'));returnFocus?.focus();});
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closePanel();}});
$('close-panel').onclick=closePanel;
document.querySelectorAll('[data-panel]').forEach(btn=>btn.onclick=()=>openPanel(btn.dataset.panel));
$('people-search').oninput=renderStaff;$('clear-log').onclick=()=>{$('activity-log').replaceChildren();logCount=0;};
function renderObjects() {
 const query=$('object-search').value.trim().toLowerCase(),root=$('object-list');root.replaceChildren();
 for(const o of WORLD_OBJECTS.values()) {
  if(query&&!(o.id+' '+o.type).toLowerCase().includes(query))continue;
  const row=document.createElement('div');row.className='object-row';const info=document.createElement('div'),title=document.createElement('strong'),detail=document.createElement('small');
  title.textContent=o.id;detail.textContent=[o.type,o.owner?'Dibawa '+o.owner:o.level?'Lantai atas':'Lantai dasar',o.portable?'Bisa diambil':null].filter(Boolean).join(' · ');info.append(title,detail);
  const button=document.createElement('button');button.type='button';button.innerHTML=icon('copy');button.setAttribute('aria-label','Salin ID '+o.id);
  button.onclick=async()=>{try{await navigator.clipboard.writeText(o.id);notice('ID disalin: '+o.id);}catch{$('command-input').value+=' '+o.id;openPanel('command');}};
  row.append(info,button);root.append(row);
 }
 if(!root.children.length){const p=document.createElement('p');p.textContent='Objek tidak ditemukan.';root.append(p);}
}
$('object-search').oninput=renderObjects;
function flyTo(position,target) {
 if(reducedMotion.matches){camera.position.copy(position);controls.target.copy(target);controls.update();return;}
 cameraTween={start:performance.now(),from:camera.position.clone(),to:position.clone(),targetFrom:controls.target.clone(),targetTo:target.clone()};
}
function focusStaff(id) {
 const p=sim.get(id),target=new THREE.Vector3(p.x,p.elevation+1.1,p.z),direction=camera.position.clone().sub(controls.target).normalize();
 flyTo(target.clone().addScaledVector(direction,10),target);
}
function zoom(factor){cameraTween=null;const offset=camera.position.clone().sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(offset);controls.update();}
$('zoom-in').onclick=()=>zoom(.8);$('zoom-out').onclick=()=>zoom(1.25);
$('reset-camera').onclick=()=>flyTo(homeCamera,homeTarget);
$('graphics').onchange=()=>{renderer.setPixelRatio(Math.min(devicePixelRatio||1,Number($('graphics').value)));resize();};
$('show-names').onchange=()=>document.body.classList.toggle('all-names',$('show-names').checked);
function setUpper(visible) {world.upper.visible=visible;for(const p of sim.staff.values())if(p.level===1){p.avatar.root.visible=visible;}}
$('show-upper').onchange=()=>setUpper($('show-upper').checked);
$('pause-sim').onchange=()=>sim.paused=$('pause-sim').checked;
const field=$('command-input'),send=$('send-command');
$('command-form').onsubmit=async event=>{
 event.preventDefault();const prompt=field.value.trim();if(!prompt)return;
 send.disabled=true;send.textContent='Memproses';$('command-error').hidden=true;log('Owner: '+prompt);
 try {
  const {plan,provider}=await interpretCommand(prompt,groqReady,sim.snapshot());
  if(!plan.steps.length)throw Error('Permintaan ini belum dapat dilakukan. Coba sebutkan karyawan, objek, dan tindakannya.');
  sim.dispatch(plan);log(plan.steps.map(commandText).join(' → '));field.value='';$('command-mode').textContent=provider;closePanel();
  if(sim.paused)notice('Perintah masuk antrean. Lanjutkan simulasi dari Pengaturan.');
 } catch(error){$('command-error').textContent=error.message;$('command-error').hidden=false;}
 finally{send.disabled=false;send.textContent='Kirim';}
};
field.onkeydown=event=>{if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();$('command-form').requestSubmit();}};
async function checkProvider(){try{const r=await fetch('/api/health',{cache:'no-store'});if(!r.ok)throw Error();const data=await r.json();groqReady=!!data.ready;$('connection-status').textContent=groqReady?'Terhubung':'Belum dikonfigurasi';}catch{groqReady=false;$('connection-status').textContent='Tidak terhubung';}}
checkProvider();window.addEventListener('focus',checkProvider);
const ray=new THREE.Raycaster(),cursor=new THREE.Vector2();let pointerStart=null,hovered=null;
function hitAt(event) {
 const rect=renderer.domElement.getBoundingClientRect();cursor.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(cursor,camera);
 for(const hit of ray.intersectObjects(scene.children,true)) {
  let object=hit.object,visible=true,parent=object;while(parent){if(!parent.visible)visible=false;parent=parent.parent;}
  if(!visible||object.material?.transparent)continue;
  while(object){if(object.userData.staffId)return {staff:object.userData.staffId};if(object.userData.objectId)return {object:object.userData.objectId};object=object.parent;}
  return null;
 }
 return null;
}
renderer.domElement.addEventListener('pointerdown',e=>{pointerStart=[e.clientX,e.clientY];cameraTween=null;});
renderer.domElement.addEventListener('wheel',()=>cameraTween=null,{passive:true});
renderer.domElement.addEventListener('pointermove',e=>{
 if(e.buttons)return;const hit=hitAt(e);if(hovered)sim.get(hovered).avatar.label.classList.remove('hovered');hovered=hit?.staff||null;
 if(hovered)sim.get(hovered).avatar.label.classList.add('hovered');renderer.domElement.style.cursor=hit?'pointer':'grab';
});
renderer.domElement.addEventListener('pointerup',e=>{
 if(e.button!==0||!pointerStart||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>6)return;
 const hit=hitAt(e);if(hit?.staff)selectStaff(hit.staff,{open:true});
 else if(hit?.object){$('object-search').value=hit.object;openPanel('objects');}
});
function resize(){const w=view.clientWidth,h=view.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);labels.setSize(w,h);}
new ResizeObserver(resize).observe(view);resize();selectStaff('ulum');
let last=performance.now(),uiTick=0,elapsed=0,frames=0;
function frame(now) {
 requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;
 if(document.hidden)return;
 sim.update(dt);
 if(cameraTween){const t=Math.min(1,(now-cameraTween.start)/350),e=1-Math.pow(1-t,3);camera.position.lerpVectors(cameraTween.from,cameraTween.to,e);controls.target.lerpVectors(cameraTween.targetFrom,cameraTween.targetTo,e);if(t===1)cameraTween=null;}
 controls.update();
 for(const p of sim.staff.values()) {
  p.avatar.root.visible=p.level!==1||$('show-upper').checked;
  const show=p.p.id===selected||p.p.id===hovered||$('show-names').checked;
  p.avatar.label.style.display=show?'':'none';
 }
 renderer.render(scene,camera);labels.render(scene,camera);uiTick+=dt;elapsed+=dt;frames++;
 if(uiTick>.3){$('zoom-value').textContent=Math.round(homeCamera.distanceTo(homeTarget)/camera.position.distanceTo(controls.target)*100)+'%';
  const p=sim.get(selected);$('detail-status').textContent=(statuses[p.mode]||p.mode)+(p.holding?' · '+p.holding:'');uiTick=0;}
 if(elapsed>2){$('scene-fps').textContent=Math.round(frames/elapsed)+' FPS';elapsed=0;frames=0;}
}
requestAnimationFrame(frame);
// Exposed only by the local Vite development server for deterministic simulation checks.
if(import.meta.env.DEV)window.__office={sim,scene,camera,controls,world,focusStaff,openPanel,renderer};
