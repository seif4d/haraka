const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {join}=require('node:path');
const source=require('../data/fourth-year-2026-2027.cjs');
const {coursesFor}=require('../lib/curriculum.ts');
module.exports=async({base,call,admin,student,pupil,layout})=>{
 const other=s=>JSON.stringify(s.schedules.filter(s=>!s.cohortKey.startsWith('4-')));
 const previous=other(await call(admin,'admin/state',undefined,'GET'));
 const run=()=>JSON.parse(execFileSync(process.execPath,[join(__dirname,'import-fourth-year-schedules.cjs')],{env:process.env,encoding:'utf8'}));
 assert.deepEqual(run().schedules.map(s=>s.entries),[15,14,16,18,15,14]);
 assert(run().schedules.every(s=>s.action==='preserved'));
 const state=await call(admin,'admin/state',undefined,'GET');assert.equal(other(state),previous);
 for(const [track,definition]of Object.entries(source.tracks))for(const gender of ['boys','girls']){
  const profile={name:'طالب جدول رابعة',year:4,gender,track,semester:1},courses=coursesFor(profile);
  await call(student,'student/profile',profile,'PATCH');
  const schedule=state.schedules.find(s=>s.cohortKey===`4-${gender}-${track}-1`);assert.equal(schedule.status,'published');assert.equal(schedule.academicYear,'2026/2027');
  const expected=definition.entries.filter(e=>!e.gender||e.gender===gender);
  assert.equal(schedule.entries.length,expected.length);
  for(let i=0;i<expected.length;i++)for(const key of ['title','day','start','end','location'])assert.equal(schedule.entries[i][key],expected[i][key]??'');
  for(const elective of courses.filter(c=>c.kind==='elective'))for(const sportId of elective.sportOptions){
   await call(student,'student/specializations',{courseId:elective.id,sportId},'PATCH');
   const visible=(await call(student,'student/state',undefined,'GET')).schedule.entries;
   for(let i=0;i<expected.length;i++){
    const row=expected[i],actual=schedule.entries[i];if(actual.courseId!==elective.id)continue;
    const shouldAppear=(!row.sportId||row.sportId===sportId)&&(!row.allowedSportIds||row.allowedSportIds.includes(sportId))&&!row.excludedSportIds?.includes(sportId);
    assert.equal(visible.some(e=>e.id===actual.id),shouldAppear,`${track}/${gender}/${sportId}/${row.title}`);
   }
  }
  if(track==='management')assert.equal(schedule.entries.find(e=>e.day===5&&e.start==='16:00').end,'20:00');
  if(track==='teaching'){assert(schedule.dayNotes[1].includes('تربية عملية خارجية'));assert(schedule.dayNotes[2].includes('تربية عملية خارجية'));assert(!schedule.entries.some(e=>e.day===1));}
  if(track==='training'){assert(schedule.entries.some(e=>e.title==='المنشطات في المجال الرياضي'&&e.courseId));assert(!schedule.entries.some(e=>e.title.includes('المنشآت')));assert(!schedule.entries.some(e=>e.day===4||e.day===5));}
  await call(admin,'admin/schedules',{...schedule,profile},'POST');const saved=(await call(admin,'admin/state',undefined,'GET')).schedules.find(s=>s.id===schedule.id);assert.deepEqual(saved.entries.map(e=>[e.courseId,e.sportId,e.excludedSportIds,e.title,e.start,e.end]),schedule.entries.map(e=>[e.courseId,e.sportId,e.excludedSportIds,e.title,e.start,e.end]));
 }
 const profile={name:'طالب جدول رابعة',year:4,gender:'girls',track:'teaching',semester:1};await call(student,'student/profile',profile,'PATCH');await pupil.goto(base+'/student/schedule');
 await pupil.getByRole('button',{name:'الأسبوع',exact:true}).click();assert(await pupil.getByText(/تربية عملية خارجية — حسب فترة/).count()>=2);
 for(const width of [320,390,1440]){await layout(pupil,'/student/schedule',width,'fourth-year-agenda');await pupil.getByRole('button',{name:/^الاثنين،/}).click();assert(await pupil.getByText(/تربية عملية خارجية — حسب فترة/).isVisible());}
 await pupil.getByRole('button',{name:/^الأحد،/}).click();assert(await pupil.getByRole('heading',{name:'يومك في التربية العملية.'}).isVisible());assert(!(await pupil.locator('.lecture-time').allTextContents()).some(t=>/16:00|18:00|20:00/.test(t)));
 await call(student,'student/profile',{...profile,semester:2},'PATCH');assert.equal((await call(student,'student/state',undefined,'GET')).schedule,null);
 assert(run().schedules.every(s=>s.action==='preserved'));assert.equal(other(await call(admin,'admin/state',undefined,'GET')),previous);
 console.log('PASS: all six fourth-year schedules; exact source times/venues; corrected doping course; every allowed sport and exclusions; fieldwork without invented hours in day/week; 4-hour placement; editor round trip; safe repeat import; other schedules preserved.');
};
