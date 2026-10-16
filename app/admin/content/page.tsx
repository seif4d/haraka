import AdminScreen from "@/components/admin-screen";
import { catalog } from "@/lib/catalog";
export default async function Page({searchParams}:{searchParams:Promise<{courseId?:string}>}) {const {courseId}=await searchParams;return <AdminScreen view="content" contentCourseId={catalog.some(c=>c.id===courseId)?courseId:undefined}/>;}
