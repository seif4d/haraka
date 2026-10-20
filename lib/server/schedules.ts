import "server-only";
import {AcademicError} from "./academic";
import { randomUUID } from "node:crypto";
import { classGroupCount, coursesFor, normalizeProfile } from "../curriculum";
import { cohortKey, sportsFor, SPORTS } from "../specializations";
import type { ScheduleEntry } from "../domain";
import { audit, db, transaction } from "./db";
import { listSchedules } from "./repository";
export function saveSchedule(data:Record<string,unknown>,actorId:string) {
  const profile=normalizeProfile(data.profile); const key=cohortKey(profile); const courses=coursesFor(profile);
  if(typeof data.academicYear!=="string" || !/^20\d{2}\/20\d{2}$/.test(data.academicYear)) throw new Error("اكتب العام الدراسي مثل 2026/2027.");
  if(typeof data.sourceLabel!=="string" || data.sourceLabel.trim().length<3 || data.sourceLabel.length>150) throw new Error("اذكر مصدر الجدول.");
  const sourceUrl=typeof data.sourceUrl==="string"?data.sourceUrl.trim():"";
  if(sourceUrl) {try {if(!["https:","http:"].includes(new URL(sourceUrl).protocol) || sourceUrl.length>2048) throw new Error();}catch {throw new Error("رابط المصدر غير صالح.");}}
  if(!["draft","published"].includes(String(data.status))) throw new Error("اختر حالة نشر الجدول.");
  const notes=typeof data.notes==="string" ? data.notes.trim() : "";
  if(notes.length>2000)throw new Error("ملاحظات الجدول أطول من المسموح.");
  const dayNotes:Record<string,string>={};
  if(data.dayNotes && typeof data.dayNotes==="object" && !Array.isArray(data.dayNotes))for(const [key,value] of Object.entries(data.dayNotes)){if(!/^[0-6]$/.test(key) || typeof value!=="string" || value.length>500)throw new Error("ملاحظات الأيام غير صالحة.");dayNotes[key]=value.trim();}
  if(!Array.isArray(data.entries) || data.entries.length>80 || (data.status==="published" && !data.entries.length)) throw new Error("أضف محاضرة واحدة على الأقل قبل نشر الجدول.");
  const entries:ScheduleEntry[]=data.entries.map((raw:unknown)=>{
    if(!raw || typeof raw!=="object") throw new Error("بيانات المحاضرة غير صالحة.");
    const e=raw as Record<string,unknown>;const course=courses.find(c=>c.id===e.courseId);
    const title=typeof e.title==="string" ? e.title.trim() : "";
    if(title.length>200 || (e.courseId!=="" && !course) || (!course && !title)) throw new Error("اربط النشاط بمقرر من المسار أو اكتب عنوانًا لنشاط مستقل.");
    if(typeof e.day!=="number" || !Number.isInteger(e.day) || e.day<0 || e.day>6) throw new Error("اختر يوم المحاضرة.");
    if(typeof e.start!=="string" || typeof e.end!=="string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(e.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(e.end) || e.end<=e.start) throw new Error("نهاية المحاضرة لازم تكون بعد بدايتها.");
    const sportId=typeof e.sportId==="string"?e.sportId:"";
    if(sportId && (!course || !sportsFor(course).some(s=>s.id===sportId))) throw new Error("تخصص المحاضرة غير متاح لهذا المقرر.");
    const excludedSportIds=Array.isArray(e.excludedSportIds)?e.excludedSportIds:[];
    if(excludedSportIds.length>20 || excludedSportIds.some(id=>typeof id!=="string" || !SPORTS.some(s=>s.id===id)) || (excludedSportIds.length && (!course || course.kind!=="elective")))throw new Error("استثناءات التخصص غير صالحة.");
    const classGroups=e.classGroups===undefined?[]:e.classGroups;
    if(!Array.isArray(classGroups)||classGroups.length>classGroupCount(profile)||classGroups.some(g=>!Number.isInteger(g)||g<1||g>classGroupCount(profile))||new Set(classGroups).size!==classGroups.length)throw new Error('أرقام الشُعب غير متاحة لهذه الفرقة والفئة أو تحتوي على تكرار.');
    const timeLabel=typeof e.timeLabel==="string" ? e.timeLabel.trim() : "";
    if(timeLabel.length>80)throw new Error("وصف الوقت أطول من المسموح.");
    const entryNotes=typeof e.notes==="string" ? e.notes.trim() : "";
    if(entryNotes.length>1000)throw new Error("ملاحظة النشاط أطول من المسموح.");
    if(!["lecture","practical"].includes(String(e.kind))) throw new Error("اختر نوع المحاضرة.");
    if(typeof e.location!=="string" || e.location.length>100 || typeof e.instructor!=="string" || e.instructor.length>100) throw new Error("راجع المكان واسم المحاضر.");
    return {id:randomUUID(),day:e.day,start:e.start,end:e.end,courseId:course?.id || "",sportId,location:e.location.trim(),instructor:e.instructor.trim(),kind:e.kind as ScheduleEntry["kind"],title,notes:entryNotes,timeLabel,excludedSportIds:excludedSportIds as string[],...(classGroups.length?{classGroups:[...classGroups].sort((a,b)=>a-b)}:{})};
  });
  const existing=listSchedules().find(s=>s.cohortKey===key);const id=existing?.id || randomUUID();
  transaction(()=>{
    if(data.expectedUpdatedAt!==undefined){const current=db().prepare('SELECT updated_at FROM schedules WHERE cohort_key=?').get(key);if((current?.updated_at??null)!==data.expectedUpdatedAt)throw new AcademicError('الجدول اتغير في نافذة تانية. تعديلاتك محفوظة هنا؛ انسخ اللي محتاجه قبل تحديث الجداول ومراجعة النسخة الأحدث.',409);}
    db().prepare("INSERT INTO schedules(id,cohort_key,academic_year,source_label,source_url,status,entries,updated_at,notes,day_notes) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(cohort_key) DO UPDATE SET academic_year=excluded.academic_year,source_label=excluded.source_label,source_url=excluded.source_url,status=excluded.status,entries=excluded.entries,updated_at=excluded.updated_at,notes=excluded.notes,day_notes=excluded.day_notes").run(id,key,data.academicYear as string,data.sourceLabel as string,sourceUrl,data.status as string,JSON.stringify(entries),new Date().toISOString(),notes,JSON.stringify(dayNotes));
    audit(actorId,"save_schedule",id);
  });
  return listSchedules().find(s=>s.id===id)!;
}
