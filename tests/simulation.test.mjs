import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createOffice,getObject} from '../src/office.js';
import {OfficeSimulation} from '../src/behaviors.js';
import {parseLocal} from '../src/commands.js';
function setup() {
 const scene=new THREE.Scene();createOffice(scene);
 globalThis.document={createElement:()=>({style:{},setAttribute(){},className:'',dataset:{},textContent:''})};
 const logs=[];const sim=new OfficeSimulation(scene,text=>logs.push(text));delete globalThis.document;
 for(const p of sim.staff.values()){p.duration=1e6;p.route=[];}
 return {sim,logs};
}
function run(sim,until=100) {for(let t=0;t<until;t+=.05){sim.update(.05);if(!sim.active&&!sim.steps.length)return;}throw Error('Simulation did not finish: '+JSON.stringify(sim.active?.step));}
test('delegated push up completes only after messenger arrives and talks',()=>{
 const {sim,logs}=setup();sim.dispatch(parseLocal('@ulum datangi siswo dan suruh dia push up'));
 let talkedNearby=false;for(let t=0;t<100;t+=.05){sim.update(.05);if(sim.active?.step.action==='talk')talkedNearby=Math.hypot(sim.get('ulum').x-sim.get('siswo').x,sim.get('ulum').z-sim.get('siswo').z)<1.65;if(!sim.active&&!sim.steps.length)break;}
 assert.ok(talkedNearby,'messenger must reach recipient before delegating');
 assert.equal(sim.completed,3);assert.equal(sim.lastResult.ok,true);assert.ok(!logs.some(x=>x.includes('dibatalkan')));
 assert.ok(sim.exerciseSpace(sim.get('siswo'),[sim.get('siswo').x,sim.get('siswo').z]));
});
test('coffee is physically carried and transferred to recipient',()=>{
 const {sim}=setup();sim.dispatch(parseLocal('@agil buat kopi untuk ulum'));run(sim,130);
 assert.equal(sim.completed,2);const owner=sim.get('ulum');assert.ok(owner.holding?.startsWith('coffee_cup_'));assert.equal(getObject(owner.holding).owner,'ulum');assert.equal(sim.get('agil').holding,null);
});
test('meeting route traverses stairs and reaches the upper storey',()=>{
 const {sim}=setup();sim.dispatch(parseLocal('@fadil pergi ke ruang meeting'));run(sim,140);
 assert.equal(sim.get('fadil').level,1);assert.equal(sim.get('fadil').elevation,3.65);assert.equal(sim.lastResult.ok,true);
});
test('unavailable object cancels dependent actions without false success',()=>{
 const {sim,logs}=setup();sim.get('agil').holding='document_finance';getObject('document_finance').owner='agil';
 sim.dispatch(parseLocal('@agil buat kopi untuk ulum'));run(sim);
 assert.equal(sim.completed,0);assert.equal(sim.get('ulum').holding,null);assert.equal(sim.lastResult.ok,false);assert.ok(logs.some(x=>x.includes('dibatalkan')));
});
test('cleaning targets the actual desk and chair climbing settles on its seat',()=>{
 const {sim}=setup();sim.dispatch(parseLocal('@huda bersihkan meja lalu naiki kursi'));run(sim,100);
 assert.equal(sim.completed,2);assert.equal(sim.get('huda').perch,getObject('chair_creative').surface);assert.equal(sim.get('huda').mode,'balancing');
});

test('several named employees receive the same instruction',()=>{
 const {sim}=setup();sim.dispatch(parseLocal('@adi dan @sumanto melambai'));run(sim);assert.equal(sim.completed,2);
});
test('climbing then returning to desk includes a controlled descent',()=>{
 const {sim}=setup();sim.dispatch(parseLocal('@huda naiki kursi lalu kembali ke meja'));run(sim);
 assert.equal(sim.completed,2);assert.equal(sim.get('huda').perch,0);assert.equal(sim.get('huda').level,0);
});
test('upper-storey route also returns through stairs to the desk',()=>{
 const {sim}=setup();sim.dispatch(parseLocal('@fadil pergi ke ruang meeting lalu kembali ke meja'));run(sim,180);
 assert.equal(sim.completed,2);assert.equal(sim.get('fadil').level,0);assert.ok(Math.hypot(sim.get('fadil').x-1,sim.get('fadil').z+2.46)<.2);
});

test('delivered coffee can be consumed by the recipient and the empty cup retained',()=>{
 const {sim}=setup();sim.dispatch(parseLocal('@agil buat kopi untuk ulum'));run(sim,130);const cup=sim.get('ulum').holding;
 sim.dispatch(parseLocal('@ulum minum kopi'));run(sim);assert.equal(getObject(cup).filled,false);assert.equal(getObject(cup).owner,'ulum');
});
test('ten simulated minutes preserve separation and both assistants actually perform chores',()=>{
 const random=Math.random;let seed=709;
 Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 try {
  const {sim}=setup();for(const p of sim.staff.values())p.duration=3;
  const chores=new Set();
  for(let i=0;i<12000;i++) {
   sim.update(.05);for(const p of sim.staff.values())if(['cleaning','wiping'].includes(p.mode))chores.add(p.p.id);
   if(i%200===0){const people=[...sim.staff.values()];for(let a=0;a<people.length;a++)for(let b=a+1;b<people.length;b++)
    if(people[a].level===people[b].level)assert.ok(Math.hypot(people[a].x-people[b].x,people[a].z-people[b].z)>.58,'employees overlap');}
  }
  assert.ok(chores.has('agil'));assert.ok(chores.has('ulin'));
 } finally {Math.random=random;}
});
test('stop cancels a running dependent sequence',()=>{
 const {sim}=setup();sim.dispatch(parseLocal('@agil buat kopi untuk ulum'));sim.update(.05);
 sim.dispatch(parseLocal('@agil stop'));run(sim);assert.equal(sim.get('ulum').holding,null);assert.equal(sim.steps.length,0);
});
