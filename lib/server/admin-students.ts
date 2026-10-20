import 'server-only';
import {db} from './db';
import {AcademicError} from './academic';
import {publicUser} from './auth';
import {specializationSlots,sportsFor} from '../specializations';
import {userChoices} from './specializations';
import type {StudentDetails} from '../admin-students';
export function adminStudentDetails(id:string):StudentDetails{
 const database=db();const row=database.prepare("SELECT id,email,role,profile,active,created_at FROM users WHERE id=? AND role='student'").get(id);if(!row)throw new AcademicError('حساب الطالب غير موجود.',404);
 const user=publicUser(row as unknown as Parameters<typeof publicUser>[0]);const choices=userChoices(id);const count=(sql:string)=>Number(database.prepare(sql).get(id)!.n);
 const last=database.prepare(`SELECT MAX(at) AS at FROM (SELECT completed_at AS at FROM progress WHERE user_id=? UNION ALL SELECT updated_at FROM academy_progress WHERE user_id=? UNION ALL SELECT submitted_at FROM submissions WHERE user_id=? UNION ALL SELECT started_at FROM exam_attempts WHERE user_id=? UNION ALL SELECT visited_at FROM lesson_visits WHERE user_id=?)`).get(id,id,id,id,id)!.at;
 return {academicCompleted:count("SELECT COUNT(*) AS n FROM (SELECT COALESCE(a.canonical_id,p.lesson_id) FROM progress p LEFT JOIN content_aliases a ON a.entity='lesson' AND a.alias_id=p.lesson_id WHERE p.user_id=? GROUP BY COALESCE(a.canonical_id,p.lesson_id))"),academyCompleted:count('SELECT COUNT(*) AS n FROM academy_progress WHERE user_id=? AND completed_at IS NOT NULL'),enrollments:count('SELECT COUNT(*) AS n FROM academy_enrollments WHERE user_id=?'),submissions:count('SELECT COUNT(*) AS n FROM submissions WHERE user_id=?'),examAttempts:count('SELECT COUNT(*) AS n FROM exam_attempts WHERE user_id=?'),lastLearningAt:last?String(last):null,
 specializations:specializationSlots(user.profile).flatMap(course=>{const sport=sportsFor(course).find(s=>s.id===choices[course.id]);return sport?[{courseTitle:course.title,sportTitle:sport.title}]:[];}),
 courses:database.prepare(`SELECT c.id,c.title,c.status,(SELECT COUNT(*) FROM academy_lessons l WHERE l.course_id=c.id AND l.status='published') AS total,(SELECT COUNT(*) FROM academy_progress p JOIN academy_lessons l ON l.id=p.lesson_id WHERE p.course_id=c.id AND p.user_id=e.user_id AND p.completed_at IS NOT NULL AND l.status='published') AS completed FROM academy_enrollments e JOIN academy_courses c ON c.id=e.course_id WHERE e.user_id=? ORDER BY e.enrolled_at DESC,c.id LIMIT 5`).all(id).map(c=>({...c})) as StudentDetails['courses']};
}
