import type {LessonBlock} from "./lesson-blocks";
import type {Attachment} from "./academic-domain";
export const ACADEMY_CATEGORIES=['تدريب رياضي','علوم الرياضة','مهارات عملية','تطوير مهني'] as const;
export const ACADEMY_LEVELS=['كل المستويات','مبتدئ','متوسط','متقدم'] as const;
export type AcademyMeta={summary:string;category:string;level:string;outcomes:string;audience:string;prerequisites:string;instructor:string;instructorBio:string};
export const EMPTY_ACADEMY_META:AcademyMeta={summary:'',category:ACADEMY_CATEGORIES[0],level:ACADEMY_LEVELS[0],outcomes:'',audience:'',prerequisites:'',instructor:'',instructorBio:''};
export type AcademyLesson={id:string;courseId:string;unitId:string;title:string;intro:string;youtubeId:string;blocks:LessonBlock[];duration:number;status:'draft'|'published';position:number;revision:number;updatedAt:string;files:Attachment[]};
export type AcademyUnit={id:string;courseId:string;title:string;position:number};
export type AcademyCourse=AcademyMeta & {id:string;title:string;status:'draft'|'published'|'archived';cover:Attachment|null;revision:number;updatedAt:string;createdAt:string;units:AcademyUnit[];lessons:AcademyLesson[];enrollmentCount:number;completionCount:number;enrolled:boolean;progress:AcademyProgress[]};
export type AcademyProgress={lessonId:string;completedAt:string|null;videoId:string;seconds:number;updatedAt:string};
export type AcademyData={courses:AcademyCourse[];courseId?:string;lessonId?:string;admin?:boolean};
export function academyPercent(course:AcademyCourse){const ids=course.lessons.filter(l=>l.status==='published').map(l=>l.id);return ids.length?Math.round(100*course.progress.filter(p=>p.completedAt&&ids.includes(p.lessonId)).length/ids.length):0;}
export function academyStart(course:AcademyCourse){const recent=[...course.progress].filter(p=>!p.completedAt).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).find(p=>course.lessons.some(l=>l.id===p.lessonId&&l.status==='published'));return course.lessons.find(l=>l.id===recent?.lessonId)||course.lessons.find(l=>l.status==='published'&&!course.progress.some(p=>p.lessonId===l.id&&p.completedAt))||course.lessons.find(l=>l.status==='published');}
