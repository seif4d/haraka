const {settings,publishing,closeSettings,saveAndReturn}=require('./author-test-helpers.cjs');
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { mkdirSync } = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

const base = process.env.HARKA_TEST_URL || 'http://127.0.0.1:3001';
const password = randomBytes(20).toString('hex');
const profile = {name:'طالب أول',year:4,gender:'boys',track:'training',semester:1};
const errors = [];
async function call(context,path,body,method='POST',expected=200) {
  const response = await context.request.fetch(`${base}/api/${path}`,{method,headers:{Origin:base,'Content-Type':'application/json'},...(body===undefined ? {} : {data:body})});
  assert.equal(response.status(),expected,`${method} ${path}: ${await response.text()}`);
  return response.json();
}
async function authForm(page,mode,email,name) {
  await page.goto(`${base}/${mode}`);
  if(name) await page.locator('[name=name]').fill(name);
  await page.locator('[name=email]').fill(email);
  await page.locator('[name=password]').fill(password);
  if(mode!=='login') await page.locator('[name=confirmPassword]').fill(password);
  if(mode==='setup') await page.locator('[name=setupToken]').fill(process.env.HARKA_TEST_SETUP_TOKEN);
}
async function layout(page,path,width,name) {
  await page.setViewportSize({width,height:900}); await page.goto(`${base}${path}`); await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,`overflow ${path} ${width}`);
  if(name) await page.screenshot({path:`test-results/${name}-${width}.png`,fullPage:true,animations:"disabled"});
}

