import {contentId} from "@/lib/server/shared-content";
import {db} from "@/lib/server/db";
import LessonAuthor from "@/components/lesson-author";
import { requireUser } from "@/lib/server/auth";
import { listCourseUnits } from "@/lib/server/course-units";
import { listLessons } from "@/lib/server/repository";
import { notFound,redirect } from "next/navigation";

export const metadata={title:'استوديو الدرس | حركة',robots:{index:false,follow:false}};

export default async function Page({params,searchParams}:{params:Promise<{lessonId:string}>;searchParams:Promise<{saved?:string}>}){
  await requireUser('admin');const {lessonId}=await params;const lessons=listLessons();const id=contentId(db(),'lesson',lessonId);const lesson=lessons.find(l=>l.id===id);if(!lesson)notFound();if(id!==lessonId)redirect(`/admin/content/${encodeURIComponent(id)}/edit`);
  return <LessonAuthor key={lesson.id} initial={lesson} initialUnits={listCourseUnits()} justSaved={(await searchParams).saved==='1'}/>;
}
