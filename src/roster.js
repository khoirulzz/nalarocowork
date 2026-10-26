// Art-directed voxel profiles. No personal photographs or biometric templates.
export const STAFF = [
  {id:"ulum",name:"Ulum",role:"CEO / Owner",team:"Management",color:"#303641",shirt:"#f3f1ec",hair:"#17191d",skin:"#c89470",pants:"#25282f",hairStyle:"wavy",face:"soft",accessory:"lanyard",home:"owner",wander:0.08},
  {id:"adi",name:"Adi",role:"Customer Support",team:"Customer Support",color:"#426879",shirt:"#426879",hair:"#15191c",skin:"#b98265",pants:"#24303d",hairStyle:"quiff",face:"gentle",accessory:"headset",home:"supportA",wander:0.12},
  {id:"agil",name:"Agil",role:"Office Boy",team:"General Affairs",color:"#54705e",shirt:"#54705e",hair:"#19191b",skin:"#c38d6f",pants:"#36443a",hairStyle:"curly",face:"round",accessory:"broom",home:"pantry",wander:0.83},
  {id:"ulin",name:"Ulin",role:"Office Boy",team:"General Affairs",color:"#b5ab8c",shirt:"#b5ab8c",hair:"#151619",skin:"#b67e60",pants:"#414b50",hairStyle:"fringe",face:"slim",accessory:"tray",home:"utility",wander:0.73},
  {id:"lukman",name:"Lukman",role:"Accountant",team:"Finance",color:"#c6d6db",shirt:"#d2dce2",hair:"#18191c",skin:"#c19274",pants:"#303640",hairStyle:"tightcurl",face:"long",accessory:"tie",home:"finance",wander:0.08},
  {id:"siswo",name:"Siswo",role:"Technician",team:"Technical",color:"#547087",shirt:"#547087",hair:"#151517",skin:"#b88461",pants:"#2e3945",hairStyle:"short",face:"square",accessory:"tool",home:"technical",wander:0.50},
  {id:"huda",name:"Huda",role:"Designer",team:"Creative",color:"#986e5d",shirt:"#986e5d",hair:"#151619",skin:"#c58e6b",pants:"#323942",hairStyle:"textured",face:"slim",accessory:"tablet",home:"creative",wander:0.20},
  {id:"fadil",name:"Fadil",role:"Office Assistant",team:"Operations",color:"#d67a51",shirt:"#d67a51",hair:"#141617",skin:"#b68262",pants:"#34404c",hairStyle:"curlyfront",face:"angular",accessory:"notebook",home:"operations",wander:0.62},
  {id:"sumanto",name:"Sumanto",role:"Customer Support",team:"Customer Support",color:"#555970",shirt:"#555970",hair:"#14171c",skin:"#b87e60",pants:"#262b3b",hairStyle:"swept",face:"smile",accessory:"headset",home:"supportB",wander:0.18}
];
export const PLACES = {
  owner:[-6.6,-3.45],supportA:[2.75,-3.6],supportB:[5.15,-3.6],finance:[-3.2,-3.5],
  technical:[-6.4,2.05],creative:[-3.25,2.05],operations:[2.8,2.05],pantry:[7.2,3.5],
  utility:[7.8,2.3],meeting:[0.0,3.5],lobby:[0.3,-5.45],lounge:[6.9,-.1]
};
export const PLACE_ALIASES = {
  "ruang rapat":"meeting","ruang meeting":"meeting","meeting":"meeting","rapat":"meeting",
  "pantry":"pantry","dapur":"pantry","lobi":"lobby","lobby":"lobby",
  "ruang owner":"owner","meja owner":"owner","resepsionis":"lobby",
  "ruang santai":"lounge","sofa":"lounge","meja finance":"finance",
  "area desain":"creative","area support":"supportA","bagian teknisi":"technical"
};
export function staffByName(value) {
  const n=String(value||"").toLowerCase().replace(/^@/,"").trim();
  return STAFF.find(p=>p.id===n || p.name.toLowerCase()===n) || null;
}
