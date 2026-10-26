import http from "node:http";
import fs from "node:fs";
import {officeApi} from "./groq.mjs";
let env={...process.env};
try{for(const line of fs.readFileSync(new URL("../.env",import.meta.url),"utf8").split(/\r?\n/)){
 const match=line.match(/^([A-Z_]+)=(.*)$/);if(match&&!env[match[1]])env[match[1]]=match[2].trim();
}}catch{}
const handler=officeApi(env);
const port=Number(env.COWORK_PORT||8787);
http.createServer((req,res)=>handler(req,res,()=>{res.writeHead(404);res.end();})).listen(port,"127.0.0.1",()=>console.log("Groq standalone proxy at http://127.0.0.1:"+port));
