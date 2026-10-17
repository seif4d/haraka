import {contentCourseId,contentCourseHref} from "@/lib/content-courses";
import AdminScreen from "@/components/admin-screen";
import {requireUser} from "@/lib/server/auth";
import {catalog} from "@/lib/catalog";
import {redirect} from "next/navigation";
export default async function Page({searchParams}:{searchParams:Promise<{courseId?:string;section?:string}>}){await requireUser('admin');const {courseId,section}=await searchParams;if(courseId&&catalog.some(c=>c.id===courseId))redirect(contentCourseHref(contentCourseId(courseId))+(section==='lessons'?'?section=lessons':''));return <AdminScreen view="content"/>;}
