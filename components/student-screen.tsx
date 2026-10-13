import { AcademicError, getAttempt } from "@/lib/server/academic";
import type { Attempt } from "@/lib/academic-domain";
import { notFound } from "next/navigation";
import HarkaApp, { type StudentView } from "./harka-app";
import { requireUser } from "@/lib/server/auth";
import { studentData } from "@/lib/server/repository";
import { coursesFor, isDemoCourse } from "@/lib/curriculum";
export default async function StudentScreen({ view, id = "" }: { view: StudentView; id?: string }) {
  const user = await requireUser("student"); const data = studentData(user);
  if ((view === "course" || view === "lesson") && !coursesFor(data.profile).some(course=>course.id===id && (view!=="lesson" || isDemoCourse(course)))) notFound();
  if(view === "custom" && !data.lessons.some(lesson=>lesson.id===id)) notFound();
  if(view==="assignment" && !data.learning.assignments.some(a=>a.id===id))notFound();
  let attempt:Attempt|undefined;
  if(view==="exam"){try{attempt=getAttempt(user,id);}catch(error){if(error instanceof AcademicError && error.status===404)notFound();throw error;}}
  return <HarkaApp key={`${view}-${id}`} initialData={data} initialView={view} routeId={id} initialAttempt={attempt} renderedAt={new Date().toISOString()}/>;
}
