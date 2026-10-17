import {contentCourseId} from "@/lib/content-courses";
import {contentId} from "@/lib/server/shared-content";
import {db} from "@/lib/server/db";
import LessonAuthor from "@/components/lesson-author";
import { requireUser } from "@/lib/server/auth";
import { listCourseUnits } from "@/lib/server/course-units";
import { listLessons } from "@/lib/server/repository";
import { catalog } from "@/lib/catalog";
import { notFound } from "next/navigation";

export const metadata={title:'استوديو الدرس | حركة',robots:{index:false,follow:false}};

export default async function Page({searchParams}:{searchParams:Promise<{courseId?:string;unitId?:string}>}){
  await requireUser('admin');const input=await searchParams;const units=listCourseUnits();const query={...input,courseId:input.courseId?contentCourseId(input.courseId):undefined,unitId:input.unitId?contentId(db(),'unit',input.unitId):undefined};
  if(query.courseId&&!catalog.some(c=>c.id===query.courseId))notFound();
  if(query.unitId&&!units.some(u=>u.id===query.unitId&&u.courseId===query.courseId))notFound();
  const placement=query.courseId?{courseId:query.courseId,unitId:query.unitId||'',position:Math.max(0,...listLessons().filter(l=>l.courseId===query.courseId&&(l.unitId||'')===(query.unitId||'')).map(l=>l.position))+1}:undefined;
  return <LessonAuthor initial={null} initialUnits={units} placement={placement}/>;
}
