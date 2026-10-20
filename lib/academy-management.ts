import {hasLessonContent} from "./lesson-blocks";
import type {AcademyCourse,AcademyLesson,AcademyMeta} from "./academy";
export type AcademyDraft=AcademyMeta & {title:string;coverId:string};
export type AcademyActionResult={id?:string;revision?:number;deleted?:boolean;saved?:boolean};
export type AcademyAction=(name:string,payload:Record<string,unknown>)=>Promise<AcademyActionResult>;
export function academyDraft(course:AcademyCourse):AcademyDraft{return {title:course.title,summary:course.summary,category:course.category,level:course.level,outcomes:course.outcomes,audience:course.audience,prerequisites:course.prerequisites,instructor:course.instructor,instructorBio:course.instructorBio,coverId:course.cover?.id||''};}
export function lessonReady(lesson:AcademyLesson){return lesson.title.trim().length>=3&&(!!lesson.youtubeId||hasLessonContent(lesson.blocks));}
export function academyReadiness(course:AcademyCourse){const published=course.lessons.filter(l=>l.status==='published');return [
 {id:'title',title:'عنوان واضح للكورس',description:'المطلوب للنشر: اسم من ٣ أحرف على الأقل.',required:true,done:course.title.trim().length>=3,tab:'details'},
 {id:'summary',title:'وصف يوضّح قيمة الكورس',description:'اختياري؛ عرّف الطالب بفكرة الكورس.',required:false,done:!!course.summary.trim(),tab:'details'},
 {id:'outcomes',title:'نتائج التعلّم',description:'اختياري؛ وضّح المهارة أو الفهم المتوقع.',required:false,done:!!course.outcomes.trim(),tab:'details'},
 {id:'audience',title:'الجمهور المناسب',description:'اختياري؛ حدّد مين هيستفيد من الرحلة.',required:false,done:!!course.audience.trim(),tab:'details'},
 {id:'lessons',title:'درس مكتمل ومنشور',description:'يمكن إطلاق الكورس الآن، والتسجيل يفتح بعد نشر أول درس. الفيديو وحده يكفي للدرس.',required:false,done:published.length>0&&published.every(lessonReady),tab:'curriculum'}
 ];}
export function academySearch(value:string){return value.normalize('NFKD').replace(/[\u0640\u064B-\u065F\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').toLowerCase().trim();}
export function academyLessonPayload(lesson:AcademyLesson){return {id:lesson.id,revision:lesson.revision,unitId:lesson.unitId,title:lesson.title,intro:lesson.intro,youtubeUrl:lesson.youtubeId?`https://www.youtube.com/watch?v=${lesson.youtubeId}`:'',duration:lesson.duration,status:lesson.status,blocks:lesson.blocks,fileIds:lesson.files.map(f=>f.id)};}
