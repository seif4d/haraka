const {DatabaseSync}=require('node:sqlite');
const {randomUUID}=require('node:crypto');
const {resolve}=require('node:path');
const {coursesFor,DEFAULT_PROFILE}=require('../lib/curriculum.ts');
const source=require('../data/fourth-year-2026-2027.cjs');
const path=resolve(process.env.HARKA_DATABASE_PATH || '.data/harka.sqlite');
const database=new DatabaseSync(path);
if(!database.prepare('PRAGMA table_info(schedules)').all().some(c=>c.name==='day_notes'))throw new Error('Start the updated app once to migrate the local database before import.');
const actor=database.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").get();
if(!actor)throw new Error('Set up the platform admin before importing.');
const results=[];const replace=process.argv.includes('--replace');
database.exec('BEGIN IMMEDIATE');
try{
  for(const [track,definition] of Object.entries(source.tracks))for(const gender of ['boys','girls']){
    const profile={...DEFAULT_PROFILE,year:4,semester:source.semester,track,gender};const courses=coursesFor(profile);const cohort=`4-${gender}-${track}-${source.semester}`;
    const existing=database.prepare('SELECT id FROM schedules WHERE cohort_key=?').get(cohort);
    if(existing&&!replace){results.push({cohort,action:'preserved'});continue;}
    const entries=definition.entries.filter(r=>!r.gender || r.gender===gender).map(raw=>{
      const r={...raw,...raw.variants?.[gender]};
      const course=r.category?courses.find(c=>c.kind==='elective' && (r.category==='individual'?c.title.includes('فرد'):!c.title.includes('فرد'))):r.course?courses.find(c=>c.title===r.course):null;
      if((r.course || r.category) && !course)throw new Error(`Course not found: ${cohort} / ${r.course || r.category}`);
      return {id:randomUUID(),day:r.day,start:r.start,end:r.end,title:r.title,location:r.location || '',courseId:course?.id || '',sportId:r.sportId || '',excludedSportIds:r.allowedSportIds?(course.sportOptions||[]).filter(id=>!r.allowedSportIds.includes(id)):(r.excludedSportIds||[]),notes:r.notes || '',timeLabel:r.timeLabel || '',instructor:'',kind:r.kind || 'lecture'};
    });
    const id=existing?.id || randomUUID();
    database.prepare("INSERT INTO schedules(id,cohort_key,academic_year,source_label,source_url,status,entries,updated_at,notes,day_notes) VALUES(?,?,?,?,?,'published',?,?,?,?) ON CONFLICT(cohort_key) DO UPDATE SET academic_year=excluded.academic_year,source_label=excluded.source_label,source_url=excluded.source_url,status=excluded.status,entries=excluded.entries,updated_at=excluded.updated_at,notes=excluded.notes,day_notes=excluded.day_notes").run(id,cohort,source.academicYear,source.sourceLabel,'',JSON.stringify(entries),new Date().toISOString(),source.notes||'',JSON.stringify(definition.dayNotes));
    database.prepare('INSERT INTO audit_log(actor_id,action,entity_id,created_at) VALUES(?,?,?,?)').run(actor.id,'import_user_schedule',id,new Date().toISOString());
    results.push({cohort,entries:entries.length,action:existing?'updated':'created'});
  }
  database.exec('COMMIT');
}catch(error){database.exec('ROLLBACK');throw error;}finally{database.close();}
console.log(JSON.stringify({academicYear:source.academicYear,semester:source.semester,schedules:results},null,2));
