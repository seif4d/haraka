const {DatabaseSync}=require('node:sqlite');
const {resolve}=require('node:path');
const {coursesFor,DEFAULT_PROFILE}=require('../lib/curriculum.ts');
const {TRAINING_EXPERIENCE}=require('../lib/training-experience.ts');
const {validateLessonBlocks}=require('../lib/lesson-blocks.ts');
const publish=process.argv.includes('--publish');
const db=new DatabaseSync(resolve(process.env.HARKA_DATABASE_PATH||'.data/harka.sqlite'));
db.exec('PRAGMA foreign_keys=ON;PRAGMA busy_timeout=5000;');
const actor=db.prepare("SELECT id FROM users WHERE role='admin' AND active=1 LIMIT 1").get();
if(!actor)throw new Error('Set up an active admin before creating the example lessons.');
const {title,intro,body,...details}=TRAINING_EXPERIENCE;
const structure={...details,practice:null,blocks:validateLessonBlocks(details.blocks)};
const result=[];
db.exec('BEGIN IMMEDIATE');
try{
  for(const gender of ['boys','girls']){
    const id=`experience-training-year2-${gender}`;
    const course=coursesFor({...DEFAULT_PROFILE,year:2,semester:1,track:'general',gender}).find(c=>c.title==='مبادئ التدريب الرياضي');
    if(!course)throw new Error('Training course not found.');
    const existing=db.prepare('SELECT course_id,status FROM lessons WHERE id=?').get(id);
    if(existing){if(existing.course_id!==course.id)throw new Error('Unexpected existing example lesson.');result.push({gender,id,status:existing.status,action:'preserved'});continue;}
    const now=new Date().toISOString(),status=publish?'published':'draft';
    db.prepare('INSERT INTO lessons(id,course_id,title,intro,body,youtube_url,status,author_id,created_at,updated_at,sport_id,structure) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(id,course.id,title,intro,body,'',status,actor.id,now,now,'',JSON.stringify(structure));
    db.prepare('INSERT INTO audit_log(actor_id,action,entity_id,created_at) VALUES(?,?,?,?)').run(actor.id,'create_lesson',id,now);
    result.push({gender,id,status,action:'created'});
  }
  db.exec('COMMIT');
}catch(error){db.exec('ROLLBACK');throw error;}finally{db.close();}
console.log(JSON.stringify({lessons:result},null,2));
