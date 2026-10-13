const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {randomBytes}=require('node:crypto');
const suffix=randomBytes(6).toString('hex');
const name=`haraka-test-${suffix}`;const volume=`haraka-test-data-${suffix}`;
const image=process.env.HARKA_TEST_IMAGE || 'haraka:ci';const base='http://127.0.0.1:3005';const origin='https://haraka.seif4d.com';
const env={...process.env,HARKA_PUBLIC_ORIGIN:origin,HARKA_SETUP_TOKEN:randomBytes(32).toString('hex')};const password=randomBytes(20).toString('hex');
const docker=(args)=>execFileSync('docker',args,{env,encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:8*1024*1024}).trim();
let containerCreated=false,volumeCreated=false;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function start(){docker(['run','--detach','--name',name,'--publish','127.0.0.1:3005:3000','--mount',`type=volume,source=${volume},target=/app/.data`,'--env','HARKA_PUBLIC_ORIGIN','--env','HARKA_SETUP_TOKEN',image]);containerCreated=true;for(let i=0;i<100;i++){try{const r=await fetch(base+'/api/health',{signal:AbortSignal.timeout(800)});if(r.ok)return;}catch{}if(docker(['inspect','--format','{{.State.Running}}',name])!=='true')throw new Error(docker(['logs',name]));await pause(200);}throw new Error('Container readiness failed: '+docker(['logs',name]));}
async function json(path,body,expected,cookie='',site=origin,method=body===undefined?'GET':'POST'){const response=await fetch(base+'/api/'+path,{method,headers:{Origin:site,...(cookie?{Cookie:cookie}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});assert.equal(response.status,expected,await response.clone().text());return response;}
(async()=>{
  try{
    assert.throws(()=>docker(['run','--rm','--network','none','--env','HARKA_PUBLIC_ORIGIN','--env','HARKA_SETUP_TOKEN',image]),error=>String(error.stderr).includes('No persistent storage mounted'));
    docker(['volume','create',volume]);volumeCreated=true;await start();assert.deepEqual(await (await fetch(base+'/api/health')).json(),{status:'ok'});assert.equal(docker(['exec',name,'node','-p','process.getuid()']),'1000');assert(docker(['exec',name,'node','-p','process.versions.node']).startsWith('24.'));
    const home=await (await fetch(base)).text();assert(home.includes('حركة'));assert(home.includes('https://haraka.seif4d.com/brand/harka-share-v1.png'));assert(home.includes('summary_large_image'));assert(!home.includes(env.HARKA_SETUP_TOKEN));for(const file of ['/brand/harka-logo.svg','/brand/harka-share-v1.png','/icon.svg','/apple-icon.png'])assert.equal((await fetch(base+file)).status,200);
    const setup={name:'إدارة الحاوية',email:'owner@container.test',password,confirmPassword:password};await json('auth/setup',setup,403);await json('auth/setup',{...setup,setupToken:env.HARKA_SETUP_TOKEN},403,'','https://evil.example');const created=await json('auth/setup',{...setup,setupToken:env.HARKA_SETUP_TOKEN},201);const header=created.headers.get('set-cookie');assert(/;\s*Secure/i.test(header));const admin=header.split(';')[0];
    const form=new FormData();form.set('purpose','material');form.set('file',new Blob(['%PDF-1.4\n%%EOF'],{type:'application/pdf'}),'container.pdf');const upload=await fetch(base+'/api/files',{method:'POST',headers:{Origin:origin,Cookie:admin},body:form});assert.equal(upload.status,201,await upload.clone().text());const file=(await upload.json()).file;
    const imported=JSON.parse(docker(['exec',name,'node','scripts/import-third-year-schedules.cjs']));assert.equal(imported.schedules.length,6);
    const studentResponse=await json('auth/register',{name:'طالب الحاوية',email:'student@container.test',password,confirmPassword:password,profile:{name:'طالب الحاوية',year:3,gender:'boys',track:'training',semester:1}},201);const student=studentResponse.headers.get('set-cookie').split(';')[0];let studentState=await (await json('student/state',undefined,200,student)).json();assert.equal(studentState.schedule.entries.length,15);
    const settings=await (await json('admin/settings',undefined,200,admin)).json();await json('admin/settings',{...settings,announcementEnabled:true,announcement:'إعلان محفوظ في الحاوية'},200,admin,origin,'PATCH');
    docker(['exec',name,'node','scripts/healthcheck.cjs']);const snapshot=docker(['exec',name,'node','scripts/backup-database.cjs']);assert(snapshot.startsWith('/app/.data/backups/'));
    docker(['rm','--force',name]);containerCreated=false;await start();const state=await (await json('admin/state',undefined,200,admin)).json();assert.equal(state.users.length,2);assert.equal(state.schedules.length,6);assert.equal(state.settings.announcement,'إعلان محفوظ في الحاوية');assert.equal(state.settings.announcementEnabled,true);assert.equal((await fetch(base+'/api/files/'+file.id,{headers:{Cookie:admin}})).status,200);studentState=await (await json('student/state',undefined,200,student)).json();assert.equal(studentState.schedule.entries.length,15);assert.equal(studentState.announcement,'إعلان محفوظ في الحاوية');await json('auth/setup',{...setup,setupToken:env.HARKA_SETUP_TOKEN},409);
    const backedUp=docker(['exec',name,'node','-e',"const {DatabaseSync}=require('node:sqlite');const p=require('node:fs').readdirSync('/app/.data/backups')[0];const d=new DatabaseSync('/app/.data/backups/'+p,{readOnly:true});console.log(d.prepare('SELECT COUNT(*) n FROM users').get().n);d.close();"]);assert.equal(backedUp,'2');
    console.log('PASS: production image refuses missing persistent storage; starts as non-root with a volume; health/assets; private setup and HTTPS cookies; multipart upload; schedule import; consistent SQLite backup; accounts, sessions, files and timetables survive container replacement with a named volume.');
  }finally{
    if(containerCreated)try{docker(['rm','--force',name]);}catch{}
    if(volumeCreated)try{docker(['volume','rm',volume]);}catch{}
  }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
