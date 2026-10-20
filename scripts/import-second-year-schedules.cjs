const {DatabaseSync}=require('node:sqlite');
const {randomUUID}=require('node:crypto');
const {resolve}=require('node:path');
const {coursesFor,DEFAULT_PROFILE}=require('../lib/curriculum.ts');
const source=require('../data/second-year-2026-2027.cjs');
const database=new DatabaseSync(resolve(process.env.HARKA_DATABASE_PATH||'.data/harka.sqlite'));
const results=[];const replace=process.argv.includes('--replace');
try{
 if(!database.prepare('PRAGMA table_info(schedules)').all().some(c=>c.name==='day_notes'))throw new Error('Start the updated app before importing.');
 const actor=database.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").get();if(!actor)throw new Error('Set up the admin before importing.');
 database.exec('BEGIN IMMEDIATE');
 try{for(const [gender,definition]of Object.entries(source.cohorts)){
  const cohort=`2-${gender}-general-${source.semester}`;const existing=database.prepare('SELECT id FROM schedules WHERE cohort_key=?').get(cohort);
  if(existing&&!replace){results.push({cohort,action:'preserved'});continue;}
  const courses=coursesFor({...DEFAULT_PROFILE,year:2,semester:source.semester,track:'general',gender});
  const entries=definition.entries.map((r,i)=>{const course=courses.find(c=>c.title===r.course);if(!course)throw new Error(`Course not found: ${cohort} / ${r.course}`);return {id:`second-year-2026-2027-${gender}-${i+1}`,day:r.day,start:r.start,end:r.end,title:r.title,location:r.location,courseId:course.id,sportId:'',excludedSportIds:[],notes:'',timeLabel:'',instructor:'',kind:r.kind,...(r.classGroups?{classGroups:r.classGroups}:{})};});
  const id=existing?.id||randomUUID(),now=new Date().toISOString();database.prepare("INSERT INTO schedules(id,cohort_key,academic_year,source_label,source_url,status,entries,updated_at,notes,day_notes) VALUES(?,?,?,?,?,'published',?,?,?,?) ON CONFLICT(cohort_key) DO UPDATE SET academic_year=excluded.academic_year,source_label=excluded.source_label,source_url=excluded.source_url,status=excluded.status,entries=excluded.entries,updated_at=excluded.updated_at,notes=excluded.notes,day_notes=excluded.day_notes").run(id,cohort,source.academicYear,source.sourceLabel,'',JSON.stringify(entries),now,'',JSON.stringify(definition.dayNotes));
  database.prepare('INSERT INTO audit_log(actor_id,action,entity_id,created_at) VALUES(?,?,?,?)').run(actor.id,'import_user_schedule',id,now);results.push({cohort,entries:entries.length,action:existing?'updated':'created'});
 }database.exec('COMMIT');}catch(error){database.exec('ROLLBACK');throw error;}
}finally{database.close();}
console.log(JSON.stringify({academicYear:source.academicYear,semester:source.semester,schedules:results},null,2));
