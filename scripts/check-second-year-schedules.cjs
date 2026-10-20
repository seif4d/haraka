const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {join}=require('node:path');
module.exports=async({base,call,admin,student,pupil,layout})=>{
 const other=s=>JSON.stringify(s.schedules.filter(s=>!s.cohortKey.startsWith('2-')));
 const previous=other(await call(admin,'admin/state',undefined,'GET'));
 const run=()=>JSON.parse(execFileSync(process.execPath,[join(__dirname,'import-second-year-schedules.cjs')],{env:process.env,encoding:'utf8'}));
 assert.deepEqual(run().schedules.map(s=>s.entries),[44,42]);assert(run().schedules.every(s=>s.action==='preserved'));
 const state=await call(admin,'admin/state',undefined,'GET');assert.equal(other(state),previous);
 const matrices={boys:{0:[[null,'أثقال','دفاع','جمباز'],['حاسب عملي','حاسب عملي','جمباز','دفاع'],['دفاع','جمباز','أثقال',null],['جمباز','دفاع',null,'أثقال'],['أثقال',null,null,null]],2:[['أثقال','سلة',null,null],['سلة','أثقال','حاسب عملي','حاسب عملي'],[null,null,'أثقال','سلة'],[null,null,'سلة','أثقال']],3:[['جمباز','دفاع','سلة',null],['دفاع','جمباز',null,'سلة'],['سلة',null,'جمباز','دفاع'],[null,'سلة','دفاع','جمباز']]},girls:{4:[['جمباز','تعبير','سلة','دفاع'],['تعبير','جمباز','دفاع','سلة'],['سلة','دفاع','جمباز','تعبير'],['دفاع','سلة','تعبير','جمباز']],5:[['دفاع','سلة','تعبير','جمباز'],['سلة','دفاع','جمباز','تعبير'],['تعبير','جمباز','دفاع','سلة'],['جمباز','تعبير','سلة','دفاع']]}};
 const places={'جمباز':'صالة الجمباز الخامس','دفاع':'صالة الروف','أثقال':'صالة الأثقال بالأرضي','سلة':'ملعب السلة 3 — الملاعب الجديدة','تعبير':'صالة التعبير الخامس','حاسب عملي':''};
 for(const gender of ['boys','girls']){
  const limit=gender==='boys'?9:12,profile={name:'طالب جدول تانية',year:2,gender,track:'general',semester:1};
  await call(student,'student/profile',profile,'PATCH');let data=await call(student,'student/state',undefined,'GET');assert.equal(data.schedule.entries.length,8);assert.deepEqual(data.schedule.classGroupOptions,Array.from({length:limit},(_,i)=>i+1));
  for(let section=1;section<=limit;section++){
   await call(student,'student/profile',{...profile,classGroup:section},'PATCH');data=await call(student,'student/state',undefined,'GET');assert.equal(data.profile.classGroup,section);assert.equal(data.schedule.entries.length,17);assert.equal(data.schedule.entries.filter(e=>e.kind==='practical').length,9);
   const group=gender==='girls'?Math.floor((section-1)/3):Math.min(3,Math.floor((section-1)/2));
   for(const [day,matrix]of Object.entries(matrices[gender]))for(let slot=0;slot<matrix.length;slot++){
    const rows=data.schedule.entries.filter(e=>e.kind==='practical'&&e.day===Number(day)&&e.start===`${String(8+slot*2).padStart(2,'0')}:00`);const title=matrix[slot][group];assert.equal(rows.length,title?1:0);if(title){assert.equal(rows[0].title,title);assert.equal(rows[0].location,places[title]);}
   }
   const computer=data.schedule.entries.filter(e=>e.title==='حاسب عملي');assert.equal(computer.length,1);assert.equal(computer[0].location,'');if(gender==='girls'){assert.equal(computer[0].day,2);assert.equal(computer[0].start,section<=6?'10:00':'14:00');}
   const free=gender==='boys'?[1,5]:[0,1];assert(!data.schedule.entries.some(e=>free.includes(e.day)));
   for(const day of [0,1,2,3,4,5]){const rows=data.schedule.entries.filter(e=>e.day===day).sort((a,b)=>a.start.localeCompare(b.start));for(let i=1;i<rows.length;i++)assert(rows[i-1].end<=rows[i].start,'A student must never have overlapping sessions');}
  }
  for(const invalid of [0,limit+1]){await call(student,'student/profile',{...profile,classGroup:invalid},'PATCH');assert.equal((await call(student,'student/state',undefined,'GET')).schedule.entries.length,8);}
  const schedule=state.schedules.find(s=>s.cohortKey===`2-${gender}-general-1`);await call(admin,'admin/schedules',{...schedule,profile},'POST');const saved=(await call(admin,'admin/state',undefined,'GET')).schedules.find(s=>s.id===schedule.id);assert.deepEqual(saved.entries.map(e=>e.classGroups),schedule.entries.map(e=>e.classGroups));await call(admin,'admin/schedules',{...schedule,profile,entries:[{...schedule.entries[0],classGroups:[limit+1]}]},'POST',400);
 }
 await call(student,'student/profile',{name:'طالب جدول تانية',year:2,gender:'girls',track:'general',semester:1},'PATCH');await pupil.goto(base+'/student/schedule');await pupil.getByLabel('شعبتي في الجدول',{exact:true}).selectOption('12');await pupil.reload();assert.equal(await pupil.getByLabel('شعبتي في الجدول',{exact:true}).inputValue(),'12');await pupil.getByRole('button',{name:'الأسبوع',exact:true}).click();assert.equal(await pupil.locator('[data-session-id]').count(),17);assert(!(await pupil.locator('.lecture-time').allTextContents()).some(t=>/16:00|18:00|20:00/.test(t)));
 for(const width of [320,390,1440])await layout(pupil,'/student/schedule',width,'second-year-agenda');
 assert(run().schedules.every(s=>s.action==='preserved'));assert.equal(other(await call(admin,'admin/state',undefined,'GET')),previous);
 console.log('PASS: second-year boys/girls; all 21 sections, exact rotations, empty slots, no overlap, computer groups, venues, limits, persisted mobile selection, admin round trip, safe repeat imports.');
};
