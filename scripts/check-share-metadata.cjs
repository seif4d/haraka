const assert=require('node:assert/strict');

module.exports=async({base,context,page})=>{
  for(const agent of ['WhatsApp/2.24.5.76 A','facebookexternalhit/1.1']){
    const response=await context.request.get(base+'/',{headers:{'User-Agent':agent}});assert.equal(response.status(),200);
    const html=await response.text();
    for(const tag of ['og:image','og:image:width','og:image:height','og:image:alt','og:image:type','og:url','og:site_name'])assert(html.includes(`property="${tag}"`),`Missing ${tag} for ${agent}`);
    assert(html.includes('content="1200"'));assert(html.includes('content="630"'));assert(html.includes('content="summary_large_image"'));
    assert(html.includes(base+'/brand/harka-share-v1.png'));
    assert(html.indexOf('property="og:image"')<html.indexOf('</head>'),`Share image must be in the initial head for ${agent}`);
  }
  await page.goto(base+'/');
  assert.equal(await page.locator('meta[property="og:image"]').getAttribute('content'),base+'/brand/harka-share-v1.png');
  assert.equal(await page.locator('meta[name="twitter:image"]').getAttribute('content'),base+'/brand/harka-share-v1.png');
  const image=await context.request.get(base+'/brand/harka-share-v1.png');assert.equal(image.status(),200);assert(image.headers()['content-type'].startsWith('image/png'));
  const bytes=await image.body();assert(bytes.length<300*1024);assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(bytes.readUInt32BE(16),1200);assert.equal(bytes.readUInt32BE(20),630);
  console.log('PASS: WhatsApp/Facebook crawler metadata in the initial head; absolute Open Graph and Twitter image URLs; public 1200×630 PNG below 300 KB.');
};
