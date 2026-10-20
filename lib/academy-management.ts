import {hasLessonContent} from "./lesson-blocks";
import type {AcademyCourse,AcademyLesson,AcademyMeta} from "./academy";
export type AcademyDraft=AcademyMeta & {title:string;coverId:string};
export type AcademyActionResult={id?:string;revision?:number;deleted?:boolean;saved?:boolean};
export type AcademyAction=(name:string,payload:Record<string,unknown>)=>Promise<AcademyActionResult>;
export function academyDraft(course:AcademyCourse):AcademyDraft{return {title:course.title,summary:course.summary,category:course.category,level:course.level,outcomes:course.outcomes,audience:course.audience,prerequisites:course.prerequisites,instructor:course.instructor,instructorBio:course.instructorBio,coverId:course.cover?.id||''};}
export function lessonReady(lesson:AcademyLesson){return lesson.title.trim().length>=3&&(!!lesson.youtubeId||hasLessonContent(lesson.blocks));}
export function academyReadiness(course:AcademyCourse){const published=course.lessons.filter(l=>l.status==='published');return [
 {id:'title',title:'عنوان واضح للكورس',description:'اسم من ٣ أحرف على الأقل.',done:course.title.trim().length>=3,tab:'details'},
 {id:'summary',title:'وصف يوضّح قيمة الكورس',description:'وصف من ١٠ أحرف على الأقل.',done:course.summary.trim().length>=10,tab:'details'},
 {id:'outcomes',title:'نتائج التعلّم',description:'وضّح المهارة أو الفهم المتوقع من الكورس.',done:course.outcomes.trim().length>=5,tab:'details'},
 {id:'audience',title:'الجمهور المناسب',description:'حدّد مين هيستفيد من الرحلة دي.',done:course.audience.trim().length>=3,tab:'details'},
 {id:'lessons',title:'درس مكتمل ومنشور',description:'درس منشور على الأقل، وكل درس منشور فيه شرح أو فيديو.',done:published.length>0&&published.every(lessonReady),tab:'curriculum'}
 ];}
export function academySearch(value:string){return value.normalize('NFKD').replace(/[\u0640\u064B-\u065F\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').toLowerCase().trim();}
export function academyLessonPayload(lesson:AcademyLesson){return {id:lesson.id,revision:lesson.revision,unitId:lesson.unitId,title:lesson.title,intro:lesson.intro,youtubeUrl:lesson.youtubeId?`https://www.youtube.com/watch?v=${lesson.youtubeId}`:'',duration:lesson.duration,status:lesson.status,blocks:lesson.blocks,fileIds:lesson.files.map(f=>f.id)};}
