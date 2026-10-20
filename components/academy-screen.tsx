import {notFound,redirect} from "next/navigation";
import {requireUser} from "@/lib/server/auth";
import {academyCourses} from "@/lib/server/academy";
import {adminData,studentData} from "@/lib/server/repository";
import AdminApp,{type AdminData} from "./admin-app";
import HarkaApp from "./harka-app";
import AcademyAuthor from "./academy-author";
export default async function AcademyScreen({admin=false,courseId,lessonId,author=false,unitId,preview=false}:{admin?:boolean;courseId?:string;lessonId?:string;author?:boolean;unitId?:string;preview?:boolean}){
 const user=await requireUser(admin?'admin':'student');const courses=academyCourses(user);const course=courses.find(c=>c.id===courseId);if(courseId&&!course)notFound();if(lessonId&&!course?.lessons.some(l=>l.id===lessonId))notFound();if(!admin&&lessonId&&!course?.enrolled)redirect(`/student/academy/${courseId}`);
 if(author){if(!admin||!course)notFound();return <AcademyAuthor course={course} lesson={course.lessons.find(l=>l.id===lessonId)} unitId={unitId}/>;}
 if(preview&&!admin)notFound();
 const previewCourses=preview&&course?[{...course,lessons:course.lessons.filter(l=>l.status==='published'),units:course.units.filter(u=>course.lessons.some(l=>l.unitId===u.id&&l.status==='published'))}]:courses;
 const data={courses:previewCourses,courseId,lessonId,admin,preview};return admin?<AdminApp key={`academy:${courseId||''}:${lessonId||''}`} initialData={adminData() as unknown as AdminData} user={user} view="academy" academyData={data}/>:<HarkaApp key={`academy:${courseId||''}:${lessonId||''}`} initialData={studentData(user)} initialView="academy" routeId={courseId||''} renderedAt={new Date().toISOString()} academyData={data}/>;
}
