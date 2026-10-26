import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {STAFF,PLACES} from "../src/roster.js";
import {createOffice,WORLD_OBJECTS,getObject,isBlocked,pathfind} from "../src/office.js";
import {parseLocal,normalizePlan} from "../src/commands.js";
createOffice(new THREE.Scene());
test("nine unique employees and workspace anchors",()=>{
 assert.equal(STAFF.length,9);assert.equal(new Set(STAFF.map(s=>s.id)).size,9);
 for(const s of STAFF)assert.ok(PLACES[s.home],"missing "+s.id);
});
test("simulated 3D assets have stable IDs and functions",()=>{
 for(const id of ["desk_owner","chair_finance","monitor_technical","coffee_machine",
 "document_finance","tablet_creative","broom_utility","meeting_table","printer_shared"])
 assert.ok(getObject(id),"missing "+id);
 assert.ok(WORLD_OBJECTS.size>=30);
 assert.equal(getObject("document_finance").portable,true);
 assert.ok(getObject("coffee_machine").actions.includes("make_coffee"));
});
test("office has enclosed partitions and walkable doorways",()=>{
 assert.equal(isBlocked(-8,-7),true);
 assert.equal(isBlocked(-11,-3),false);
 assert.equal(isBlocked(11,-3),false);
 const path=pathfind(PLACES.lobby,PLACES.owner);
 assert.ok(path.length>10,"could not find route through owner door");
 for(const [x,z] of path.slice(0,-1)) assert.equal(isBlocked(x,z),false,"wall collision at "+x+","+z);
});
test("delegate inter-employee instruction",()=>{
 const s=parseLocal("@fadil samperin lukman dan suruh dia berdiri").steps;
 assert.deepEqual(s.map(x=>x.action),["move_to","stand"]);
 assert.equal(s[0].target,"lukman");assert.equal(s[1].actor,"lukman");
});
test("local coffee workflow and area cleaning",()=>{
 const s=parseLocal("@agil buat kopi untuk ulum").steps;
 assert.deepEqual(s.map(x=>x.action),["make_coffee","move_to","place_object"]);
 assert.equal(s[1].target,"ulum");
 const c=parseLocal("@ulin bersihkan ruang meeting").steps;
 assert.equal(c[0].action,"clean_area");assert.equal(c[0].location,"meeting");
});
test("taking personal office objects and placing them",()=>{
 const s=parseLocal("@fadil ambil dokumen finance lalu taruh di ruang owner").steps;
 assert.deepEqual(s.map(x=>x.action),["take_object","place_object"]);
 assert.equal(s[0].objectId,"document_finance");assert.equal(s[1].location,"owner");
});
test("unavailable actions and unknown employees do not pretend to succeed",()=>{
 assert.equal(parseLocal("@fadil terbang ke bulan"),null);
 assert.equal(parseLocal("@random berdiri"),null);
 assert.throws(()=>normalizePlan({steps:[{actor:"fadil",action:"delete_files",target:null,location:null,objectId:null}]}));
 assert.throws(()=>normalizePlan({steps:[{actor:"fadil",action:"take_object",target:null,location:null,objectId:"nonexistent"}]}));
});

test("routes never finish by clipping through registered obstacles",()=>{
 const routes=[
  [PLACES.lobby,PLACES.owner],
  [PLACES.finance,PLACES.meeting],
  [PLACES.technical,PLACES.pantry],
  [PLACES.supportA,PLACES.creative]
 ];
 for(const [start,end] of routes){
  const nodes=pathfind(start,end);
  assert.ok(nodes.length>2,"missing route from "+start+" to "+end);
  let last=start;
  for(const next of nodes){
   const length=Math.hypot(next[0]-last[0],next[1]-last[1]);
   for(let i=1;i<=Math.ceil(length/.12);i++){
    const t=i/Math.ceil(length/.12);
    const x=last[0]+(next[0]-last[0])*t,z=last[1]+(next[1]-last[1])*t;
    assert.equal(isBlocked(x,z),false,"route segment hit obstacle at "+x+","+z);
   }
   last=next;
  }
 }
});
