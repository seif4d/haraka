const {DatabaseSync}=require('node:sqlite');
const {resolve}=require('node:path');
const assert=require('node:assert/strict');
const original=require('../data/training-principles-unit1.json');
const enhanced=require('../data/training-principles-interactive.json');
const {validateLessonBlocks}=require('../lib/lesson-blocks.ts');
const {coursesFor,DEFAULT_PROFILE}=require('../lib/curriculum.ts');
function upgrade(database,apply=false){
  const d=new DatabaseSync(resolve(database));d.exec('PRAGMA foreign_keys=ON;PRAGMA busy_timeout=5000;BEGIN IMMEDIATE');
  try{
    const actor=d.prepare("SELECT id FROM users WHERE role='admin' AND active=1 ORDER BY created_at LIMIT 1").get();assert(actor,'Active admin required.');
    const changes=[];
    for(const gender of ['boys','girls']){
      const course=coursesFor({...DEFAULT_PROFILE,year:2,semester:1,track:'general',gender}).find(c=>c.title==='مبادئ التدريب الرياضي');assert(course);
      for(const [i,l] of enhanced.entries()){
        validateLessonBlocks(l.blocks);const id=`${l.sourceId}-${gender}`;
        const row=d.prepare('SELECT * FROM lessons WHERE id=?').get(id);assert(row&&row.course_id===course.id,`Missing or unexpected course for ${id}`);
        const details=JSON.parse(row.structure);const current=JSON.stringify(details.blocks);const next=JSON.stringify(l.blocks);
        if(current===next && row.intro===l.intro){changes.push({id,action:'preserved',status:row.status});continue;}
        // Stop before overwriting a separately edited explanation. Notes, status and progress are retained.
        assert(current===JSON.stringify(original[i].blocks)||current===next,`Custom content detected: ${id}. Merge it before upgrading.`);
        if(apply){const now=new Date().toISOString();d.prepare('UPDATE lessons SET intro=?,structure=?,updated_at=? WHERE id=?').run(l.intro,JSON.stringify({...details,blocks:l.blocks,experienceVersion:2,durationMinutes:Math.max(details.durationMinutes||0,l.durationMinutes)}),now,id);d.prepare('INSERT INTO audit_log(actor_id,action,entity_id,created_at) VALUES(?,?,?,?)').run(actor.id,'update_lesson',id,now);}
        changes.push({id,action:apply?'updated':'planned',status:row.status});
      }
    }
    d.exec(apply?'COMMIT':'ROLLBACK');return {applied:apply,updated:changes.filter(c=>c.action==='updated').length,preserved:changes.filter(c=>c.action==='preserved').length,lessons:changes};
  }catch(e){d.exec('ROLLBACK');throw e;}finally{d.close();}
}
if(require.main===module)console.log(JSON.stringify(upgrade(process.env.HARKA_DATABASE_PATH||'.data/harka.sqlite',process.argv.includes('--apply')),null,2));
module.exports={upgrade};
