const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const {DatabaseSync}=require('node:sqlite');
const {resolve}=require('node:path');
const source=require('../data/training-principles-unit1.json');

module.exports=async({base,call,admin,student,second,owner,pupil,layout})=>{
  const before=await call(admin,'admin/state',undefined,'GET');
  const run=()=>{const r=spawnSync(process.execPath,[resolve(__dirname,'import-training-principles.cjs')],{env:{...process.env,HARKA_DATABASE_PATH:process.env.HARKA_TEST_DATABASE},encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);};
  assert.equal(run().created,20);
  let state=await call(admin,'admin/state',undefined,'GET');
  assert.equal(state.users.length,before.users.length);assert.equal(state.schedules.length,before.schedules.length);
  assert.equal(state.learning.resources.length,before.learning.resources.length);
  const imported=state.lessons.filter(l=>l.id.startsWith('sport-training-u01-'));
  assert.equal(imported.length,20);assert(imported.every(l=>l.status==='draft'));
  assert.equal(state.trainingPlan.units.length,5);assert.equal(state.trainingPlan.units.flatMap(u=>u.lessons).length,37);
  assert.equal(state.trainingPlan.units.flatMap(u=>u.lessons).filter(l=>l.written).length,10);
  for(const lesson of imported){
    const original=source.find(l=>lesson.id===`${l.sourceId}-boys` || lesson.id===`${l.sourceId}-girls`);
    assert(original);assert.equal(lesson.title,original.title);assert.equal(lesson.position,original.position);
    assert.deepEqual(lesson.blocks,original.blocks);assert.equal(lesson.editorialNotes,original.editorialNotes);
  }
  const profile={name:'طالب المنهج',year:2,gender:'boys',track:'general',semester:1};
  await call(student,'student/profile',profile,'PATCH');await call(second,'student/profile',{...profile,name:'طالبة المنهج',gender:'girls'},'PATCH');
  assert(!(await call(student,'student/state',undefined,'GET')).lessons.some(l=>l.id.startsWith('sport-training-u01-')));
  let lesson=imported.find(l=>l.id==='sport-training-u01-l03-boys');
  const notes=lesson.editorialNotes+'\nPRIVATE-EDITORIAL-CANARY';
  lesson=(await call(admin,'admin/lessons',{...lesson,title:lesson.title+' — مراجعة',editorialNotes:notes,status:'published'})).lesson;
  await call(admin,'admin/lessons',{...lesson,editorialNotes:'x'.repeat(6001)},'POST',400);
  const {editorialNotes,...legacy}=lesson;lesson=(await call(admin,'admin/lessons',legacy)).lesson;assert.equal(lesson.editorialNotes,notes);
  assert.equal(run().created,0);assert.equal(run().preserved,20);
  state=await call(admin,'admin/state',undefined,'GET');assert.equal(state.lessons.find(l=>l.id===lesson.id).title,lesson.title);assert.equal(state.lessons.find(l=>l.id===lesson.id).status,'published');
  const publicState=await call(student,'student/state',undefined,'GET');
  assert(publicState.lessons.some(l=>l.id===lesson.id));assert(!JSON.stringify(publicState).includes('PRIVATE-EDITORIAL-CANARY'));assert(!JSON.stringify(publicState).includes('editorialNotes'));assert(!JSON.stringify(publicState).includes('trainingPlan'));
  assert(!(await call(second,'student/state',undefined,'GET')).lessons.some(l=>l.id===lesson.id));
  const response=await pupil.goto(`${base}/student/lessons/${lesson.id}`);assert.equal(response.status(),200);assert(!(await response.text()).includes('PRIVATE-EDITORIAL-CANARY'));
  assert.equal(await pupil.locator('[data-lesson-block] table').count(),1);
  const application=pupil.locator('[data-lesson-block=cards]');const answer=application.getByRole('button',{name:/قارن بإجابة نموذجية/});assert.equal(await answer.getAttribute('aria-expanded'),'false');await answer.click();assert.equal(await answer.getAttribute('aria-expanded'),'true');
  const quiz=pupil.locator('[data-lesson-block=quiz]');await quiz.getByRole('button',{name:/عملية تربوية منظمة/}).click();await quiz.getByRole('button',{name:'اختبر قرارك',exact:true}).click();await quiz.getByText('قرار في مكانه!',{exact:true}).waitFor();
  for(const width of [320,390,1440])await layout(pupil,`/student/lessons/${lesson.id}`,width,'training-curriculum');
  for(const width of [390,1440]){
    await layout(owner,'/admin/content',width,'training-plan');const plan=owner.locator('[data-training-plan]');await plan.locator('summary').first().click();await plan.getByRole('heading',{name:/نشأة التدريب الرياضي وتطوره التاريخي/}).waitFor();assert(await owner.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await plan.screenshot({path:`test-results/training-plan-${width}.png`,animations:'disabled'});
  }
  await owner.getByRole('button',{name:`تعديل ${lesson.title}`,exact:true}).click();assert.equal(await owner.locator('[name=editorialNotes]').inputValue(),notes);
  const ninth=imported.find(l=>l.id==='sport-training-u01-l09-boys');await owner.goto(base+'/admin/content');await owner.locator('.admin-content-row').filter({hasText:ninth.title}).first().getByRole('button',{name:'معاينة',exact:true}).click();assert.equal(await owner.locator('dialog [data-lesson-block=explore]').count(),3);await owner.getByRole('button',{name:'إغلاق المعاينة',exact:true}).click();
  await call(admin,'admin/lessons',{...lesson,status:'draft'});
  const db=new DatabaseSync(process.env.HARKA_TEST_DATABASE,{readOnly:true});assert.equal(db.prepare("SELECT COUNT(*) AS n FROM lessons WHERE id LIKE 'sport-training-u01-%'").get().n,20);db.close();
  console.log('PASS: 20 training drafts, complete 37-topic admin roadmap, exact content/questions, repeat import preserves edits/status, legacy editing preserves review notes, student JSON/SSR excludes editorial metadata, gender/draft isolation, responsive tables and interactive applications.');
};
