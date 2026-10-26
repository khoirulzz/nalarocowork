import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {makeStep,createPlanSchema} from '../src/action-contract.js';
import {normalizePlan,parseLocal} from '../src/commands.js';
import {officeApi,parseModelPlan} from '../server/groq.mjs';
const plan=(...steps)=>({steps});
test('delegation preserves actor and complete action ordering',()=>{
 const s=normalizePlan(parseLocal('@ulum datangi siswo dan suruh dia push up')).steps;
 assert.deepEqual(s.map(x=>[x.actor,x.action]),[['ulum','move_to'],['ulum','talk'],['siswo','push_up']]);
 const multiple=normalizePlan(parseLocal('@agil buat kopi untuk ulum lalu @huda bersihkan meja')).steps;
 assert.equal(multiple.at(-1).actor,'huda');assert.equal(multiple.at(-1).objectId,'desk_creative');
});
test('local interpreter refuses partial success for unsupported compound instructions',()=>{
 assert.equal(parseLocal('@ulum datangi siswo lalu terbang ke bulan'),null);
 assert.equal(parseLocal('@ulum datangi siswo dan suruh dia terbang'),null);
});
test('strict boundary rejects unknown fields, malformed values, and missing destinations',()=>{
 const good=makeStep('ulum','wave');assert.deepEqual(parseModelPlan(JSON.stringify(plan(good))),plan(good));
 assert.throws(()=>parseModelPlan(JSON.stringify(plan({...good,extra:'run code'}))));
 assert.throws(()=>parseModelPlan(JSON.stringify(plan({actor:'ulum',action:'wave'}))));
 assert.throws(()=>normalizePlan(plan(makeStep('ulum','move_to'))));
 assert.throws(()=>normalizePlan(plan(makeStep('ulum','climb_object',null,null,'coffee_machine'))));
 assert.throws(()=>normalizePlan(plan(makeStep('ulum','take_object',null,null,'desk_owner'))));
 assert.throws(()=>normalizePlan(plan({...good,duration:Infinity})));
 assert.throws(()=>normalizePlan({steps:[],code:'anything'}));
 assert.throws(()=>parseModelPlan('{"steps":['));
 assert.equal(createPlanSchema(['cup']).properties.steps.items.additionalProperties,false);
});
test('adaptive motions are bounded and contain only known pose primitives',()=>{
 const motion=[{pose:'kneel',seconds:2,repeat:1},{pose:'wipe',seconds:1,repeat:4},{pose:'nod',seconds:1,repeat:1}];
 assert.equal(normalizePlan(plan(makeStep('huda','animate',null,null,null,null,motion))).steps[0].motion.length,3);
 for(const invalid of [[{pose:'eval()',seconds:1,repeat:1}],[{pose:'wave',seconds:8,repeat:8}],[{pose:'wave',seconds:1,repeat:1.5}]])
  assert.throws(()=>normalizePlan(plan(makeStep('huda','animate',null,null,null,null,invalid))));
});
async function apiCall(request,body={prompt:'@ulum melambai'}) {
 const handler=officeApi({GROQ_API_KEY:'test-key'},request);
 const req=Readable.from([Buffer.from(JSON.stringify(body))]);req.url='/api/plan';req.method='POST';req.headers={'content-type':'application/json',origin:'http://localhost:5173'};
 let status,data;await handler(req,{writeHead(code){status=code;},end(text){data=JSON.parse(text);}});return {status,data};
}
const response=content=>({ok:true,status:200,json:async()=>({choices:[{finish_reason:'stop',message:{content}}]})});
test('invalid upstream JSON is repaired once, validated again and never dispatched early',async()=>{
 let calls=0;const valid=JSON.stringify(plan(makeStep('ulum','wave')));
 const result=await apiCall(async()=>response(++calls===1?'{"steps":[':valid));
 assert.equal(calls,2);assert.equal(result.status,200);assert.equal(result.data.plan.steps[0].action,'wave');
});
test('two invalid responses return a useful 422 without a plan',async()=>{
 let calls=0;const r=await apiCall(async()=>{calls++;return response('{');});
 assert.equal(calls,2);assert.equal(r.status,422);assert.equal(r.data.plan,undefined);
});
test('provider without json_schema falls back to JSON mode with the same validator',async()=>{
 const formats=[];const r=await apiCall(async(url,options)=>{
  formats.push(JSON.parse(options.body).response_format.type);
  return formats.length===1?{ok:false,status:400,json:async()=>({error:{message:'json_schema unsupported'}})}:response(JSON.stringify(plan(makeStep('ulum','stand'))));
 });assert.deepEqual(formats,['json_schema','json_object']);assert.equal(r.status,200);
});
