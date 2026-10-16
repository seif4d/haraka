import LessonAuthor from "@/components/lesson-author";
import { requireUser } from "@/lib/server/auth";
import { listCourseUnits } from "@/lib/server/course-units";
import { listLessons } from "@/lib/server/repository";
import { notFound } from "next/navigation";

export const metadata={title:'استوديو الدرس | حركة',robots:{index:false,follow:false}};

export default async function Page({params,searchParams}:{params:Promise<{lessonId:string}>;searchParams:Promise<{saved?:string}>}){
  await requireUser('admin');const {lessonId}=await params;const lesson=listLessons().find(l=>l.id===lessonId);if(!lesson)notFound();
  return <LessonAuthor key={lesson.id} initial={lesson} initialUnits={listCourseUnits()} justSaved={(await searchParams).saved==='1'}/>;
}
