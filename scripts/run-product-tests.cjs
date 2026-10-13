const { spawn } = require('node:child_process');
const { resolve, join } = require('node:path');
const { mkdirSync, mkdtempSync } = require('node:fs');
const root=resolve(__dirname,'..');
const next=join(root,'node_modules/next/dist/bin/next');
const port=process.env.HARKA_TEST_PORT || '3001';
const url=`http://127.0.0.1:${port}`;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function run(file,args,env=process.env) {
  const child=spawn(process.execPath,[file,...args],{cwd:root,env,windowsHide:true,stdio:'inherit'});
  const code=await new Promise((res,rej)=>{child.once('error',rej);child.once('exit',res);});
  if(code!==0) throw new Error(`Check failed (exit ${code}).`);
}
(async()=>{
  await run(next,['build']);
  await run(join(root,'scripts/check-course-migration.cjs'),[]);
  const out=join(root,'test-results');mkdirSync(out,{recursive:true});
  const database=join(mkdtempSync(join(out,'product-')),'harka.sqlite');
  const env={...process.env,HARKA_DATABASE_PATH:database,HARKA_TEST_DATABASE:database,HARKA_TEST_URL:url};
  const server=spawn(process.execPath,[next,'start','--hostname','127.0.0.1','--port',port],{cwd:root,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
  let logs='';server.stdout.on('data',d=>logs+=d);server.stderr.on('data',d=>logs+=d);
  try {
    let ready=false;
    for(let i=0;i<100;i++) {
      if(server.exitCode!==null) throw new Error(logs);
      try {const result=await fetch(url,{signal:AbortSignal.timeout(500)});if(result.ok){ready=true;break;}}catch{}
      await delay(250);
    }
    if(!ready) throw new Error('Test server did not start. '+logs);
    await run(join(root,'scripts/check-product.cjs'),[],env);
  } finally {server.kill();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
