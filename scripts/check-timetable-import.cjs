const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {join}=require('node:path');
module.exports=async({base,call,admin,student,pupil,layout})=>{
  const result=JSON.parse(execFileSync(process.execPath,[join(__dirname,'import-third-year-schedules.cjs')],{env:process.env,encoding:'utf8'}));
  assert.equal(result.academicYear,'2026/2027');assert.equal(result.semester,1);assert.equal(result.schedules.length,6);
  assert.deepEqual(result.schedules.map(s=>s.entries),[15,15,16,16,15,17]);
  const schedules=(await call(admin,'admin/state',undefined,'GET')).schedules;
  const profile={name:'طالب جدول',year:3,gender:'boys',track:'training',semester:1};
  for(const gender of ['boys','girls']){await call(student,'student/profile',{...profile,gender},'PATCH');const data=await call(student,'student/state',undefined,'GET');assert.equal(data.schedule.entries.length,15);assert.equal(data.schedule.academicYear,'2026/2027');assert(data.schedule.entries.some(e=>e.day===0 && e.start==='16:00' && e.end==='18:00' && e.title==='علم الحركة'));assert(data.schedule.dayNotes['4'].includes('ظاهرة'));assert(data.schedule.entries.some(e=>!e.courseId && e.notes.includes('غير مفصل')));}
  const mg=schedules.find(s=>s.cohortKey==='3-girls-management-1');await call(student,'student/profile',{...profile,gender:'girls',track:'management'},'PATCH');const swim=mg.entries.find(e=>e.sportId==='swimming');await call(student,'student/specializations',{courseId:swim.courseId,sportId:'swimming'},'PATCH');let visible=(await call(student,'student/state',undefined,'GET')).schedule.entries;assert(visible.some(e=>e.day===0 && e.start==='10:00'));assert(visible.some(e=>e.day===3 && e.start==='08:00'));assert(!visible.some(e=>e.day===2 && e.start==='10:00'));assert(!visible.some(e=>e.day===3 && e.start==='16:00'));assert(visible.some(e=>e.title==='إدارة المنشآت' && !e.courseId));
  await call(student,'student/specializations',{courseId:swim.courseId,sportId:'gymnastics'},'PATCH');visible=(await call(student,'student/state',undefined,'GET')).schedule.entries;assert(!visible.some(e=>e.day===0 && e.start==='10:00'));assert(visible.some(e=>e.day===2 && e.start==='10:00'));
  const mb=schedules.find(s=>s.cohortKey==='3-boys-management-1');const football=mb.entries.find(e=>e.sportId==='football');await call(student,'student/profile',{...profile,track:'management'},'PATCH');await call(student,'student/specializations',{courseId:football.courseId,sportId:'football'},'PATCH');visible=(await call(student,'student/state',undefined,'GET')).schedule.entries;assert(visible.some(e=>e.day===2 && e.start==='10:00'));assert(!visible.some(e=>e.day===2 && e.start==='18:00'));assert(!visible.some(e=>e.title.includes('للبنات')));
  await call(student,'student/specializations',{courseId:football.courseId,sportId:'basketball'},'PATCH');visible=(await call(student,'student/state',undefined,'GET')).schedule.entries;assert(!visible.some(e=>e.day===2 && e.start==='10:00'));assert(visible.some(e=>e.day===2 && e.start==='18:00'));
  const tb=schedules.find(s=>s.cohortKey==='3-boys-teaching-1');await call(student,'student/profile',{...profile,track:'teaching'},'PATCH');await call(student,'student/specializations',{courseId:tb.entries.find(e=>e.sportId==='swimming').courseId,sportId:'swimming'},'PATCH');visible=(await call(student,'student/state',undefined,'GET')).schedule.entries;assert(visible.some(e=>e.day===5 && e.start==='16:00' && e.sportId==='swimming'));assert(visible.some(e=>e.day===4 && e.timeLabel==='12–2 وما بعدها'));
  for(const width of [320,390,768,1440]){
    await layout(pupil,'/student/schedule',width);
    await pupil.getByRole('button',{name:/^الاثنين،/}).click();
    assert.equal(await pupil.locator('[data-session-id]').count(),5);
    assert.equal(await pupil.locator('nav[aria-label="أيام المحاضرات"] button').count(),7);
    const rail=await pupil.locator('nav[aria-label="أيام المحاضرات"]').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth}));assert(rail.scroll<=rail.width+1,'Day rail should not scroll');
    assert(await pupil.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await pupil.screenshot({path:`test-results/agenda-day-${width}.png`,fullPage:true});
    if(width===390){await pupil.evaluate(()=>scrollTo(0,0));await pupil.screenshot({path:'test-results/agenda-mobile-top.png'});}
    await pupil.getByRole('button',{name:'الأسبوع',exact:true}).click();
    assert.equal(await pupil.locator('[data-session-id]').count(),visible.length);
    await pupil.getByText('12:00 م — 2:00 م وما بعدها',{exact:true}).waitFor();
    assert(await pupil.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await pupil.screenshot({path:`test-results/agenda-week-${width}.png`,fullPage:true});
  }
  assert.equal(await pupil.locator('.schedule-source-notes').count(),0);
  assert(!(await pupil.locator('[data-agenda-view]').innerText()).includes('المصدر:'));
  assert(!(await pupil.locator('.lecture-time').allTextContents()).some(text=>/14:00|16:00|18:00|20:00/.test(text)));
  await pupil.getByRole('button',{name:/^الثلاثاء،/}).click();
  const allCount=await pupil.locator('[data-session-id]').count();assert.equal(allCount,4);
  await pupil.getByRole('button',{name:/^عملي/}).click();assert.equal(await pupil.locator('[data-session-id]').count(),1);
  await pupil.getByRole('button',{name:/^نظري/}).click();assert.equal(await pupil.locator('[data-session-id]').count(),3);
  await pupil.getByRole('button',{name:/^الكل/}).click();
  const tuesday=pupil.getByRole('button',{name:/^الثلاثاء،/});await tuesday.focus();await pupil.keyboard.press('ArrowLeft');
  await pupil.getByRole('button',{name:/^الأربعاء،/}).evaluate(el=>{if(el.getAttribute('aria-pressed')!=='true'||document.activeElement!==el)throw new Error('RTL day keyboard navigation failed');});
  const details=pupil.locator('[data-session-id] details').first();assert.equal(await details.getAttribute('open'),null);await details.locator('summary').click();assert.equal(await details.getAttribute('open'),'');
  await pupil.getByRole('button',{name:'البحث في جدول الأسبوع',exact:true}).click();
  const search=pupil.getByRole('textbox',{name:'البحث في الجدول',exact:true});await search.fill('الملاعب الجديدة');assert.equal(await pupil.locator('[data-session-id]').count(),1);
  await search.fill('لا توجد مادة بهذا الاسم');assert.equal(await pupil.locator('[data-session-id]').count(),0);await pupil.getByText('مفيش محاضرات بالاختيار ده.',{exact:true}).waitFor();
  await pupil.getByRole('button',{name:'عرض كل المحاضرات',exact:true}).click();assert.equal(await pupil.locator('[data-session-id]').count(),visible.length);
  await pupil.getByRole('button',{name:'إغلاق البحث',exact:true}).click();
  await pupil.getByRole('button',{name:'شوف اليوم',exact:true}).click();assert.equal(await pupil.locator('[data-agenda-view]').getAttribute('data-agenda-view'),'day');assert(await pupil.locator('[data-session-id]').count()>0);
  await pupil.getByRole('button',{name:/^الجمعة،/}).click();await pupil.getByText('يوم أخف. مساحة ليك.',{exact:true}).waitFor();await pupil.getByRole('button',{name:'شوف خطة الأسبوع',exact:true}).click();
  const currentDayLabel=await pupil.getByRole('button',{name:/^الثلاثاء،/}).getAttribute('aria-label');await pupil.getByRole('button',{name:'الأسبوع التالي',exact:true}).click();assert.notEqual(await pupil.getByRole('button',{name:/^الثلاثاء،/}).getAttribute('aria-label'),currentDayLabel);await pupil.getByRole('button',{name:'الأسبوع السابق',exact:true}).click();assert.equal(await pupil.getByRole('button',{name:/^الثلاثاء،/}).getAttribute('aria-label'),currentDayLabel);
  await pupil.getByRole('button',{name:'العودة إلى اليوم',exact:true}).click();assert.equal(await pupil.locator('[data-agenda-view]').getAttribute('data-agenda-view'),'day');
  await pupil.setViewportSize({width:390,height:900});await pupil.getByRole('button',{name:/^الاثنين،/}).click();await pupil.getByRole('button',{name:'تفعيل الوضع الداكن',exact:true}).click();await pupil.screenshot({path:'test-results/agenda-dark-390.png',fullPage:true});
  assert(await pupil.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await pupil.getByRole('button',{name:'تفعيل الوضع الفاتح',exact:true}).click();
  await pupil.emulateMedia({media:'print'});assert.equal(await pupil.locator('.sidebar').isVisible(),false);assert.equal(await pupil.locator('.mobile-bottom-nav').isVisible(),false);await pupil.emulateMedia({media:'screen'});
  console.log('PASS: responsive day/week agenda at 320–1440px; seven days without scrolling; theory/practical filters; Arabic search; keyboard navigation; group disclosure; next-session jump; empty days; dark mode and print layout.');
  await call(student,'student/profile',{...profile,semester:2},'PATCH');assert.equal((await call(student,'student/state',undefined,'GET')).schedule,null);
  // Re-saving imported metadata from the editor API must retain titles, exclusions and notes.
  await call(admin,'admin/schedules',{profile:{...profile,track:'management',gender:'girls'},...mg});
  const after=(await call(admin,'admin/state',undefined,'GET')).schedules.find(s=>s.id===mg.id);assert.deepEqual(after.dayNotes,mg.dayNotes);assert(after.entries.some(e=>e.excludedSportIds.includes('swimming')));
  console.log('PASS: six owner-provided third-year timetables; exact times and titles; gender differences; swimming/football exclusions; unknown locations and group notes; editor round trip; semester isolation.');
};
