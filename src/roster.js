// Fictionalized, art-directed employee avatars. Reference photographs are not shipped.
export const STAFF=[
 {id:"ulum",name:"Ulum",role:"CEO / Owner",team:"Management",color:"#303641",shirt:"#f3f1ec",hair:"#17191d",skin:"#c89470",pants:"#25282f",hairStyle:"wavy",face:"soft",accessory:"lanyard",home:"owner",wander:.08},
 {id:"adi",name:"Adi",role:"Customer Support",team:"Customer Support",color:"#426879",shirt:"#426879",hair:"#15191c",skin:"#b98265",pants:"#24303d",hairStyle:"quiff",face:"gentle",accessory:"headset",home:"supportA",wander:.13},
 {id:"agil",name:"Agil",role:"Office Boy",team:"General Affairs",color:"#54705e",shirt:"#54705e",hair:"#19191b",skin:"#c38d6f",pants:"#36443a",hairStyle:"curly",face:"round",accessory:"broom",home:"pantry",wander:.8},
 {id:"ulin",name:"Ulin",role:"Office Boy",team:"General Affairs",color:"#b5ab8c",shirt:"#b5ab8c",hair:"#151619",skin:"#b67e60",pants:"#414b50",hairStyle:"fringe",face:"slim",accessory:"tray",home:"utility",wander:.78},
 {id:"lukman",name:"Lukman",role:"Accountant",team:"Finance",color:"#c6d6db",shirt:"#d2dce2",hair:"#18191c",skin:"#c19274",pants:"#303640",hairStyle:"tightcurl",face:"long",accessory:"tie",home:"finance",wander:.08},
 {id:"siswo",name:"Siswo",role:"Technician",team:"Technical",color:"#547087",shirt:"#547087",hair:"#151517",skin:"#b88461",pants:"#2e3945",hairStyle:"short",face:"square",accessory:"tool",home:"technical",wander:.23},
 {id:"huda",name:"Huda",role:"Designer",team:"Creative",color:"#986e5d",shirt:"#986e5d",hair:"#151619",skin:"#c58e6b",pants:"#323942",hairStyle:"textured",face:"slim",accessory:"tablet",home:"creative",wander:.12},
 {id:"fadil",name:"Fadil",role:"Office Assistant",team:"Operations",color:"#d67a51",shirt:"#d67a51",hair:"#141617",skin:"#b68262",pants:"#34404c",hairStyle:"curlyfront",face:"angular",accessory:"notebook",home:"operations",wander:.45},
 {id:"sumanto",name:"Sumanto",role:"Customer Support",team:"Customer Support",color:"#555970",shirt:"#555970",hair:"#14171c",skin:"#b87e60",pants:"#262b3b",hairStyle:"swept",face:"smile",accessory:"headset",home:"supportB",wander:.13}
];
export const PLACES={
 owner:[-12,-5.1], finance:[-11.8,2.3],technical:[-2.8,-5.4],creative:[-12,8.5],
 operations:[.8,-1.5],supportA:[3.6,4.3],supportB:[6.6,4.3],
 pantry:[13.2,6.8],utility:[11.5,6.7],meeting:[12,-4.4],mezzanine:[11,-1.5],lobby:[0,8.7],
 lounge:[-3,3.0],hall:[0,0],printer:[-2,1.8],storage:[13.8,9]
};
export const PLACE_ALIASES={
 "ruang owner":"owner","ruang ceo":"owner","meja ulum":"owner",
 "ruang keuangan":"finance","meja akuntan":"finance","meja finance":"finance",
 "ruang desainer":"creative","area desain":"creative","ruang desain":"creative",
 "ruang teknisi":"technical","meja teknisi":"technical",
 "meja support":"supportA","customer service":"supportA",
 "ruang operasi":"operations","meja asisten":"operations",
 "lantai dua":"mezzanine","lantai atas":"mezzanine","mezzanine":"mezzanine","ruang meeting":"meeting","ruang rapat":"meeting","meeting":"meeting",
 "pantry":"pantry","dapur":"pantry","lobi":"lobby","lobby":"lobby",
 "ruang santai":"lounge","sofa":"lounge","printer":"printer",
 "gudang":"storage","koridor":"hall"
};
export const ROOMS={
 owner:{label:"Ruang Owner",point:PLACES.owner},
 finance:{label:"Finance",point:PLACES.finance},
 meeting:{label:"Ruang Rapat",point:PLACES.meeting},
 creative:{label:"Creative",point:PLACES.creative},
 technical:{label:"Technical",point:PLACES.technical},
 support:{label:"Area Support",point:PLACES.supportA},
 pantry:{label:"Pantry",point:PLACES.pantry},
 operations:{label:"Operations",point:PLACES.operations},
 open:{label:"Open Office",point:PLACES.hall}
};
export function staffByName(s){const n=String(s||"").toLowerCase().trim().replace(/^@/,"");return STAFF.find(p=>p.id===n||p.name.toLowerCase()===n)||null;}
