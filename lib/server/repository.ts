import "server-only";
import { platformSettings } from "./platform-settings";
import { db } from "./db";
import type { Lesson, Schedule, StudentData, User } from "../domain";
import { userChoices } from "./specializations";
import { cohortKey } from "../specializations";
import { publicUser } from "./auth";
import { adminLearning, studentLearning } from "./academic";
import { coursesFor } from "../curriculum";
import { EMPTY_LESSON_DETAILS } from "../course-learning";
import trainingPlan from "../../data/training-principles-plan.json";

export function listLessons(publishedOnly = false): Lesson[] {
  return db().prepare(`SELECT id,sport_id AS sportId,course_id AS courseId,title,intro,body,youtube_url AS youtubeUrl,status,author_id AS authorId,created_at AS createdAt,updated_at AS updatedAt,structure FROM lessons ${publishedOnly ? "WHERE status='published'" : ""} ORDER BY created_at`).all().map(({structure,...row}) => ({ ...row,...EMPTY_LESSON_DETAILS,...JSON.parse(String(structure)) })) as unknown as Lesson[];
}
export function studentData(user: User): StudentData {
  const specializations = userChoices(user.id);
  const settings=platformSettings();
  const courseIds=new Set(coursesFor(user.profile).map(c=>c.id));
  const schedule = listSchedules().find(s=>s.cohortKey===cohortKey(user.profile) && s.status==="published") || null;
  return {
    announcement: settings.announcementEnabled ? settings.announcement : "",
    learning:studentLearning(user), email:user.email, specializations, schedule:schedule ? {...schedule,entries:schedule.entries.filter(e=>(!e.sportId || specializations[e.courseId]===e.sportId) && !e.excludedSportIds?.includes(specializations[e.courseId]))} : null,
    lessonVisits:Object.fromEntries(db().prepare("SELECT course_id,lesson_id FROM lesson_visits WHERE user_id=?").all(user.id).filter(row=>courseIds.has(String(row.course_id))).map(row=>[String(row.course_id),String(row.lesson_id)])),
    profile: user.profile, dark: false, lessons: listLessons(true).filter(l=>courseIds.has(l.courseId) && (!l.sportId || specializations[l.courseId]===l.sportId)).map(studentLesson),
    saved: db().prepare("SELECT course_id FROM bookmarks WHERE user_id=?").all(user.id).map(row => String(row.course_id)),
    completed: db().prepare("SELECT lesson_id FROM progress WHERE user_id=?").all(user.id).map(row => String(row.lesson_id)),
  };
}
export function listUsers(): User[] { return db().prepare("SELECT id,email,role,profile,active,created_at FROM users ORDER BY created_at DESC").all().map(row => publicUser(row as unknown as Parameters<typeof publicUser>[0])); }
export function adminData() {
  return { trainingPlan, settings:platformSettings(), learning:adminLearning(), schedules:listSchedules(), users: listUsers(), lessons: listLessons(), completions: Number(db().prepare("SELECT COUNT(*) AS total FROM progress").get()?.total || 0), audit: db().prepare("SELECT a.action,a.entity_id AS entityId,a.created_at AS createdAt,json_extract(u.profile,'$.name') AS name FROM audit_log a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.id DESC LIMIT 15").all().map(row => ({ ...row })) };
}

// Explicit public projection: editorial notes and future internal fields stay on the server.
function studentLesson(l:Lesson):Lesson {
  return {id:l.id,courseId:l.courseId,title:l.title,intro:l.intro,body:l.body,youtubeUrl:l.youtubeUrl,createdAt:l.createdAt,status:l.status,authorId:l.authorId,updatedAt:l.updatedAt,sportId:l.sportId,unitTitle:l.unitTitle,unitOrder:l.unitOrder,position:l.position,durationMinutes:l.durationMinutes,takeaways:l.takeaways,application:l.application,practice:l.practice,blocks:l.blocks};
}

export function listSchedules(): Schedule[] {
 return db().prepare("SELECT id,cohort_key AS cohortKey,academic_year AS academicYear,source_label AS sourceLabel,source_url AS sourceUrl,status,entries,notes,day_notes AS dayNotes,updated_at AS updatedAt FROM schedules ORDER BY updated_at DESC").all().map(row=>({...row,entries:JSON.parse(String(row.entries)),dayNotes:JSON.parse(String(row.dayNotes || "{}"))})) as unknown as Schedule[];
}
