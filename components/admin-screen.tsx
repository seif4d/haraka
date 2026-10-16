import AdminApp, { type AdminData, type AdminView } from "./admin-app";
import { requireUser } from "@/lib/server/auth";
import { adminData } from "@/lib/server/repository";
export default async function AdminScreen({ view, contentCourseId }: { view: AdminView;contentCourseId?:string }) {
  const user = await requireUser("admin");
  return <AdminApp key={`${view}:${contentCourseId||""}`} contentCourseId={contentCourseId} initialData={adminData() as unknown as AdminData} user={user} view={view}/>;
}
