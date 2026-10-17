import type {DatabaseSync} from "node:sqlite";
import {contentCourseId} from "../content-courses.ts";
type Entity='lesson'|'unit';
export function contentId(database:DatabaseSync,entity:Entity,id:string):string{return String(database.prepare('SELECT canonical_id FROM content_aliases WHERE entity=? AND alias_id=?').get(entity,id)?.canonical_id||id);}
export function contentIds(database:DatabaseSync,entity:Entity,id:string):string[]{const root=contentId(database,entity,id);return [root,...database.prepare('SELECT alias_id FROM content_aliases WHERE entity=? AND canonical_id=?').all(entity,root).map(r=>String(r.alias_id))];}
function stable(value:unknown):unknown {if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>key!=='id').sort(([a],[b])=>a.localeCompare(b)).map(([key,v])=>[key,stable(v)]));return value;}
// Legacy copies remain intact. Only exact cross-cohort duplicates become aliases.
// Shared records created through the API are stored once under their content course.
export function syncSharedContent(database:DatabaseSync){
  const sources=database.prepare("SELECT DISTINCT course_id FROM course_units WHERE id NOT IN (SELECT alias_id FROM content_aliases WHERE entity='unit') UNION SELECT DISTINCT course_id FROM lessons WHERE id NOT IN (SELECT alias_id FROM content_aliases WHERE entity='lesson')").all();
  if(sources.every(row=>contentCourseId(String(row.course_id))===row.course_id))return;
  database.exec('SAVEPOINT sync_shared_content');try{
  const alias=database.prepare('INSERT OR IGNORE INTO content_aliases(entity,alias_id,canonical_id) VALUES(?,?,?)');
  const units=database.prepare("SELECT * FROM course_units WHERE id NOT IN (SELECT alias_id FROM content_aliases WHERE entity='unit') ORDER BY id").all();
  const unitGroups=new Map<string,typeof units>();
  for(const row of units){const source=String(row.course_id),course=contentCourseId(source);const key=JSON.stringify([course,row.title,row.position]);const group=unitGroups.get(key)||[];group.push(row);unitGroups.set(key,group);}
  for(const rows of unitGroups.values()){
    rows.sort((a,b)=>Number(String(a.course_id)!==contentCourseId(String(a.course_id)))-Number(String(b.course_id)!==contentCourseId(String(b.course_id))));const root=rows[0];const source=String(root.course_id);
    for(const row of rows.slice(1))if(String(row.course_id)!==source&&contentCourseId(String(row.course_id))===contentCourseId(source))alias.run('unit',String(row.id),String(root.id));
    for(const row of rows)if(contentId(database,'unit',String(row.id))===row.id&&contentCourseId(String(row.course_id))!==row.course_id)database.prepare('UPDATE course_units SET course_id=? WHERE id=?').run(contentCourseId(String(row.course_id)),String(row.id));
  }
  const lessons=database.prepare("SELECT * FROM lessons WHERE id NOT IN (SELECT alias_id FROM content_aliases WHERE entity='lesson') ORDER BY created_at,id").all();const groups=new Map<string,typeof lessons>();
  for(const row of lessons){const key=JSON.stringify(stable([contentCourseId(String(row.course_id)),contentId(database,'unit',String(row.unit_id)),row.title,row.intro,row.body,row.youtube_url,row.sport_id,row.status,JSON.parse(String(row.structure))]));const rows=groups.get(key)||[];rows.push(row);groups.set(key,rows);}
  for(const rows of groups.values()){
    rows.sort((a,b)=>Number(String(a.course_id)!==contentCourseId(String(a.course_id)))-Number(String(b.course_id)!==contentCourseId(String(b.course_id))));const root=rows[0];const source=String(root.course_id);
    for(const row of rows.slice(1))if(String(row.course_id)!==source&&contentCourseId(String(row.course_id))===contentCourseId(source))alias.run('lesson',String(row.id),String(root.id));
    for(const row of rows)if(contentId(database,'lesson',String(row.id))===row.id){const course=contentCourseId(String(row.course_id)),unit=contentId(database,'unit',String(row.unit_id));if(course!==row.course_id||unit!==row.unit_id)database.prepare('UPDATE lessons SET course_id=?,unit_id=? WHERE id=?').run(course,unit,String(row.id));}
  }
  database.exec('RELEASE sync_shared_content');
  }catch(error){database.exec('ROLLBACK TO sync_shared_content; RELEASE sync_shared_content');throw error;}
}
