const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {randomBytes}=require('node:crypto');
const {mkdirSync,mkdtempSync}=require('node:fs');
const {resolve,join}=require('node:path');
const root=resolve(__dirname,'..');const external='https://haraka.seif4d.com';const base='http://127.0.0.1:3003';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  require('./check-deployment.cjs')();mkdirSync(join(root,'test-results'),{recursive:true});const database=join(mkdtempSync(join(root,'test-results/proxy-')),'harka.sqlite');const token=randomBytes(32).toString('hex');const password=randomBytes(20).toString('hex');let server;let logs='';
  async function start(){server=spawn(process.execPath,[join(root,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','3003'],{cwd:root,env:{...process.env,HARKA_PUBLIC_ORIGIN:external,HARKA_SETUP_TOKEN:token,HARKA_DATABASE_PATH:database},windowsHide:true,stdio:['ignore','pipe','pipe']});server.stdout.on('data',d=>logs+=d);server.stderr.on('data',d=>logs+=d);for(let i=0;i<100;i++){if(server.exitCode!==null)throw new Error(logs);try{const r=await fetch(base+'/api/health',{signal:AbortSignal.timeout(700)});if(r.ok)return;}catch{}await delay(100);}throw new Error('Proxy test server did not become ready. '+logs);}
  async function stop(){if(server && server.exitCode===null){const done=new Promise(r=>server.once('exit',r));server.kill();await done;}}
  async function post(path,data,expected=200,cookie='',origin=external){const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),'X-Forwarded-Proto':'https','X-Forwarded-Host':'haraka.seif4d.com'},body:JSON.stringify(data)});assert.equal(r.status,expected,await r.clone().text());return r;}
  try{
    await start();assert.deepEqual(await (await fetch(base+'/api/health')).json(),{status:'ok'});const html=await (await fetch(base+'/setup')).text();assert(html.includes('name="setupToken"'));assert(!html.includes(token));
    const setup={name:'مدير HTTPS',email:'proxy-owner@example.test',password,confirmPassword:password};
    await post('auth/setup',setup,403);await post('auth/setup',{...setup,setupToken:'wrong'},403);await post('auth/setup',{...setup,setupToken:token},403,'','https://evil.example');await post('auth/setup',{...setup,setupToken:token},403,'',base);
    const created=await post('auth/setup',{...setup,setupToken:token},201);const setCookie=created.headers.get('set-cookie');assert(/;\s*Secure/i.test(setCookie));assert(/HttpOnly/i.test(setCookie));assert(/SameSite=lax/i.test(setCookie));const cookie=setCookie.split(';')[0];
    assert.equal((await fetch(base+'/api/admin/state',{headers:{Cookie:cookie}})).status,200);
    const form=new FormData();form.set('purpose','material');form.set('file',new Blob(['%PDF-1.4\n%%EOF'],{type:'application/pdf'}),'proxy.pdf');const upload=await fetch(base+'/api/files',{method:'POST',headers:{Origin:external,Cookie:cookie},body:form});assert.equal(upload.status,201,await upload.clone().text());const file=(await upload.json()).file;
    const forged=new FormData();forged.set('purpose','material');forged.set('file',new Blob(['%PDF-1.4\n%%EOF']),'forged.pdf');assert.equal((await fetch(base+'/api/files',{method:'POST',headers:{Origin:'https://evil.example',Cookie:cookie,'X-Forwarded-Proto':'https','X-Forwarded-Host':'haraka.seif4d.com'},body:forged})).status,403);
    await stop();await start();const state=await (await fetch(base+'/api/admin/state',{headers:{Cookie:cookie}})).json();assert.equal(state.users.length,1);assert.equal((await fetch(base+'/api/files/'+file.id,{headers:{Cookie:cookie}})).status,200);
    await post('auth/setup',{...setup,setupToken:token},409);await post('auth/logout',{},200,cookie);assert.equal((await fetch(base+'/api/admin/state',{headers:{Cookie:cookie}})).status,401);
    console.log('PASS: production HTTPS origin over HTTP upstream; private first-admin setup; secure cookies; JSON and multipart CSRF protection; account, session and uploaded-file persistence across restarts; logout.');
  }finally{await stop();}
})().catch(error=>{console.error(error);process.exitCode=1;});
