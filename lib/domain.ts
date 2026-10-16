import type { LocalLesson, Profile } from "./curriculum";
import type { Specializations } from "./specializations";
import type { StudentLearning } from "./academic-domain";
import type { LessonBlock } from "./lesson-blocks";

export type Role = "student" | "admin" | "instructor";
export type User = { id: string; email: string; role: Role; profile: Profile; active: boolean; createdAt: string };
export type LessonPractice = { question:string; options:string[]; correctIndex:number; explanation:string };
export type LessonDetails = {unitTitle:string;unitOrder:number;position:number;durationMinutes:number;takeaways:string;application:string;practice:LessonPractice|null;blocks:LessonBlock[];editorialNotes?:string};
export type Lesson = LocalLesson & LessonDetails & { status: "draft" | "published"; authorId: string; updatedAt: string; sportId: string };
export type ScheduleEntry = {id:string;day:number;start:string;end:string;courseId:string;sportId:string;location:string;instructor:string;kind:"lecture"|"practical";title?:string;notes?:string;timeLabel?:string;excludedSportIds?:string[]};
export type Schedule = {id:string;cohortKey:string;academicYear:string;sourceLabel:string;sourceUrl:string;status:"draft"|"published";entries:ScheduleEntry[];updatedAt:string;notes?:string;dayNotes?:Record<string,string>};
export type StudentData = { announcement:string; email:string; profile: Profile; saved: string[]; completed: string[]; lessonVisits:Record<string,string>; lessons: Lesson[]; dark: boolean; specializations:Specializations; schedule:Schedule|null; learning:StudentLearning };
export const ROLE_LABELS: Record<Role, string> = { student: "طالب", admin: "إدارة", instructor: "دكتور — واجهة لاحقًا" };
export function homeFor(role: Role) { return role === "admin" ? "/admin" : role === "instructor" ? "/instructor" : "/student"; }
