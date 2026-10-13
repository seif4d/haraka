const assert=require('node:assert/strict');
const {cairoClock,weekDates,sessionState,nextSession,agendaSearch}=require('../lib/schedule-agenda.ts');
module.exports=()=>{
  const row=(id,day,start,end,extra={})=>({id,day,start,end,kind:'lecture',courseId:'',sportId:'',location:'',instructor:'',...extra});
  const summer=new Date('2026-10-13T06:00:00Z'); // Tuesday 9am in Cairo.
  assert.equal(cairoClock(summer).day,3);assert.equal(cairoClock(summer).minutes,540);
  assert.equal(cairoClock(new Date('2026-12-01T06:00:00Z')).minutes,480); // Winter UTC+2.
  assert.equal(cairoClock(new Date('2026-10-12T22:00:00Z')).day,3); // Local midnight already passed.
  const dates=weekDates(new Date('2027-01-01T10:00:00Z'));assert.equal(dates[0].toISOString().slice(0,10),'2026-12-26');assert.equal(dates[6].toISOString().slice(0,10),'2027-01-01');
  const current=row('now',3,'08:00','10:00'),later=row('later',3,'10:00','12:00'),weekend=row('weekend',0,'08:00','10:00');
  assert.equal(sessionState(current,summer),'live');assert.equal(sessionState(later,summer),'upcoming');assert.equal(nextSession([weekend,later,current],summer).entry.id,'now');
  assert.equal(sessionState(current,new Date('2026-10-13T07:00:00Z')),'past');assert.equal(nextSession([current,later],new Date('2026-10-13T07:00:00Z')).entry.id,'later');
  assert.equal(nextSession([current,weekend],new Date('2026-10-13T12:00:00Z')).daysAway,4);assert.equal(nextSession([current],new Date('2026-10-13T12:00:00Z')).daysAway,7);assert.equal(nextSession([],summer),null);
  assert.equal(sessionState(row('group',3,'12:00','14:00',{timeLabel:'12–2 وما بعدها'}),new Date('2026-10-13T13:00:00Z')),'group');
  assert(agendaSearch('إِدارة المُسابقات','ادارة المسابقات'));assert(!agendaSearch('السباحة','ملاكمة'));
  console.log('PASS: Cairo timezone and DST; weekly rollover across years; current/next classes; uncertain group end times; normalized Arabic search.');
};
