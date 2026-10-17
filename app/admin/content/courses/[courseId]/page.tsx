import {contentCourseId,contentCourseHref} from "@/lib/content-courses";
import AdminScreen from "@/components/admin-screen";
import {requireUser} from "@/lib/server/auth";
import {catalog} from "@/lib/catalog";
import {notFound,redirect} from "next/navigation";
export const metadata={title:'منهج المادة | حركة',robots:{index:false,follow:false}};
export default async function Page({params,searchParams}:{params:Promise<{courseId:string}>;searchParams:Promise<Record<string,string>>}){await requireUser('admin');const {courseId}=await params;if(!catalog.some(c=>c.id===courseId))notFound();const id=contentCourseId(courseId);if(id!==courseId){const query=new URLSearchParams(await searchParams).toString();redirect(contentCourseHref(id)+(query?`?${query}`:''));}return <AdminScreen view="content" contentCourseId={id}/>;}
