import { createHash, timingSafeEqual, randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { sameOrigin, secureSession } from "@/lib/request-origin";
import { catalog } from "@/lib/catalog";
import { DEFAULT_PROFILE, coursesFor, isDemoCourse, normalizeProfile, youtubeId } from "@/lib/curriculum";
import { homeFor } from "@/lib/domain";
import { authLimit, createSession, currentUser, endSession, passwordHash, publicUser, verifyPassword } from "@/lib/server/auth";
import { audit, db, hasAdmin, transaction } from "@/lib/server/db";
import { adminData, listLessons, studentData } from "@/lib/server/repository";
import { saveChoices, validateChoices } from "@/lib/server/specializations";
import { saveSchedule } from "@/lib/server/schedules";
import { lessonDetails } from "@/lib/server/lesson-details";
import { sportsFor } from "@/lib/specializations";
import { academicRequest } from "@/lib/server/academic-http";
import { AcademicError } from "@/lib/server/academic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function json(body: unknown, init?: {status:number}) { return Response.json(body,{...init,headers:{"Cache-Control":"no-store"}}); }
class ApiError extends Error { constructor(message: string, public status = 400) { super(message); } }
function need(condition: unknown, message: string, status = 400): asserts condition { if (!condition) throw new ApiError(message, status); }
function text(value: unknown, min: number, max: number, label: string) {
  need(typeof value === "string" && value.trim().length >= min && value.length <= max, `راجع ${label}.`);
  return value.trim();
}
async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const path = (await context.params).path.join("/");
    const mutation = request.method !== "GET";
    let data: Record<string, unknown> = {};
    if (mutation) {
      // Reject cross-origin writes even when a caller manually supplies a session cookie.
      need(sameOrigin(request), "مصدر الطلب غير مسموح.", 403);
      need(request.headers.get("content-type")?.startsWith("application/json"), "استخدم طلب JSON.", 415);
      const raw = await request.text(); need(raw.length <= 64000, "حجم الطلب أكبر من المسموح.", 413);
      try { data = JSON.parse(raw); } catch { throw new ApiError("الطلب غير صالح."); }
      need(data && typeof data === "object" && !Array.isArray(data), "الطلب غير صالح.");
    }
    if (path === "auth/logout" && request.method === "POST") { await endSession(); return json({ redirect: "/" }); }
    if (["auth/login", "auth/register", "auth/setup"].includes(path) && request.method === "POST") {
      const email = text(data.email, 5, 254, "البريد الإلكتروني").toLowerCase();
      need(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), "اكتب بريدًا إلكترونيًا صحيحًا.");
      need(typeof data.password === "string" && data.password.length >= (path === "auth/login" ? 1 : 10) && data.password.length <= 128, "كلمة المرور تحتاج 10 أحرف على الأقل.");
      const password = data.password;
      need(authLimit(`${path}:${email}`), "محاولات كثيرة. حاول بعد 15 دقيقة.", 429);
      if (path === "auth/login") {
        const row = db().prepare("SELECT * FROM users WHERE email=?").get(email);
        const dummy = `scrypt:${"0".repeat(32)}:${"0".repeat(128)}`;
        const valid = await verifyPassword(password, String(row?.password_hash || dummy));
        need(row && valid && row.active === 1, "البريد أو كلمة المرور غير صحيحة، أو الحساب موقوف.", 401);
        const user = publicUser(row as unknown as Parameters<typeof publicUser>[0]);
        db().prepare("DELETE FROM auth_attempts WHERE key=?").run(`${path}:${email}`);
        await createSession(user.id, secureSession(request));
        return json({ redirect: homeFor(user.role) });
      }
      if (path === "auth/setup") {
        need(!hasAdmin(), "تم إعداد الإدارة بالفعل.", 409);
        const setupToken=process.env.HARKA_SETUP_TOKEN;
        need(process.env.NODE_ENV!=="production" || setupToken && setupToken.length>=32,"اضبط رمز إعداد الإدارة في إعدادات الخادم أولًا.",503);
        if(setupToken){
          const supplied=typeof data.setupToken==="string" && data.setupToken.length<=256?data.setupToken:"";
          const digest=(value:string)=>createHash("sha256").update(value).digest();
          need(timingSafeEqual(digest(supplied),digest(setupToken)),"رمز إعداد الإدارة غير صحيح.",403);
        }
      }
      else need(hasAdmin(), "يحتاج مالك المنصة إلى إعداد حساب الإدارة أولًا.", 409);
      const name = text(data.name, 2, 50, "الاسم");
      need(data.confirmPassword === data.password, "كلمتا المرور غير متطابقتين.");
      const profile = normalizeProfile({ ...DEFAULT_PROFILE, ...(data.profile && typeof data.profile === "object" ? data.profile : {}), name });
      const encoded = await passwordHash(password);
      let choices;
      try { choices = validateChoices(data.specializations,profile); } catch(error) {throw new ApiError((error as Error).message);}
      const id = randomUUID(); const role = path === "auth/setup" ? "admin" : "student";
      transaction(() => {
        if (role === "admin") need(!hasAdmin(), "تم إعداد الإدارة بالفعل.", 409);
        need(!db().prepare("SELECT 1 FROM users WHERE email=?").get(email), "يوجد حساب بهذا البريد. جرّب تسجيل الدخول.", 409);
        db().prepare("INSERT INTO users(id,email,password_hash,role,profile,created_at) VALUES(?,?,?,?,?,?)").run(id, email, encoded, role, JSON.stringify(profile), new Date().toISOString());
        if(role==="student") saveChoices(id,choices);
        audit(id, role === "admin" ? "setup_admin" : "register_student", id);
      });
      await createSession(id, secureSession(request));
      return json({ redirect: homeFor(role) }, { status: 201 });
    }

    const user = await currentUser(); need(user, "سجّل الدخول للمتابعة.", 401);
    if (path.startsWith("admin/")) need(user.role === "admin", "هذه المساحة متاحة للإدارة فقط.", 403);
    else need(user.role === "student", "هذا الإجراء خاص بحساب الطالب.", 403);
    const academicResponse=academicRequest(path,request.method,data,user);if(academicResponse)return academicResponse;
    if (path === "student/state" && request.method === "GET") return json(studentData(user));
    if (path === "student/profile" && request.method === "PATCH") {
      const name = text(data.name, 2, 50, "الاسم");
      const profile = normalizeProfile({ ...data, name });
      let choices;
      try {choices=validateChoices(data.specializations,profile);} catch(error) {throw new ApiError((error as Error).message);}
      transaction(()=>{db().prepare("UPDATE users SET profile=? WHERE id=?").run(JSON.stringify(profile), user.id);saveChoices(user.id,choices);});
      return json(studentData({...user,profile}));
    }
    if(path === "student/specializations" && request.method === "PATCH") {
      const courseId=text(data.courseId,1,200,"المقرر");
      let choices;
      try {choices=validateChoices({[courseId]:data.sportId},user.profile);} catch(error) {throw new ApiError((error as Error).message);}
      saveChoices(user.id,choices);return json(studentData(user));
    }
    if (path === "student/bookmarks" && request.method === "POST") {
      const courseId = text(data.courseId, 1, 200, "المقرر");
      need(catalog.some(course => course.id === courseId), "المقرر غير موجود.", 404);
      need(typeof data.saved === "boolean", "اختر حالة الحفظ.");
      if (data.saved) db().prepare("INSERT OR IGNORE INTO bookmarks VALUES(?,?)").run(user.id, courseId);
      else db().prepare("DELETE FROM bookmarks WHERE user_id=? AND course_id=?").run(user.id, courseId);
      return json({ saved: data.saved });
    }
    if(path === "student/lesson-visit" && request.method === "POST") {
      const id=text(data.lessonId,1,220,"الدرس");
      const demo=coursesFor(user.profile).find(course=>isDemoCourse(course) && id===`torque-${course.id}`);
      const lesson=demo?null:studentData(user).lessons.find(l=>l.id===id);
      need(demo || lesson,"الدرس غير متاح لمسارك.",404);
      const courseId=demo?.id || lesson!.courseId;
      db().prepare("INSERT INTO lesson_visits VALUES(?,?,?,?) ON CONFLICT(user_id,course_id) DO UPDATE SET lesson_id=excluded.lesson_id,visited_at=excluded.visited_at").run(user.id,courseId,id,new Date().toISOString());
      return json({courseId,lessonId:id});
    }
    if (path === "student/progress" && request.method === "POST") {
      const id = text(data.lessonId, 1, 220, "الدرس");
      const demo = coursesFor(user.profile).some(course => isDemoCourse(course) && id === `torque-${course.id}`);
      if (demo) need(data.answer === "double", "أجب عن سؤال الدرس لتسجيل إكماله.");
      else need(studentData(user).lessons.some(lesson => lesson.id === id), "الدرس غير متاح لمسارك أو غير منشور.", 404);
      db().prepare("INSERT OR IGNORE INTO progress VALUES(?,?,?)").run(user.id, id, new Date().toISOString());
      return json({ completed: true });
    }
    if (path === "admin/state" && request.method === "GET") return json(adminData());
    if(path === "admin/schedules" && request.method === "POST") {
      try { return json({schedule:saveSchedule(data,user.id)}); }
      catch(error) {throw new ApiError((error as Error).message);}
    }
    if (path === "admin/lessons" && request.method === "POST") {
      const id = data.id ? text(data.id, 1, 100, "الدرس") : randomUUID();
      const courseId = text(data.courseId, 1, 200, "المقرر");
      need(catalog.some(course => course.id === courseId), "المقرر غير موجود.");
      const title = text(data.title, 2, 120, "العنوان"); const intro = text(data.intro, 2, 300, "المقدمة");
      const body = text(data.body, 2, 25000, "الشرح"); const video = typeof data.youtubeUrl === "string" ? data.youtubeUrl.trim() : "";
      const sportId=typeof data.sportId==="string" ? data.sportId : "";
      need(!sportId || sportsFor(catalog.find(c=>c.id===courseId)!).some(s=>s.id===sportId),"اختار رياضة متاحة لهذا المقرر.");
      need(video.length <= 2048 && (!video || youtubeId(video)), "رابط YouTube غير صالح.");
      need(data.status === "draft" || data.status === "published", "اختر حالة الدرس.");
      const existing = db().prepare("SELECT id FROM lessons WHERE id=?").get(id);
      need(!data.id || existing, "الدرس غير موجود.", 404);
      const details=lessonDetails(data,existing?listLessons().find(l=>l.id===id):undefined);
      const now = new Date().toISOString();
      transaction(() => {
        if (existing) db().prepare("UPDATE lessons SET course_id=?,title=?,intro=?,body=?,youtube_url=?,status=?,updated_at=?,sport_id=? WHERE id=?").run(courseId, title, intro, body, video, data.status as string, now, sportId, id);
        else db().prepare("INSERT INTO lessons(id,course_id,title,intro,body,youtube_url,status,author_id,created_at,updated_at,sport_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(id, courseId, title, intro, body, video, data.status as string, user.id, now, now,sportId);
        db().prepare("UPDATE lessons SET structure=? WHERE id=?").run(JSON.stringify(details),id);
        audit(user.id, existing ? "update_lesson" : "create_lesson", id);
      });
      return json({ lesson: listLessons().find(lesson => lesson.id === id) }, { status: existing ? 200 : 201 });
    }
    if (path === "admin/lessons" && request.method === "DELETE") {
      const id = text(data.id, 1, 100, "الدرس");
      need(db().prepare("SELECT 1 FROM lessons WHERE id=?").get(id), "الدرس غير موجود.", 404);
      transaction(() => {
        db().prepare("DELETE FROM progress WHERE lesson_id=?").run(id);
        db().prepare("DELETE FROM lesson_visits WHERE lesson_id=?").run(id);
        db().prepare("DELETE FROM lessons WHERE id=?").run(id); audit(user.id, "delete_lesson", id);
      }); return json({ deleted: true });
    }
    if (path === "admin/users" && request.method === "PATCH") {
      const id = text(data.id, 1, 100, "الحساب"); need(typeof data.active === "boolean", "حالة الحساب غير صالحة.");
      need(db().prepare("SELECT 1 FROM users WHERE id=? AND role='student'").get(id), "يمكن تعديل حالة حسابات الطلاب فقط.", 403);
      transaction(() => {
        db().prepare("UPDATE users SET active=? WHERE id=?").run(Number(data.active), id);
        if (!data.active) db().prepare("DELETE FROM sessions WHERE user_id=?").run(id);
        audit(user.id, data.active ? "activate_student" : "suspend_student", id);
      }); return json({ updated: true });
    }
    throw new ApiError("المسار أو طريقة الطلب غير متاحة.", 404);
  } catch (error) {
    if (error instanceof ApiError || error instanceof AcademicError) return json({ error: error.message }, { status: error.status });
    console.error("Harka API failure", error instanceof Error ? error.message : "unknown");
    return json({ error: "تعذر حفظ العملية. حاول مرة أخرى." }, { status: 500 });
  }
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
