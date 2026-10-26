import {defineConfig,loadEnv} from "vite";
import {officeApi} from "./server/groq.mjs";
export default defineConfig(({mode})=>{
 // No VITE_ prefix on secrets. Environment is used server-side only.
 const env=loadEnv(mode,process.cwd(),"");
 return {
  server:{host:"127.0.0.1",port:5173},
  plugins:[{name:"local-groq-proxy",configureServer(server){server.middlewares.use(officeApi(env));}}],
  build:{target:"es2020"}
 };
});
