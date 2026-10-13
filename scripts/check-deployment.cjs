const assert=require('node:assert/strict');
const {parsePublicOrigin,requestOrigin,sameOrigin,secureSession}=require('../lib/request-origin.ts');
const {validateRuntime}=require('./start-container.cjs');
module.exports=()=>{
  const external='https://haraka.seif4d.com';const request={url:'http://internal:3000/api/auth/login',headers:new Headers({origin:external,'x-forwarded-proto':'http','x-forwarded-host':'untrusted.example'})};
  assert.equal(requestOrigin(request,external+'/'),external);assert(sameOrigin(request,external));assert(secureSession(request,external));
  assert(!sameOrigin({...request,headers:new Headers({origin:'https://evil.example','x-forwarded-proto':'https','x-forwarded-host':'haraka.seif4d.com'})},external));
  assert(!sameOrigin({...request,headers:new Headers()},external));assert(!secureSession({url:'http://127.0.0.1:3000/login'},''));
  for(const value of ['javascript:alert(1)','https://user:secret@example.test','https://example.test/path','https://example.test/?x=1','https://example.test/#fragment'])assert.throws(()=>parsePublicOrigin(value));
  const env={HARKA_PUBLIC_ORIGIN:external,HARKA_SETUP_TOKEN:'x'.repeat(64),HARKA_DATABASE_PATH:require('node:path').resolve('test-results/runtime/data.sqlite')};assert.equal(validateRuntime(env).origin,external);
  for(const patch of [{HARKA_PUBLIC_ORIGIN:''},{HARKA_PUBLIC_ORIGIN:'http://example.test'},{HARKA_SETUP_TOKEN:''},{HARKA_SETUP_TOKEN:'short'},{HARKA_DATABASE_PATH:'relative.sqlite'}])assert.throws(()=>validateRuntime({...env,...patch}));
  console.log('PASS: canonical HTTPS origin behind a proxy; forwarded-header spoof rejection; secure-session decisions; container configuration requirements.');
};
if(require.main===module)module.exports();
