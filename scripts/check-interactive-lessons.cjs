const {settings,publishing,closeSettings,saveAndReturn}=require('./author-test-helpers.cjs');
const assert=require('node:assert/strict');
const {TRAINING_EXPERIENCE}=require('../lib/training-experience.ts');
const {validateLessonBlocks}=require('../lib/lesson-blocks.ts');

module.exports=async({base,call,admin,student,second,owner,pupil,layout})=>{
  const anonymous=await pupil.context().browser().newContext();
  try{const demo=await anonymous.newPage();const errors=[];demo.on('pageerror',error=>errors.push(error.message));for(const width of [390,1440]){await layout(demo,'/experience/training',width,'interactive-public');assert.equal(await demo.locator('[data-lesson-block]').count(),7);assert.equal(await demo.locator('meta[property="og:url"]').getAttribute('content'),base+'/experience/training');await demo.locator('[data-simulation=training-load]').screenshot({path:`test-results/interactive-lab-${width}.png`});await demo.locator('[data-simulation=recovery]').screenshot({path:`test-results/interactive-recovery-${width}.png`});}await demo.locator('[data-simulation=training-load]').getByLabel('المقاومة',{exact:true}).fill('40');await demo.getByText('٩٦٠',{exact:false}).waitFor();assert.deepEqual(errors,[]);}finally{await anonymous.close();}
  const sample=structuredClone(TRAINING_EXPERIENCE);
  assert.equal(validateLessonBlocks(sample.blocks).length,7);
  for(const invalid of [[...sample.blocks,sample.blocks[0]],Array(65).fill(sample.blocks[0]),[{...sample.blocks[0],correctIndex:4}],[{...sample.blocks[0],options:['نفس الاختيار','نفس الاختيار','خيار آخر']}],[{id:'bad',type:'simulation',title:'معمل اختبار',body:'',model:'arbitrary-script'}],[{id:'bad',type:'html',title:'محتوى غير مسموح',body:'<script/>'}]])assert.throws(()=>validateLessonBlocks(invalid));
  await owner.setViewportSize({width:1440,height:900});await owner.goto(base+'/admin/content');await owner.getByRole('button',{name:'درس جديد',exact:true}).click();
  await owner.getByLabel('الفرقة الدراسية',{exact:true}).selectOption('2');
  const courseId=await owner.getByLabel('مقرر الدرس',{exact:true}).inputValue();
  const profile={name:'طالب تجربة تفاعلية',year:2,gender:'boys',track:'general',semester:1};
  await call(student,'student/profile',profile,'PATCH');await call(second,'student/profile',{...profile,gender:'girls',name:'طالبة تجربة'},'PATCH');
  const title='درس تفاعلي كامل للاختبار';await owner.locator('[name=title]').fill(title);await owner.locator('[name=intro]').fill(sample.intro);
  await owner.getByRole('button',{name:'أضف مثال التدريب التفاعلي',exact:true}).click();await owner.locator('[data-lesson-author]').waitFor();assert.equal(await owner.locator('[data-block-editor]').count(),7);
  await owner.getByRole('button',{name:'إضافة مقطع جديد',exact:true}).click();await owner.getByRole('option',{name:/شرح قصير/}).click();await owner.getByLabel('عنوان الوحدة التفاعلية 8',{exact:true}).fill('النص آمن');
  const unsafe='<script>window.harkaInjected=true</script>';await owner.getByLabel('تمهيد الوحدة 8',{exact:true}).fill(unsafe);
  await owner.getByLabel('أدوات المقطع 8',{exact:true}).click();await owner.getByRole('button',{name:'رفع الوحدة 8',exact:true}).click();await owner.locator('[data-lesson-author]').waitFor();assert.equal(await owner.locator('[data-block-editor]').nth(6).getAttribute('data-block-editor'),'text');await owner.getByLabel('أدوات المقطع 7',{exact:true}).click();await owner.getByRole('button',{name:'خفض الوحدة 7',exact:true}).click();
  await owner.getByLabel('أدوات المقطع 8',{exact:true}).click();await owner.getByRole('button',{name:'نسخ الوحدة 8',exact:true}).click();await owner.locator('[data-lesson-author]').waitFor();assert.equal(await owner.locator('[data-block-editor]').count(),9);await owner.getByLabel('أدوات المقطع 9',{exact:true}).click();await owner.getByRole('button',{name:'حذف الوحدة 9',exact:true}).click();
  await closeSettings(owner);await owner.getByRole('tab',{name:'معاينة',exact:true}).click();assert.equal(await owner.locator('[data-lesson-block]').count(),8);
  assert.equal(await owner.locator('[data-simulation=training-load] input[type=range]').count(),3);await owner.getByRole('button',{name:'معاينة الهاتف',exact:true}).click();assert(await owner.locator('[data-author-preview]').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await owner.getByRole('button',{name:'معاينة الكمبيوتر',exact:true}).click();await owner.getByRole('tab',{name:'كتابة',exact:true}).click();
  await saveAndReturn(owner);await owner.locator('[data-content-lesson]').getByRole('heading',{name:title,exact:true}).waitFor();
  let lesson=(await call(admin,'admin/state',undefined,'GET')).lessons.find(l=>l.title===title);assert(lesson);assert.equal(lesson.body,'');assert.equal(lesson.blocks.length,8);assert.equal(new Set(lesson.blocks.map(b=>b.id)).size,8);
  assert.equal((await pupil.goto(`${base}/student/lessons/${lesson.id}`)).status(),404);
  await call(admin,'admin/lessons',{...lesson,blocks:[{...lesson.blocks[0],correctIndex:99}]},'POST',400);
  await call(admin,'admin/lessons',{...lesson,body:'',blocks:[]},'POST',400);
  await call(student,'admin/lessons',{...lesson,status:'published'},'POST',403);
  await owner.locator('.admin-content-row').filter({hasText:title}).getByRole('button',{name:'معاينة',exact:true}).click();assert.equal(await owner.locator('dialog [data-lesson-block]').count(),8);await owner.getByRole('button',{name:'إغلاق المعاينة',exact:true}).click();
  lesson=(await call(admin,'admin/lessons',{...lesson,status:'published'})).lesson;
  // Older clients may update a lesson without sending the new block field.
  const {blocks,...legacy}=lesson;lesson=(await call(admin,'admin/lessons',legacy)).lesson;assert.deepEqual(lesson.blocks,blocks);
  assert(!(await call(second,'student/state',undefined,'GET')).lessons.some(l=>l.id===lesson.id));
  for(const width of [320,390,768,1440]){
    await layout(pupil,`/student/lessons/${lesson.id}`,width,'interactive-reader');assert.equal(await pupil.locator('[data-lesson-block]').count(),8);
    assert.equal(await pupil.locator('[data-course-reader] iframe').count(),0);
  }
  const lab=pupil.locator('[data-simulation=training-load]');await lab.getByLabel('المقاومة',{exact:true}).fill('40');await lab.getByText('٩٦٠',{exact:false}).waitFor();
  await lab.getByRole('button',{name:'شوف الحركة',exact:true}).click();assert.equal(await lab.getByRole('button',{name:'وقف الحركة',exact:true}).getAttribute('aria-pressed'),'true');await lab.getByRole('button',{name:'وقف الحركة',exact:true}).click();
  await lab.getByRole('button',{name:'إعادة ضبط معمل الحمل',exact:true}).click();assert.equal(await lab.getByLabel('المقاومة',{exact:true}).inputValue(),'20');
  const explore=pupil.locator('[data-lesson-block=explore]');await explore.getByRole('tab',{name:/الهدف/}).focus();await pupil.keyboard.press('ArrowLeft');assert.equal(await explore.getByRole('tab',{name:/الخطة/}).getAttribute('aria-selected'),'true');
  const quiz=pupil.locator('[data-lesson-block=quiz]').first();await quiz.getByRole('button',{name:/لاعب يغيّر/}).click();await quiz.getByRole('button',{name:'اختبر قرارك',exact:true}).click();await quiz.getByText('خلّينا نفهم السبب ونحاول تاني.',{exact:true}).waitFor();
  await quiz.getByRole('button',{name:/لاعب يحدد هدفًا/}).click();await quiz.getByRole('button',{name:'اختبر قرارك',exact:true}).click();await quiz.getByText('قرار في مكانه!',{exact:true}).waitFor();
  const sequence=pupil.locator('[data-lesson-block=sequence]');await sequence.getByRole('button',{name:'راجع الترتيب',exact:true}).click();await sequence.getByText('الترتيب محتاج مراجعة.',{exact:true}).waitFor();
  for(let i=0;i<3;i++)await sequence.getByRole('button',{name:'حرّك افهم مستوى الرياضي والسياق. لأعلى',exact:true}).click();
  await sequence.getByRole('button',{name:'راجع الترتيب',exact:true}).click();await sequence.getByText('كل خطوة في مكانها.',{exact:true}).waitFor();
  const recovery=pupil.locator('[data-simulation=recovery]');const curve=await recovery.locator('path').nth(3).getAttribute('d');await recovery.getByRole('button',{name:'تكرار الحمل مبكرًا',exact:true}).click();assert.notEqual(await recovery.locator('path').nth(3).getAttribute('d'),curve);await recovery.getByRole('img',{name:'مخطط توضيحي: تكرار الحمل مبكرًا',exact:true}).waitFor();
  const card=pupil.locator('[data-lesson-block=cards]').getByRole('button',{name:/الحمل الخارجي/});await card.click();assert.equal(await card.getAttribute('aria-expanded'),'true');
  assert.equal(await pupil.locator('[data-lesson-block=text] script').count(),0);await pupil.getByText(unsafe,{exact:true}).waitFor();assert.equal(await pupil.evaluate(()=>!!window.harkaInjected),false);
  const duplicates=await pupil.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return ids.filter((id,i)=>ids.indexOf(id)!==i);});assert.deepEqual(duplicates,[]);
  await pupil.getByRole('button',{name:'أنهيت الدرس',exact:true}).click();await pupil.getByRole('button',{name:'الدرس مكتمل',exact:true}).waitFor();await pupil.reload();assert(await pupil.getByRole('button',{name:'الدرس مكتمل',exact:true}).isDisabled());
  await pupil.getByRole('button',{name:'تفعيل الوضع الداكن',exact:true}).click();assert(await pupil.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await pupil.screenshot({path:'test-results/interactive-dark-1440.png',fullPage:true,animations:'disabled'});await pupil.getByRole('button',{name:'تفعيل الوضع الفاتح',exact:true}).click();
  await pupil.emulateMedia({reducedMotion:'reduce'});await lab.getByRole('button',{name:'شوف الحركة',exact:true}).click();assert.equal(await lab.locator('[class*=barbell]').evaluate(e=>getComputedStyle(e).animationName),'none');await pupil.emulateMedia({reducedMotion:'no-preference'});
  await owner.goto(base+'/admin/content');await owner.getByRole('button',{name:`تعديل ${title}`,exact:true}).click();await owner.locator('[data-lesson-author]').waitFor();assert.equal(await owner.locator('[data-block-editor]').count(),8);assert.equal(await owner.getByLabel('عنوان الوحدة التفاعلية 1',{exact:true}).inputValue(),sample.blocks[0].title);
  for(const width of [320,390,1440]){await owner.setViewportSize({width,height:900});await owner.evaluate(()=>document.fonts.ready);const geometry=await owner.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('[data-lesson-author] *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left< -1||r.right>innerWidth+1);}).slice(0,8).map(e=>({tag:e.tagName,cls:e.className,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right}))}));assert(geometry.scroll<=width+1,JSON.stringify(geometry));await owner.waitForFunction(()=>[...document.querySelectorAll('[data-block-editor] textarea')].every(e=>e.scrollHeight<=e.clientHeight+2));await owner.screenshot({path:`test-results/interactive-editor-${width}.png`,fullPage:true,animations:'disabled'});}
  await call(admin,'admin/lessons',{...lesson,status:'draft'});assert.equal((await pupil.goto(`${base}/student/lessons/${lesson.id}`)).status(),404);
  console.log('PASS: reusable interactive block authoring/preview/reorder/duplicate/delete; draft/publish; server validation and legacy preservation; calculator, keyboard comparison, feedback questions, sequence, recovery chart and flashcards; safe text; mobile/dark/reduced motion; persistent lesson completion and cohort isolation.');
};
