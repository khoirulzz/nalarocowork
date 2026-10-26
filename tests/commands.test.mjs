import test from "node:test";
import assert from "node:assert/strict";
import { parseLocal,normalizePlan } from "../src/commands.js";
import { STAFF,PLACES } from "../src/roster.js";
test("unique staff IDs and world anchors",()=>{
 assert.equal(STAFF.length,9);assert.equal(new Set(STAFF.map(p=>p.id)).size,9);
 for(const p of STAFF)assert.ok(PLACES[p.home],p.id+" lacks desk");
});
test("Jaksen-style inter-employee command routes Fadil to Lukman",()=>{
 const plan=parseLocal("@fadil tolong samperin lukman dan suruh dia berdiri");
 assert.equal(plan.steps[0].action,"move_to");assert.equal(plan.steps[0].actor,"fadil");
 assert.equal(plan.steps[0].target,"lukman");assert.equal(plan.steps[1].actor,"lukman");
 assert.equal(plan.steps[1].action,"stand");
});
test("meeting room and gesture",()=>{
 assert.equal(parseLocal("@adi pergi ke ruang meeting").steps[0].location,"meeting");
 assert.equal(parseLocal("@ulum melambaikan tangan").steps[0].action,"wave");
});
test("unknown actions require AI instead of inventing success",()=>{
 assert.equal(parseLocal("@fadil ambil laptop dari meja"),null);
 assert.equal(parseLocal("@tidakada berdiri"),null);
});
test("reject malicious or made-up plan",()=>{
 assert.throws(()=>normalizePlan({steps:[{actor:"fadil",action:"delete_files",target:null,location:null}]}));
 assert.throws(()=>normalizePlan({steps:[{actor:"unknown",action:"sit",target:null,location:null}]}));
 assert.throws(()=>normalizePlan({steps:[{actor:"fadil",action:"sit",target:null,location:"vault"}]}));
});
