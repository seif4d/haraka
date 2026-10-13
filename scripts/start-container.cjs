const {mkdirSync,accessSync,constants}=require('node:fs');
const {resolve,dirname}=require('node:path');
function validateRuntime(env=process.env) {
  if(!env.HARKA_PUBLIC_ORIGIN)throw new Error('Set HARKA_PUBLIC_ORIGIN to your public HTTPS origin.');
  const origin=new URL(env.HARKA_PUBLIC_ORIGIN);
  if(origin.protocol!=='https:' || origin.username || origin.password || origin.pathname!=='/' || origin.search || origin.hash)throw new Error('HARKA_PUBLIC_ORIGIN must be an HTTPS origin without a path or credentials.');
  if(!env.HARKA_SETUP_TOKEN || env.HARKA_SETUP_TOKEN.length<32 || env.HARKA_SETUP_TOKEN.length>256)throw new Error('Set HARKA_SETUP_TOKEN to a private random value of 32–256 characters.');
  if(!env.HARKA_DATABASE_PATH || !require('node:path').isAbsolute(env.HARKA_DATABASE_PATH))throw new Error('Set HARKA_DATABASE_PATH to an absolute path inside persistent storage.');
  return {origin:origin.origin,dataDirectory:dirname(resolve(env.HARKA_DATABASE_PATH))};
}
module.exports={validateRuntime};
if(require.main===module){
  try {const runtime=validateRuntime();mkdirSync(runtime.dataDirectory,{recursive:true});accessSync(runtime.dataDirectory,constants.R_OK|constants.W_OK);process.env.HOSTNAME='0.0.0.0';require('../server.js');}
  catch(error){console.error(`Container configuration: ${error.message}`);process.exitCode=1;}
}
