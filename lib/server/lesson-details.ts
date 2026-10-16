import "server-only";
import type { LessonDetails, LessonPractice } from "../domain";
import { EMPTY_LESSON_DETAILS } from "../course-learning";
import { AcademicError } from "./academic";
import { validateLessonBlocks } from "../lesson-blocks";
export function lessonDetails(data:Record<string,unknown>,previous?:LessonDetails):LessonDetails {
  const base={...EMPTY_LESSON_DETAILS,...previous};
  const text=(key:"unitTitle"|"takeaways"|"application",max:number)=>{const value=data[key] ?? base[key];if(typeof value!=="string" || value.length>max)throw new AcademicError(`راجع ${key==="unitTitle"?"عنوان الوحدة":"خلاصة الدرس والتطبيق"}.`);return value.trim();};
  const number=(key:"unitOrder"|"position"|"durationMinutes",min:number,max:number)=>{const raw=data[key] ?? base[key];const value=typeof raw==="string" && raw.trim()?Number(raw):raw;if(typeof value!=="number" || !Number.isInteger(value) || value<min || value>max)throw new AcademicError("راجع ترتيب الوحدة والدرس والمدة.");return value;};
  let practice:LessonPractice|null=base.practice;
  if(data.practice!==undefined){
    if(data.practice===null)practice=null;
    else {const p=data.practice as Record<string,unknown>;if(!p || typeof p!=="object" || typeof p.question!=="string" || p.question.trim().length<2 || p.question.length>1000 || !Array.isArray(p.options) || p.options.length!==3 || !p.options.every(o=>typeof o==="string" && o.trim().length>0 && o.length<=300) || new Set(p.options.map(o=>o.trim())).size!==3 || !Number.isInteger(p.correctIndex) || Number(p.correctIndex)<0 || Number(p.correctIndex)>2 || typeof p.explanation!=="string" || p.explanation.trim().length<2 || p.explanation.length>2000)throw new AcademicError("سؤال الفهم يحتاج سؤالًا وثلاثة اختيارات مختلفة وإجابة صحيحة وتفسيرًا.");practice={question:p.question.trim(),options:p.options.map(o=>String(o).trim()),correctIndex:Number(p.correctIndex),explanation:p.explanation.trim()};}
  }
  let blocks=base.blocks;
  if(data.blocks!==undefined){try{blocks=validateLessonBlocks(data.blocks);}catch(error){throw new AcademicError((error as Error).message);}}
  const editorialNotes=data.editorialNotes ?? base.editorialNotes ?? "";
  if(typeof editorialNotes!=="string" || editorialNotes.length>6000)throw new AcademicError("ملاحظات المراجعة يجب ألا تتجاوز 6000 حرف.");
  return {unitTitle:text("unitTitle",120),unitOrder:number("unitOrder",1,100),position:number("position",1,1000),durationMinutes:number("durationMinutes",0,600),takeaways:text("takeaways",3000),application:text("application",3000),practice,blocks,editorialNotes:editorialNotes.trim()};
}
