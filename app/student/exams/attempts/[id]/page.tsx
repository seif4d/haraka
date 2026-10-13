import StudentScreen from "@/components/student-screen";
export default async function Page({params}:{params:Promise<{id:string}>}){return <StudentScreen view="exam" id={(await params).id}/>;}
