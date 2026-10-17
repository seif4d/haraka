import { INTERACTIVE_TYPES } from "./lesson-blocks";
import type { Course } from "./curriculum";
import { isDemoCourse } from "./curriculum";
import type { LessonDetails, StudentData } from "./domain";
export const EMPTY_LESSON_DETAILS:LessonDetails={unitTitle:"",unitOrder:1,position:1,durationMinutes:0,takeaways:"",application:"",practice:null,blocks:[]};
export type CourseStep={id:string;title:string;intro:string;href:string;unitId?:string;unitTitle:string;unitOrder:number;position:number;durationMinutes:number;kind:"video"|"reading"|"interactive";createdAt:string};
export function courseSteps(course:Course,data:Pick<StudentData,"lessons">):CourseStep[]{
  const steps:CourseStep[]=data.lessons.filter(l=>l.courseId===course.id).map(l=>({id:l.id,title:l.title,intro:l.intro,href:`/student/lessons/${l.id}`,unitId:l.unitId,unitTitle:l.unitTitle || "خطوات المادة",unitOrder:l.unitOrder,position:l.position,durationMinutes:l.durationMinutes,kind:l.blocks?.some(b=>INTERACTIVE_TYPES.includes(b.type))?"interactive":(l.youtubeUrl||l.blocks?.some(b=>b.type==='video'))?"video":"reading",createdAt:l.createdAt}));
  if(isDemoCourse(course))steps.push({id:`torque-${course.id}`,title:"نفس القوة، تأثير أكبر؟",intro:"افهم عزم القوة، جرّب ذراع العزم، واختبر نفسك.",href:`/student/demo/${course.id}`,unitTitle:"معمل الفكرة",unitOrder:0,position:0,durationMinutes:0,kind:"interactive",createdAt:""});
  return steps.sort((a,b)=>a.unitOrder-b.unitOrder || a.unitTitle.localeCompare(b.unitTitle,"ar") || a.position-b.position || a.createdAt.localeCompare(b.createdAt));
}
export function courseUnits(steps:CourseStep[]){const units=new Map<string,{id:string;title:string;steps:CourseStep[]}>();for(const step of steps){const key=step.unitId||`${step.unitOrder}:${step.unitTitle}`;if(!units.has(key))units.set(key,{id:key,title:step.unitTitle,steps:[]});units.get(key)!.steps.push(step);}return [...units.values()];}
export function continueStep(steps:CourseStep[],completed:string[],visited?:string){const last=steps.find(s=>s.id===visited && !completed.includes(s.id));return last || steps.find(s=>!completed.includes(s.id)) || steps[0] || null;}
export function lessonSections(body:string){const chunks=body.split(/\n\s*\n/);return chunks.map((chunk,index)=>{const lines=chunk.trim().split("\n");const heading=lines[0].match(/^#{1,3}\s+(.+)$/);return {id:`reading-${index}`,heading:heading?.[1] || "",text:(heading?lines.slice(1):lines).join("\n")};});}
