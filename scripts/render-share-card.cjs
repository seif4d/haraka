const {chromium}=require('playwright');
const {readFileSync,mkdirSync}=require('node:fs');
const {resolve}=require('node:path');
const root=resolve(__dirname,'..');
const data=(file,mime)=>`data:${mime};base64,${readFileSync(resolve(root,file)).toString('base64')}`;

(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.HARKA_BROWSER_PATH?{executablePath:process.env.HARKA_BROWSER_PATH}:process.platform==='win32'?{channel:'chrome'}:{})});
  try {
    const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
    await page.setContent(`<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><style>
      @font-face{font-family:Alexandria;src:url('${data('public/fonts/alexandria-3.ttf','font/ttf')}');font-weight:700}
      @font-face{font-family:Alexandria;src:url('${data('public/fonts/alexandria-0.ttf','font/ttf')}');font-weight:400}
      *{box-sizing:border-box}html{width:1200px;height:630px;overflow:hidden}body{position:relative;margin:0;width:1200px;height:630px;overflow:hidden;background:#111d16;color:#f5f6f0;font-family:Alexandria,sans-serif}
      .grid{position:absolute;inset:0;background-image:linear-gradient(#c6f77b07 1px,transparent 1px),linear-gradient(90deg,#c6f77b07 1px,transparent 1px);background-size:60px 60px;mask-image:linear-gradient(90deg,#000,transparent 35%,transparent 65%,#000)}
      .orbit{position:absolute;width:510px;height:510px;border:1px solid #c6f77b22;border-radius:50%;left:-290px;top:60px}.orbit:after,.orbit:before{content:"";position:absolute;inset:45px;border:1px solid #c6f77b25;border-radius:50%}.orbit:after{inset:95px}
      .orbit.right{left:auto;right:-300px;top:-200px;transform:rotate(-20deg)}
      .arrow{position:absolute;right:86px;bottom:48px;color:#c6f77b;font:160px/1 Arial;transform:rotate(-9deg)}.dot{position:absolute;width:16px;height:16px;background:#c6f77b;left:153px;top:148px;border-radius:50%}
      .spark{position:absolute;left:120px;bottom:118px;color:#e9e0fa;font:60px/1 Arial}
      main{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding-bottom:18px;text-align:center}
      .logo{width:500px;height:auto;display:block;margin-bottom:28px}
      h1{margin:0;font-size:46px;line-height:1.65;font-weight:700;letter-spacing:-1.3px;white-space:nowrap}h1 span{color:#c6f77b}
      p{font-size:22px;line-height:1.8;color:#c1cbbb;margin:12px 0 0}
      .address{margin-top:36px;font:17px Alexandria;letter-spacing:1px;color:#8fa084;direction:ltr}
      .topline{position:absolute;inset:0 0 auto;height:6px;background:#c6f77b}
    </style><div class="grid"></div><div class="orbit"></div><div class="orbit right"></div><div class="dot"></div><div class="spark">✳</div><div class="arrow">↗</div><main><img class="logo" src="${data('public/brand/harka-logo-inverse.svg','image/svg+xml')}" alt="حركة"><h1>افهمها. <span>جرّبها.</span> ثبّتها.</h1><p>مساحتك لتعلّم علوم الرياضة · أسيوط</p><div class="address">haraka.seif4d.com</div></main><div class="topline"></div></html>`);
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode()));});
    await page.screenshot({path:resolve(root,'public/brand/harka-share-v1.png'),animations:'disabled'});
    mkdirSync(resolve(root,'test-results'),{recursive:true});
    await page.screenshot({path:resolve(root,'test-results/share-square.png'),clip:{x:285,y:0,width:630,height:630},animations:'disabled'});
    console.log('Rendered 1200×630 share image; central square preview saved in test-results.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
