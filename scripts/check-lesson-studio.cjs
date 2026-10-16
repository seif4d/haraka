const assert=require('node:assert/strict');
const {validateLessonBlocks}=require('../lib/lesson-blocks.ts');
const {DatabaseSync}=require('node:sqlite');
const {upgrade}=require('./upgrade-training-lessons.cjs');
const original=require('../data/training-principles-unit1.json');
const enhanced=require('../data/training-principles-interactive.json');

module.exports=async({base,call,admin,student,owner,pupil,layout,imported})=>{
  for(const lesson of enhanced){assert.equal(lesson.blocks[0].type,'story');assert(lesson.blocks.some(b=>b.type==='sort'));assert(lesson.blocks.some(b=>['map','timeline','lab'].includes(b.type)));assert(lesson.blocks.find(b=>b.type==='reading').sections.length>=6);}
  for(const bad of [
    {...enhanced[0].blocks[0],bestIndex:3},
    {...enhanced[0].blocks[0],scene:'remote-script'},
    {...enhanced[0].blocks.find(b=>b.type==='sort'),items:[{text:'اختبار التصنيف',category:99,explanation:'لا تصنيف خارج النطاق'},{text:'عنصر آخر',category:0,explanation:'اختبار'}]},
    {id:'bad-lab',type:'lab',title:'اختبار',body:'',model:'unknown'},
    {id:'bad-map',type:'map',title:'خريطة',body:'',center:'مركز',nodes:[]}
  ])assert.throws(()=>validateLessonBlocks([bad]));

  // Exercise a real in-place upgrade, including rollback when a custom edit is present.
  const db=new DatabaseSync(process.env.HARKA_TEST_DATABASE);
  const id='sport-training-u01-l01-boys';const row=db.prepare('SELECT * FROM lessons WHERE id=?').get(id);const details=JSON.parse(row.structure);const previousDetails={...details,blocks:original[0].blocks,editorialNotes:'PRIVATE-UPGRADE-NOTES'};
  db.prepare("UPDATE lessons SET status='published',intro=?,structure=? WHERE id=?").run(original[0].intro,JSON.stringify({...previousDetails,blocks:[{id:'custom',type:'text',title:'تعديل مستقل',body:'شرح عدّله المحرر'}]}),id);
  assert.throws(()=>upgrade(process.env.HARKA_TEST_DATABASE,true),/Custom content detected/);
  assert.equal(JSON.parse(db.prepare('SELECT structure FROM lessons WHERE id=?').get(id).structure).blocks[0].id,'custom');
  db.prepare('UPDATE lessons SET structure=? WHERE id=?').run(JSON.stringify(previousDetails),id);
  const studentId=(await call(admin,'admin/state',undefined,'GET')).users.find(u=>u.email==='student@example.test').id;
  db.prepare('INSERT OR REPLACE INTO progress(user_id,lesson_id,completed_at) VALUES(?,?,?)').run(studentId,id,new Date().toISOString());
  assert.equal(upgrade(process.env.HARKA_TEST_DATABASE,false).applied,false);assert.equal(JSON.parse(db.prepare('SELECT structure FROM lessons WHERE id=?').get(id).structure).blocks[0].type,'text');
  assert.equal(upgrade(process.env.HARKA_TEST_DATABASE,true).updated,1);assert.equal(upgrade(process.env.HARKA_TEST_DATABASE,true).preserved,20);
  const upgraded=db.prepare('SELECT * FROM lessons WHERE id=?').get(id);assert.equal(upgraded.status,'published');assert.equal(upgraded.author_id,row.author_id);assert.equal(upgraded.created_at,row.created_at);assert.equal(JSON.parse(upgraded.structure).editorialNotes,'PRIVATE-UPGRADE-NOTES');assert(db.prepare('SELECT 1 FROM progress WHERE user_id=? AND lesson_id=?').get(studentId,id));db.close();

  for(const lesson of imported.filter(l=>l.id.endsWith('-boys')))await call(admin,'admin/lessons',{...lesson,status:'published'});
  const first=enhanced[0];await pupil.goto(`${base}/student/lessons/${id}`);await pupil.getByRole('heading',{name:first.blocks[0].title,exact:true}).first().waitFor();
  const story=pupil.locator('[data-studio=story]');await story.getByRole('button',{name:/الفرق إن لاعب البطولة بيتعب أكتر/}).click();await story.getByText('اختيار مفهوم… بس فيه حاجة ناقصة.',{exact:true}).waitFor();await story.getByRole('button',{name:/الغرض وطريقة تنظيم الممارسة/}).click();await story.getByText('تفكير مدرب. خلّينا نفهم ليه.',{exact:true}).waitFor();
  assert(await story.locator('[class*=sceneBottom] svg').evaluate(e=>e.getBoundingClientRect().width<=20));
  const time=pupil.locator('[data-studio=timeline]');await time.getByRole('button',{name:'المحطة التالية',exact:true}).click();await time.getByRole('heading',{name:'استعداد ومنافسة وإظهار مهارة',exact:true}).waitFor();
  const sort=pupil.locator('[data-studio=sort]');await sort.getByRole('button',{name:/منافسة رياضية/}).click();assert(await sort.getByRole('button',{name:'الموقف اللي بعده',exact:true}).isDisabled());await sort.getByText('راجع التصنيف:',{exact:false}).waitFor();
  const sortData=first.blocks.find(b=>b.type==='sort');for(let i=0;i<sortData.items.length;i++){await sort.getByRole('button',{name:new RegExp(sortData.categories[sortData.items[i].category])}).click();await sort.getByRole('button',{name:i===sortData.items.length-1?'شوف الصورة الكاملة':'الموقف اللي بعده',exact:true}).click();}await sort.getByText('عرفت تفرّق… مش تحفظ بس.',{exact:true}).waitFor();
  await sort.getByRole('button',{name:'جرّب التحدّي تاني',exact:true}).click();await sort.getByText('الموقف 01',{exact:true}).waitFor();
  const reading=pupil.locator('[data-studio=reading]');const summary=reading.locator('summary').first();assert.equal(await reading.locator('details').first().getAttribute('open'),null);await summary.click();assert(await reading.locator('details').first().getAttribute('open')!==null);
  assert.equal(await pupil.getByRole('navigation',{name:'رحلة الدرس',exact:true}).getByRole('link').count(),4);
  for(const width of [320,390,768,1440])await layout(pupil,`/student/lessons/${id}`,width,'studio-first');
  for(const position of [3,5,6,7,8,9,10]){
    const current=`sport-training-u01-l${String(position).padStart(2,'0')}-boys`;
    for(const width of [320,1440])await layout(pupil,`/student/lessons/${current}`,width,`studio-lesson-${position}`);
    if(position===5){const map=pupil.locator('[data-studio=map]').first();await map.getByRole('button',{name:/تعلم حركي/}).click();await map.getByRole('heading',{name:'تعلم حركي',exact:true}).waitFor();await map.screenshot({path:'test-results/studio-concept-map.png'});}
    if(position===6){const lab=pupil.locator('[data-studio=individuality]');await lab.getByRole('button',{name:/لاعب متمكن من المهارة/}).click();await lab.getByLabel('مهمة الرياضي',{exact:true}).selectOption('1');await lab.getByText('الاختيار مرتبط بالاحتياج الموصوف.',{exact:true}).waitFor();}
    if(position===7){const lab=pupil.locator('[data-studio=load-wave]');await lab.getByRole('button',{name:'مستوى ثابت',exact:true}).click();await lab.getByText('قيم ثابتة في هذا المثال',{exact:true}).waitFor();await lab.getByLabel('درجة الحمل بالفترة 2',{exact:true}).fill('5');await lab.getByText('ارتفاع وانخفاض: نمط متموّج',{exact:true}).waitFor();await lab.screenshot({path:'test-results/studio-wave-lab.png'});}
    if(position===3){const cycle=pupil.locator('[data-studio=training-cycle]');await cycle.getByRole('button',{name:'حرّك العملية خطوة',exact:true}).click();await cycle.getByRole('heading',{name:'افهم نقطة البداية',exact:true}).waitFor();}
    if(position===10){const evidence=pupil.locator('[data-studio=evidence]');for(const button of await evidence.locator('button').all())await button.click();await evidence.getByText('الصورة أوضح… والقرار لسه يحتاج تفسيرًا.',{exact:true}).waitFor();}
  }
  await pupil.goto(`${base}/student/lessons/${id}`);await pupil.emulateMedia({reducedMotion:'reduce'});assert.equal(await pupil.locator('[data-studio=story] svg path').nth(0).evaluate(e=>getComputedStyle(e).animationName),'none');await pupil.emulateMedia({reducedMotion:'no-preference'});
  await pupil.getByRole('button',{name:'تفعيل الوضع الداكن',exact:true}).click();await layout(pupil,`/student/lessons/${id}`,390,'studio-dark');await pupil.getByRole('button',{name:'تفعيل الوضع الفاتح',exact:true}).click();
  await owner.goto(base+'/admin/content');await owner.getByRole('button',{name:`تعديل ${first.title}`,exact:true}).first().click();assert.equal(await owner.locator('[data-block-editor=story]').count(),1);assert.equal(await owner.locator('[data-block-editor=timeline]').count(),1);assert.equal(await owner.getByLabel('قرار الموقف 1',{exact:true}).inputValue(),first.blocks[0].choices[0].title);
  for(const width of [320,1440]){await owner.setViewportSize({width,height:900});assert(await owner.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
  const publicPage=await pupil.context().browser().newPage();try{for(const width of [390,1440])await layout(publicPage,'/experience/training/unit-one',width,'studio-public');const response=await publicPage.goto(base+'/experience/training/unit-one');const html=await response.text();assert(!html.includes('editorialNotes'));assert(!html.includes('PRIVATE-UPGRADE-NOTES'));assert.equal(await publicPage.locator('[data-studio=story]').count(),1);}finally{await publicPage.close();}
  console.log('PASS: ten authored learning journeys; source preserved; safe in-place upgrade and custom-edit rollback; publication/identity/notes/progress retained; story decisions, timeline, maps, classification, four labs, reading disclosure, editor fields; responsive/dark/reduced motion and public preview isolation.');
};
