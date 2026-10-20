import 'server-only';
import {db} from './db';
import type {AdminOverviewSnapshot,OverviewCourse} from '../admin-overview';

export function adminOverview():AdminOverviewSnapshot{
 const database=db();const nextDraft=database.prepare("SELECT id,course_id AS courseId,title FROM academy_lessons WHERE status='draft' ORDER BY updated_at DESC,id LIMIT 1").get();const count=(sql:string)=>Number(database.prepare(sql).get()!.n);
 return {generatedAt:new Date().toISOString(),academicCompletions:count(`SELECT COUNT(*) AS n FROM (SELECT p.user_id,COALESCE(a.canonical_id,p.lesson_id) FROM progress p JOIN users u ON u.id=p.user_id LEFT JOIN content_aliases a ON a.entity='lesson' AND a.alias_id=p.lesson_id WHERE u.role='student' GROUP BY p.user_id,COALESCE(a.canonical_id,p.lesson_id))`),academy:{
  courses:count('SELECT COUNT(*) AS n FROM academy_courses'),published:count("SELECT COUNT(*) AS n FROM academy_courses WHERE status='published'"),drafts:count("SELECT COUNT(*) AS n FROM academy_courses WHERE status='draft'"),lessons:count('SELECT COUNT(*) AS n FROM academy_lessons'),publishedLessons:count("SELECT COUNT(*) AS n FROM academy_lessons l JOIN academy_courses c ON c.id=l.course_id WHERE l.status='published' AND c.status='published'"),draftLessons:count("SELECT COUNT(*) AS n FROM academy_lessons WHERE status='draft'"),enrollments:count('SELECT COUNT(*) AS n FROM academy_enrollments'),completions:count("SELECT COUNT(*) AS n FROM academy_progress p JOIN users u ON u.id=p.user_id WHERE p.completed_at IS NOT NULL AND u.role='student'"),
  recent:database.prepare(`SELECT c.id,c.title,c.status,c.updated_at AS updatedAt,(SELECT COUNT(*) FROM academy_lessons l WHERE l.course_id=c.id) AS lessons,(SELECT COUNT(*) FROM academy_lessons l WHERE l.course_id=c.id AND l.status='published') AS publishedLessons,(SELECT COUNT(*) FROM academy_enrollments e WHERE e.course_id=c.id) AS enrollments FROM academy_courses c ORDER BY c.updated_at DESC,c.id LIMIT 3`).all().map(row=>({...row})) as OverviewCourse[],
  nextDraft:nextDraft?{id:String(nextDraft.id),courseId:String(nextDraft.courseId),title:String(nextDraft.title)}:null
 }};
}
