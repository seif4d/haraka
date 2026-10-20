import AcademyScreen from "@/components/academy-screen";
export const dynamic="force-dynamic";
export default async function Page({params}:{params:Promise<{courseId:string}>}){const {courseId}=await params;return <AcademyScreen admin preview courseId={courseId}/>;}
