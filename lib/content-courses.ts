import {catalog,profileForCourse} from "./catalog.ts";
import {coursesFor,profileLabel,YEARS,TRACKS,type Profile} from "./curriculum.ts";
const canonical=new Map<string,string>();const shared=new Set<string>();
for(const course of catalog){
  const profile=profileForCourse(course.id);if(!profile||!['academic','practical'].includes(course.kind))continue;
  const twin=coursesFor({...profile,gender:profile.gender==='boys'?'girls':'boys'}).find(c=>c.title===course.title&&c.kind===course.kind);
  if(!twin)continue;const id=profile.gender==='boys'?course.id:twin.id;canonical.set(course.id,id);canonical.set(twin.id,id);shared.add(course.id);shared.add(twin.id);
}
export const contentCourseId=(id:string)=>canonical.get(id)||id;
export const isSharedCourse=(id:string)=>shared.has(id);
export type ContentAudience=Profile["gender"]|"shared";
export const contentAudienceFor=(id:string):ContentAudience=>isSharedCourse(id)?"shared":profileForCourse(id)?.gender||"boys";
export const contentCoursesFor=(profile:Profile,audience?:ContentAudience)=>coursesFor(audience?{...profile,gender:audience==='girls'?'girls':'boys'}:profile).filter(course=>!audience||(audience==='shared'?isSharedCourse(course.id):!isSharedCourse(course.id))).map(course=>({...course,id:contentCourseId(course.id)}));
export function contentProfileLabel(id:string){const p=profileForCourse(contentCourseId(id));return !p?'مقرر غير متاح':isSharedCourse(id)?`الفرقة ${YEARS[p.year]} · بنين وبنات${p.year>2?` · ${TRACKS[p.track]}`:''}`:profileLabel(p);}

export const contentCourseHref=(id:string,unitId?:string)=>`/admin/content/courses/${encodeURIComponent(contentCourseId(id))}${unitId?`?${new URLSearchParams({unitId})}`:""}`;
