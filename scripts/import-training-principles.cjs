// Explicit, repeatable import. Never runs on startup and never publishes a draft.
const {DatabaseSync}=require('node:sqlite');
const {resolve}=require('node:path');
const {coursesFor,DEFAULT_PROFILE}=require('../lib/curriculum.ts');
const {validateLessonBlocks}=require('../lib/lesson-blocks.ts');
const lessons=require('../data/training-principles-unit1.json');
const plan=require('../data/training-principles-plan.json');
const assert=require('node:assert/strict');

function validate(){
  assert.equal(plan.year,2);assert.equal(plan.semester,1);
  assert.equal(plan.units.length,5);assert.equal(plan.units.flatMap(u=>u.lessons).length,37);
  assert.equal(lessons.length,10);
  assert.equal(new Set(lessons.map(l=>l.sourceId)).size,10);
  for(const [i,lesson] of lessons.entries()){
    assert.equal(lesson.sourceId,`sport-training-u01-l${String(i+1).padStart(2,'0')}`);
    assert.equal(lesson.unitOrder,1);assert.equal(lesson.position,i+1);
    assert(lesson.title.length>=2 && lesson.title.length<=120);
    assert(lesson.intro.length>=2 && lesson.intro.length<=300);
    assert(lesson.takeaways.length<=3000 && lesson.editorialNotes.length<=6000);
    validateLessonBlocks(lesson.blocks);
    assert.equal(lesson.blocks.filter(b=>b.type==='quiz').length,1);
    assert.equal(lesson.blocks.filter(b=>b.type==='cards').length,1);
    assert(!JSON.stringify(lesson.blocks).includes('correctIndex:'));
    assert(!JSON.stringify(lesson.blocks).includes('ملاحظات المراجعة العلمية والتحريرية'));
  }
}
function importDrafts(database){
  validate();
  const db=new DatabaseSync(resolve(database));
  db.exec('PRAGMA foreign_keys=ON;PRAGMA busy_timeout=5000;');
  const result=[];
  try{
    const actor=db.prepare("SELECT id FROM users WHERE role='admin' AND active=1 ORDER BY created_at LIMIT 1").get();
    if(!actor)throw new Error('Set up an active admin before importing the curriculum.');
    db.exec('BEGIN IMMEDIATE');
    try{
      for(const gender of ['boys','girls']){
        const course=coursesFor({...DEFAULT_PROFILE,year:plan.year,semester:plan.semester,track:'general',gender}).find(c=>c.title===plan.title);
        if(!course)throw new Error(`Course not found for ${gender}.`);
        for(const lesson of lessons){
          const {sourceId,title,intro,body,...details}=lesson;
          const id=`${sourceId}-${gender}`;
          const existing=db.prepare('SELECT course_id,status FROM lessons WHERE id=?').get(id);
          if(existing){if(existing.course_id!==course.id)throw new Error(`Unexpected course for ${id}.`);result.push({id,action:'preserved',status:existing.status});continue;}
          const now=new Date().toISOString();
          db.prepare('INSERT INTO lessons(id,course_id,title,intro,body,youtube_url,status,author_id,created_at,updated_at,sport_id,structure) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(id,course.id,title,intro,body,'','draft',actor.id,now,now,'',JSON.stringify(details));
          db.prepare('INSERT INTO audit_log(actor_id,action,entity_id,created_at) VALUES(?,?,?,?)').run(actor.id,'create_lesson',id,now);
          result.push({id,action:'created',status:'draft'});
        }
      }
      db.exec('COMMIT');
    }catch(error){db.exec('ROLLBACK');throw error;}
  }finally{db.close();}
  return {course:plan.title,year:plan.year,semester:plan.semester,uniqueLessons:10,plannedLessons:37,created:result.filter(r=>r.action==='created').length,preserved:result.filter(r=>r.action==='preserved').length,lessons:result};
}
if(require.main===module){if(process.argv.includes('--check')){validate();console.log('PASS: 10 complete lesson drafts, 10 applications/questions and 37 planned lessons.');}else console.log(JSON.stringify(importDrafts(process.env.HARKA_DATABASE_PATH||'.data/harka.sqlite'),null,2));}
module.exports={validate,importDrafts};
