import "server-only";
import { createHash, randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { db, audit, transaction } from "./db";
import type { CourseUnit } from "../domain";

// Also accommodates older import tools without changing their lesson IDs or JSON.
export function syncLegacyUnits(database:DatabaseSync) {
  const rows=database.prepare("SELECT id,course_id,structure,updated_at FROM lessons WHERE unit_id='' AND json_valid(structure) AND trim(coalesce(json_extract(structure,'$.unitTitle'),''))<>''").all();
  for(const row of rows){
    const structure=JSON.parse(String(row.structure));const title=String(structure.unitTitle).trim();const position=Number(structure.unitOrder)||1;
    const existing=database.prepare("SELECT id FROM course_units WHERE course_id=? AND title=? AND position=? ORDER BY id LIMIT 1").get(String(row.course_id),title,position);
    const id=existing?String(existing.id):`unit-${createHash('sha256').update(`${row.course_id}:${position}:${title}`).digest('hex').slice(0,32)}`;
    database.prepare("INSERT OR IGNORE INTO course_units(id,course_id,title,position,updated_at) VALUES(?,?,?,?,?)").run(id,String(row.course_id),title,position,String(row.updated_at));
    database.prepare("UPDATE lessons SET unit_id=? WHERE id=? AND unit_id=''").run(id,String(row.id));
  }
}
export function listCourseUnits():CourseUnit[]{syncLegacyUnits(db());return db().prepare("SELECT id,course_id AS courseId,title,position,updated_at AS updatedAt FROM course_units ORDER BY course_id,position,id").all().map(row=>({...row})) as unknown as CourseUnit[];}
export class UnitError extends Error {constructor(message:string,public status=400){super(message);}}
function requireUnit(value:unknown,message:string,status=400):asserts value {if(!value)throw new UnitError(message,status);}
function named(value:unknown){requireUnit(typeof value==='string'&&value.trim().length>=2&&value.length<=120,'اكتب اسم الوحدة من حرفين إلى ١٢٠ حرفًا.');return value.trim();}
export function createCourseUnit(courseId:string,title:unknown,actor:string){return transaction(()=>{
  const units=listCourseUnits().filter(u=>u.courseId===courseId);requireUnit(units.length<100,'الحد الأقصى ١٠٠ وحدة للمقرر.');
  const unit={id:randomUUID(),courseId,title:named(title),position:Math.max(0,...units.map(u=>u.position))+1,updatedAt:new Date().toISOString()};
  db().prepare('INSERT INTO course_units VALUES(?,?,?,?,?)').run(unit.id,unit.courseId,unit.title,unit.position,unit.updatedAt);audit(actor,'create_unit',unit.id);return unit;
});}
export function updateCourseUnits(data:Record<string,unknown>,actor:string){return transaction(()=>{
  const courseId=String(data.courseId||'');const units=listCourseUnits().filter(u=>u.courseId===courseId);const now=new Date().toISOString();
  if(data.action==='reorder'){
    requireUnit(Array.isArray(data.units)&&data.units.length===units.length&&units.length>0,'راجع قائمة الوحدات كاملة.');
    const targets=data.units as {id:string;updatedAt:string}[];
    requireUnit(new Set(targets.map(u=>u?.id)).size===units.length,'الوحدات متكررة.');
    for(const target of targets){const unit=units.find(u=>u.id===target?.id);requireUnit(unit,'الوحدة لا تتبع المقرر.',404);requireUnit(unit.updatedAt===target.updatedAt,'الوحدات اتعدّلت في جلسة أخرى. حدّث القائمة.',409);}
    targets.forEach((target,i)=>db().prepare('UPDATE course_units SET position=?,updated_at=? WHERE id=?').run(i+1,now,target.id));
  }else{
    const unit=units.find(u=>u.id===data.id);requireUnit(unit,'الوحدة غير موجودة في المقرر.',404);requireUnit(unit.updatedAt===data.expectedUpdatedAt,'الوحدة اتعدّلت في جلسة أخرى. حدّث القائمة.',409);
    if(data.action==='rename')db().prepare('UPDATE course_units SET title=?,updated_at=? WHERE id=?').run(named(data.title),now,unit.id);
    else if(data.action==='delete'){requireUnit(!db().prepare('SELECT 1 FROM lessons WHERE unit_id=?').get(unit.id),'انقل دروس الوحدة قبل حذفها.');db().prepare('DELETE FROM course_units WHERE id=?').run(unit.id);}
    else throw new UnitError('الإجراء غير متاح.');
  }
  audit(actor,`${data.action}_unit`,courseId);return listCourseUnits();
});}
export function attachLessonUnit(id:string,courseId:string,value:unknown,details:{unitTitle:string;unitOrder:number},actor:string){
  let unitId='';
  if(value!==undefined){requireUnit(typeof value==='string','اختيار الوحدة غير صالح.');unitId=value;if(unitId)requireUnit(db().prepare('SELECT 1 FROM course_units WHERE id=? AND course_id=?').get(unitId,courseId),'اختار وحدة من نفس المقرر.');}
  else if(details.unitTitle.trim()){
    const unit=listCourseUnits().find(u=>u.courseId===courseId&&u.title===details.unitTitle.trim()&&u.position===details.unitOrder);
    unitId=unit?.id||createCourseUnitInline(courseId,details.unitTitle,details.unitOrder,actor);
  }
  if(value!==undefined){const unit=unitId?db().prepare('SELECT title,position FROM course_units WHERE id=?').get(unitId):null;details.unitTitle=unit?String(unit.title):'';details.unitOrder=unit?Number(unit.position):1;}
  db().prepare('UPDATE lessons SET unit_id=? WHERE id=?').run(unitId,id);
}
function createCourseUnitInline(courseId:string,title:string,position:number,actor:string){const id=randomUUID();db().prepare('INSERT INTO course_units VALUES(?,?,?,?,?)').run(id,courseId,title,position,new Date().toISOString());audit(actor,'create_unit',id);return id;}
