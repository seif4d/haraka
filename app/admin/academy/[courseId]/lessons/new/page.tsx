import AcademyScreen from "@/components/academy-screen";
export const dynamic="force-dynamic";
export default async function Page({params,searchParams}:{params:Promise<{courseId:string;lessonId:string}>;searchParams:Promise<{unitId?:string}>}){const {courseId}=await params;const {unitId}=await searchParams;return <AcademyScreen admin author courseId={courseId} unitId={unitId}/>;}