(async()=>{
  mkdirSync('test-results',{recursive:true});
  require('./check-agenda-logic.cjs')();
  const browser=await chromium.launch({headless:true,...(process.env.HARKA_BROWSER_PATH ? {executablePath:process.env.HARKA_BROWSER_PATH} : process.platform==='win32' ? {channel:'chrome'} : {})});
  try {
    const anon=await browser.newContext(); const admin=await browser.newContext(); const student=await browser.newContext(); const second=await browser.newContext();
    const owner=await admin.newPage(); const pupil=await student.newPage(); const publicPage=await anon.newPage();
    for(const page of [owner,pupil,publicPage]) {page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=500) errors.push(`${r.status()} ${r.url()}`);});}
    await require('./check-share-metadata.cjs')({base,context:anon,page:publicPage});
    await publicPage.goto(`${base}/student`);assert.equal(new URL(publicPage.url()).pathname,'/login');
    await call(anon,'admin/state',undefined,'GET',401);
    await call(anon,'auth/register',{email:'early@example.test',password,confirmPassword:password,name:'طالب مبكر',profile},'POST',409);
    for(const width of [320,390,768,1440]) await layout(publicPage,'/',width,'landing');
    await authForm(owner,'setup','owner@example.test','إدارة الاختبار');
    await owner.getByRole('button',{name:'إنشاء حساب الإدارة',exact:true}).click();await owner.waitForURL(`${base}/admin`);
    assert.equal((await admin.cookies()).find(x=>x.name==='harka_session').httpOnly,true);
    await call(anon,'auth/setup',{email:'rogue@example.test',name:'مدير آخر',password,confirmPassword:password},'POST',409);
    await publicPage.goto(`${base}/setup`);assert.equal(new URL(publicPage.url()).pathname,'/login');
    await owner.goto(`${base}/admin/content`);await owner.getByRole('button',{name:'درس جديد',exact:true}).click();
    await owner.locator('[name=title]').fill('درس منتج تجريبي');await owner.locator('[name=intro]').fill('مقدمة لدرس يختبر فصل النشر عن المسودات.');await owner.getByText('نص سابق أو مقدمة مطوّلة وفيديو',{exact:true}).click();await owner.locator('[name=body]').fill('شرح أول للدرس.\n\nمثال وتطبيق يوضح الفكرة.');
    await saveAndReturn(owner);await owner.getByRole('heading',{name:'درس منتج تجريبي',exact:true}).waitFor();
    let state=await call(admin,'admin/state',undefined,'GET');let lesson=state.lessons.find(x=>x.title==='درس منتج تجريبي');assert(lesson);assert.equal(lesson.status,'draft');
    await call(admin,'admin/lessons',{...lesson,youtubeUrl:'https://evil.example/video',status:'published'},'POST',400);
    await call(admin,'admin/lessons',{...lesson,courseId:'missing-course',status:'published'},'POST',400);
    await authForm(pupil,'register','student@example.test','طالب أول');
    await pupil.getByLabel('الفرقة الدراسية',{exact:true}).selectOption('4');
    await pupil.getByRole('button',{name:'أنشئ حسابي',exact:true}).click();await pupil.waitForURL(`${base}/student`);
    await call(second,'auth/register',{email:'second@example.test',password,confirmPassword:password,name:'طالب ثان',profile,role:'admin'},'POST',201);
    state=await call(admin,'admin/state',undefined,'GET');assert.equal(state.users.find(x=>x.email==='second@example.test').role,'student');
    for(const method of ['GET','POST','PATCH','DELETE']) await call(student,'admin/lessons',method==='GET'?undefined:{id:lesson.id},method,403);
    await call(student,'admin/state',undefined,'GET',403);await call(student,'admin/users',{id:state.users[0].id,active:false,role:'admin'},'PATCH',403);
    assert.equal((await call(student,'student/state',undefined,'GET')).lessons.length,0);
    assert.equal((await pupil.goto(`${base}/student/lessons/${lesson.id}`)).status(),404);
    await pupil.goto(`${base}/admin`);assert.equal(new URL(pupil.url()).pathname,'/student');
    await pupil.goto(`${base}/instructor`);assert.equal(new URL(pupil.url()).pathname,'/student');
    await owner.getByRole('button',{name:'تعديل درس منتج تجريبي',exact:true}).click();await publishing(owner);await owner.locator('[name=status]').selectOption('published');
    await saveAndReturn(owner);await owner.getByText('منشور للطلاب',{exact:true}).waitFor();
    state=await call(student,'student/state',undefined,'GET');assert.equal(state.lessons.length,1);
    await pupil.goto(`${base}/student/courses/${lesson.courseId}`);await pupil.getByRole('button').filter({hasText:'درس منتج تجريبي'}).click();await pupil.waitForURL(`${base}/student/lessons/${lesson.id}`);
    await pupil.getByRole('button',{name:'أنهيت قراءة الدرس',exact:true}).click();await pupil.getByRole('button',{name:'الدرس مكتمل',exact:true}).waitFor();
    await pupil.reload();await pupil.getByRole('button',{name:'الدرس مكتمل',exact:true}).waitFor();
    await pupil.goto(`${base}/student/courses`);const bookmark=pupil.getByRole('button',{name:/^حفظ /}).first();const bookmarkName=await bookmark.getAttribute('aria-label');await bookmark.click();await pupil.getByRole('button',{name:bookmarkName.replace('حفظ','إلغاء حفظ'),exact:true}).waitFor();
    state=await call(student,'student/state',undefined,'GET');assert.equal(state.saved.length,1);assert(state.completed.includes(lesson.id));
    let state2=await call(second,'student/state',undefined,'GET');assert.equal(state2.saved.length,0);assert.equal(state2.completed.length,0);
    await pupil.reload();assert.equal((await call(student,'student/state',undefined,'GET')).saved.length,1);
    await pupil.locator('.side-nav').getByRole('button',{name:/محفوظاتي/}).click();await pupil.waitForURL(`${base}/student/saved`);assert.equal(await pupil.locator('.course-card').count(),1);
    await pupil.reload();assert.equal(await pupil.locator('.course-card').count(),1);
    await pupil.goto(`${base}/student`);await pupil.getByRole('button',{name:'يلا نجرّب'}).click();await pupil.waitForURL(/\/student\/demo\//);
    await pupil.getByRole('tab',{name:/ثبّت المعلومة/}).click();assert(await pupil.getByRole('button',{name:'ثبّت إنجازك في رحلتك'}).isDisabled());
    await pupil.getByRole('button',{name:/يفضل زي ما هو/}).click();assert(await pupil.getByRole('button',{name:'ثبّت إنجازك في رحلتك'}).isDisabled());
    const courseDemo=new URL(pupil.url()).pathname.split('/').pop();await call(student,'student/progress',{lessonId:`torque-${courseDemo}`,answer:'same'},'POST',400);
    await pupil.getByRole('button',{name:/يتضاعف/}).click();await pupil.getByRole('button',{name:'ثبّت إنجازك في رحلتك'}).click();await pupil.getByRole('button',{name:'الدرس مكتمل في رحلتك'}).waitFor();
    // Student workspace: no duplicate profile controls, a compact sidebar and real sport choices.
    await pupil.goto(`${base}/student`);
    assert.equal(await pupil.locator('.profile-chip,.top-avatar,.profile-dialog').count(),0);
    assert((await pupil.locator('.sidebar').boundingBox()).width<=184);
    assert.equal(await pupil.locator('.sidebar').evaluate(e=>e.scrollHeight<=e.clientHeight+1),true);
    await pupil.goto(`${base}/student/courses`);assert.equal(await pupil.getByLabel('الفرقة الدراسية',{exact:true}).count(),0);
    await pupil.locator('.course-card').filter({has:pupil.getByRole('heading',{name:'اختر تخصصك الفردي',exact:true})}).locator('.course-card-main').click();
    const slot=await pupil.locator('[data-specialization-slot]').getAttribute('data-specialization-slot');assert(slot);
    await pupil.getByLabel('رياضتك الفردية',{exact:true}).selectOption('swimming');
    await pupil.getByRole('heading',{name:'تخصص فردي · السباحة',exact:true}).waitFor();
    await pupil.reload();assert.equal(await pupil.getByLabel('رياضتك الفردية',{exact:true}).inputValue(),'swimming');
    await call(second,'student/specializations',{courseId:slot,sportId:'boxing'},'PATCH');
    await call(student,'student/specializations',{courseId:slot,sportId:'football'},'PATCH',400);
    const swim=(await call(admin,'admin/lessons',{courseId:slot,title:'درس خاص بالسباحة',intro:'للطلاب اللي اختاروا سباحة.',body:'شرح السباحة في المسار المختار.',youtubeUrl:'',sportId:'swimming',status:'published'},'POST',201)).lesson;
    const boxing=(await call(admin,'admin/lessons',{courseId:slot,title:'درس خاص بالملاكمة',intro:'للطلاب اللي اختاروا ملاكمة.',body:'شرح الملاكمة في المسار المختار.',youtubeUrl:'',sportId:'boxing',status:'published'},'POST',201)).lesson;
    state=await call(student,'student/state',undefined,'GET');state2=await call(second,'student/state',undefined,'GET');
    assert(state.lessons.some(x=>x.id===swim.id));assert(!state.lessons.some(x=>x.id===boxing.id));
    assert(state2.lessons.some(x=>x.id===boxing.id));assert(!state2.lessons.some(x=>x.id===swim.id));
    assert.equal((await pupil.goto(`${base}/student/lessons/${boxing.id}`)).status(),404);
    await call(student,'student/progress',{lessonId:boxing.id},'POST',404);
    // Timetable: staff edit, private drafts, audience and sport filtering.
    await owner.goto(`${base}/admin/schedule`);
    await owner.getByLabel('مصدر الجدول',{exact:true}).fill('مصدر تجريبي للاختبارات فقط');
    await owner.getByRole('button',{name:'أضف محاضرة',exact:true}).click();
    await owner.getByLabel('المكان',{exact:true}).fill('مدرج الاختبار');
    await owner.getByRole('button',{name:'حفظ الجدول وحالة النشر',exact:true}).click();
    await owner.locator('.timetable-editor .section-heading .tag').filter({hasText:'مسودة'}).waitFor();
    let schedule;
    for(let i=0;i<40;i++){schedule=(await call(admin,'admin/state',undefined,'GET')).schedules[0];if(schedule)break;await new Promise(r=>setTimeout(r,50));}
    assert(schedule);assert.equal((await call(student,'student/state',undefined,'GET')).schedule,null);
    const timed=(sportId,start,end)=>({id:'test',day:0,start,end,courseId:slot,sportId,location:'ملعب الاختبار',instructor:'محاضر اختبار',kind:'practical'});
    await call(admin,'admin/schedules',{profile,academicYear:'2026/2027',sourceLabel:'مصدر اختبار',sourceUrl:'',status:'published',entries:[]},'POST',400);
    await call(student,'admin/schedules',{},'POST',403);
    const schedulePayload={profile,academicYear:'2026/2027',sourceLabel:'مصدر اختبار',sourceUrl:'',status:'published',entries:[...schedule.entries,timed('swimming','10:30','12:00'),timed('boxing','13:00','14:30')]};
    await call(admin,'admin/schedules',schedulePayload);
    state=await call(student,'student/state',undefined,'GET');state2=await call(second,'student/state',undefined,'GET');
    assert.equal(state.schedule.entries.length,2);assert(state.schedule.entries.some(e=>e.sportId==='swimming'));assert(!state.schedule.entries.some(e=>e.sportId==='boxing'));
    assert.equal(state2.schedule.entries.length,2);assert(state2.schedule.entries.some(e=>e.sportId==='boxing'));
    await pupil.goto(`${base}/student/schedule`);await pupil.getByRole('button',{name:/^السبت،/}).click();assert.equal(await pupil.locator('[data-session-id]').count(),2);await pupil.getByRole('link',{name:'تخصص فردي · السباحة',exact:true}).waitFor();
    await pupil.getByRole('button',{name:/^الأحد،/}).click();assert.equal(await pupil.locator('[data-session-id]').count(),0);
    await pupil.goto(`${base}/student/settings`);await pupil.locator('[name=studentName]').fill('طالب أول محدّث');
    await pupil.getByLabel('رياضتك الفردية',{exact:true}).selectOption('boxing');
    await pupil.getByRole('button',{name:'حفظ إعداداتي',exact:true}).click();await pupil.getByText('اتحفظت إعداداتك.',{exact:true}).waitFor();
    await pupil.reload();assert.equal(await pupil.locator('[name=studentName]').inputValue(),'طالب أول محدّث');assert.equal(await pupil.getByLabel('رياضتك الفردية',{exact:true}).inputValue(),'boxing');
    assert(!(await call(student,'student/state',undefined,'GET')).lessons.some(x=>x.id===swim.id));
    // All 32 cohorts get a feature from their own year, semester, track and gender.
    const features=new Set();
    for(const year of [1,2,3,4])for(const gender of ['boys','girls'])for(const semester of [1,2])for(const track of year<3?['general']:['teaching','training','management']){
      await call(student,'student/profile',{...profile,year,gender,semester,track},'PATCH');await pupil.goto(`${base}/student`);
      const featureId=await pupil.locator('[data-feature-course]').getAttribute('data-feature-course');assert(featureId);features.add(featureId);
      const heroTitle=await pupil.locator('.hero-kicker').textContent();assert(heroTitle.includes(semester===1?'الأول':'الثاني'));
      if(!(year===4 && semester===1 && track!=='management'))assert(!heroTitle.includes('مبادئ التحليل الحركي'));
      assert.equal(await pupil.locator('.profile-chip,.top-avatar').count(),0);
    }
    assert.equal(features.size,32);
    await call(student,'student/profile',profile,'PATCH');
    for(const width of [320,390,768,1440]){await layout(pupil,'/student',width,'student-home');await layout(pupil,'/student/settings',width,'student-settings');await layout(pupil,'/student/schedule',width,'student-schedule');await layout(owner,'/admin/schedule',width,'schedule-editor');}
    await call(student,'student/profile',{...profile,gender:'girls',year:3,track:'teaching',role:'admin'},'PATCH');
    state=await call(student,'student/state',undefined,'GET');assert.equal(state.profile.gender,'girls');
    assert.equal(state.schedule,null);
    await call(student,'admin/state',undefined,'GET',403);
    const csrf=await student.request.post(`${base}/api/student/bookmarks`,{headers:{Origin:'https://evil.example','Content-Type':'application/json'},data:{courseId:lesson.courseId,saved:true}});assert.equal(csrf.status(),403);
    for(const width of [320,390,768,1440]) {await layout(pupil,'/student/courses',width,'student');await layout(owner,'/admin/content',width,'admin');await layout(owner,'/admin/users',width);}
    await pupil.setViewportSize({width:390,height:900});
    const mobileNav=pupil.getByRole('navigation',{name:'تنقل الموبايل',exact:true});
    assert.deepEqual(await mobileNav.locator('button').allTextContents(),['الرئيسية','موادي','محاضراتي','تكليفات','المزيد']);
    for(const [label,path] of [['الرئيسية','/student'],['موادي','/student/courses'],['محاضراتي','/student/schedule'],['تكليفات','/student/assignments']]){await mobileNav.getByRole('button',{name:label,exact:true}).click();await pupil.waitForURL(base+path);await mobileNav.locator('button[aria-current=page]').filter({hasText:label}).waitFor();}
    await mobileNav.getByRole('button',{name:'المزيد',exact:true}).click();assert.equal(await mobileNav.getByRole('button',{name:'المزيد',exact:true}).getAttribute('aria-expanded'),'true');
    const mobileMenu=pupil.getByRole('navigation',{name:'القائمة الرئيسية',exact:true});assert(await mobileMenu.getByRole('button',{name:'المكتبة',exact:true}).isVisible());assert(await mobileMenu.getByRole('button',{name:'الاختبارات',exact:true}).isVisible());await mobileMenu.getByRole('button',{name:'الاختبارات',exact:true}).click();await pupil.waitForURL(base+'/student/exams');await mobileNav.locator('button.active').filter({hasText:'المزيد'}).waitFor();await pupil.screenshot({path:'test-results/mobile-bottom-navigation-390.png',animations:'disabled'});
    await layout(owner,'/admin',1440,'admin-overview');await layout(owner,'/admin/settings',390,'roles');
    const sid=(await call(admin,'admin/state',undefined,'GET')).users.find(x=>x.email==='student@example.test').id;
    await call(admin,'admin/users',{id:sid,active:false},'PATCH');await call(student,'student/state',undefined,'GET',401);
    await pupil.goto(`${base}/student`);assert.equal(new URL(pupil.url()).pathname,'/login');
    await call(admin,'admin/users',{id:sid,active:true},'PATCH');await authForm(pupil,'login','student@example.test');await pupil.getByRole('button',{name:'ادخل مساحتك',exact:true}).click();await pupil.waitForURL(`${base}/student`);
    assert.equal((await call(student,'student/state',undefined,'GET')).saved.length,1);
    await call(admin,'admin/lessons',{...lesson,status:'draft'});assert(!(await call(student,'student/state',undefined,'GET')).lessons.some(x=>x.id===lesson.id));
    assert.equal((await pupil.goto(`${base}/student/lessons/${lesson.id}`)).status(),404);
    await call(admin,'admin/lessons',{id:lesson.id},'DELETE');assert(!(await call(student,'student/state',undefined,'GET')).completed.includes(lesson.id));
    await require('./check-academic.cjs')({base,call,admin,student,second,owner,pupil,profile,courseId:lesson.courseId,layout});
    await require('./check-course.cjs')({base,call,admin,student,second,owner,pupil,layout});
    await require('./check-timetable-import.cjs')({base,call,admin,student,pupil,layout});
    await require('./check-interactive-lessons.cjs')({base,call,admin,student,second,owner,pupil,layout});
    await require('./check-training-import.cjs')({base,call,admin,student,second,owner,pupil,layout});
    await require('./check-content-workspace.cjs')({base,call,admin,student,owner,pupil,layout});
    await require('./check-document-authoring.cjs')({base,call,admin,student,owner,pupil});
    await require('./check-lesson-author-page.cjs')({base,call,admin,student,owner,pupil});
    await require('./check-admin-settings.cjs')({base,call,admin,student,anon,owner,pupil,publicPage,password,layout,browser});
    await call(student,'auth/logout',{});await call(student,'student/state',undefined,'GET',401);
    const database=new DatabaseSync(process.env.HARKA_TEST_DATABASE || 'test-results/product-test.sqlite',{readOnly:true});
    for(const row of database.prepare('SELECT password_hash FROM users').all()) {assert(row.password_hash.startsWith('scrypt:'));assert(!row.password_hash.includes(password));}
    database.close();assert.deepEqual(errors,[]);
    console.log('PASS: product/auth; compact student UI; 32 personalized cohorts; settings persistence; sport choices and lesson access; staff timetable draft/publish and student schedule filtering; mobile layouts; account isolation and server authorization.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
