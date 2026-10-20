import {adminStudentDetails} from "@/lib/server/admin-students";
import {studentAccount} from "@/lib/server/student-account";
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
import {contentCourseId} from "@/lib/content-courses";
import {contentId,contentIds} from "@/lib/server/shared-content";
import { hasLessonContent } from "@/lib/lesson-blocks";
import { sportsFor } from "@/lib/specializations";
import { academicRequest } from "@/lib/server/academic-http";
import { AcademicError } from "@/lib/server/academic";
import { platformSettings, savePlatformSettings } from "@/lib/server/platform-settings";
import { listCourseUnits, createCourseUnit, updateCourseUnits, attachLessonUnit, UnitError } from "@/lib/server/course-units";
import { revalidatePath } from "next/cache";

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
        need(await createSession(user.id, secureSession(request), {email,passwordHash:String(row.password_hash)}), "بيانات الدخول اتغيرت. حاول تسجيل الدخول من جديد.",401);
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
      else {
        need(hasAdmin(), "يحتاج مالك المنصة إلى إعداد حساب الإدارة أولًا.", 409);
        need(platformSettings().registrationOpen, "تسجيل الحسابات الجديدة متوقف حاليًا. تقدر تدخل بحسابك الحالي.", 403);
      }
      const name = text(data.name, 2, 50, "الاسم");
      need(data.confirmPassword === data.password, "كلمتا المرور غير متطابقتين.");
      const profile = normalizeProfile({ ...DEFAULT_PROFILE, ...(data.profile && typeof data.profile === "object" ? data.profile : {}), name });
      const encoded = await passwordHash(password);
      let choices;
      try { choices = validateChoices(data.specializations,profile); } catch(error) {throw new ApiError((error as Error).message);}
      const id = randomUUID(); const role = path === "auth/setup" ? "admin" : "student";
      transaction(() => {
        if (role === "admin") need(!hasAdmin(), "تم إعداد الإدارة بالفعل.", 409);
        else need(platformSettings().registrationOpen, "تسجيل الحسابات الجديدة متوقف حاليًا.", 403);
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
    if (path === "admin/settings" && request.method === "GET") return json(platformSettings());
    if (path === "admin/settings" && request.method === "PATCH") {
      let settings;
      try { settings = savePlatformSettings(data, user.id); } catch(error) { throw new ApiError((error as Error).message); }
      revalidatePath("/", "layout");
      return json(settings);
    }
    if (path === "admin/account" && request.method === "PATCH") {
      const name = text(data.name, 2, 50, "الاسم");
      transaction(() => {
        db().prepare("UPDATE users SET profile=? WHERE id=?").run(JSON.stringify({...user.profile,name}), user.id);
        audit(user.id, "update_admin_account", user.id);
      });
      return json({name});
    }
    if (path === "admin/password" && request.method === "POST") {
      need(typeof data.currentPassword === "string" && data.currentPassword.length > 0 && data.currentPassword.length <= 128, "اكتب كلمة المرور الحالية.");
      need(typeof data.newPassword === "string" && data.newPassword.length >= 10 && data.newPassword.length <= 128, "كلمة المرور الجديدة تحتاج 10 أحرف على الأقل.");
      need(data.newPassword === data.confirmPassword, "كلمتا المرور غير متطابقتين.");
      need(data.newPassword !== data.currentPassword, "اختار كلمة مرور مختلفة عن الحالية.");
      need(authLimit(`admin/password:${user.id}`), "محاولات كثيرة. حاول بعد 15 دقيقة.", 429);
      const previous = String(db().prepare("SELECT password_hash FROM users WHERE id=?").get(user.id)?.password_hash);
      need(await verifyPassword(data.currentPassword, previous), "كلمة المرور الحالية غير صحيحة.", 401);
      const encoded = await passwordHash(data.newPassword);
      transaction(() => {
        // Reject a competing change rather than overwrite a newer password.
        need(db().prepare("SELECT password_hash FROM users WHERE id=?").get(user.id)?.password_hash === previous, "اتغيّرت كلمة المرور. سجّل الدخول من جديد.", 409);
        db().prepare("UPDATE users SET password_hash=? WHERE id=?").run(encoded,user.id);
        db().prepare("DELETE FROM sessions WHERE user_id=?").run(user.id);
        db().prepare("DELETE FROM auth_attempts WHERE key=?").run(`admin/password:${user.id}`);
        audit(user.id, "change_admin_password", user.id);
      });
      await createSession(user.id, secureSession(request));
      return json({changed:true});
    }
    const academicResponse=academicRequest(path,request.method,data,user);if(academicResponse)return academicResponse;
    if(["student/progress","student/lesson-visit","admin/lessons","admin/lessons/status","admin/lessons/order","admin/units"].includes(path))listCourseUnits();
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
      const id=contentId(db(),'lesson',text(data.lessonId,1,220,"الدرس"));
      const demo=coursesFor(user.profile).find(course=>isDemoCourse(course) && id===`torque-${course.id}`);
      const lesson=demo?null:studentData(user).lessons.find(l=>l.id===id);
      need(demo || lesson,"الدرس غير متاح لمسارك.",404);
      const courseId=demo?.id || lesson!.courseId;
      db().prepare("INSERT INTO lesson_visits VALUES(?,?,?,?) ON CONFLICT(user_id,course_id) DO UPDATE SET lesson_id=excluded.lesson_id,visited_at=excluded.visited_at").run(user.id,courseId,id,new Date().toISOString());
      return json({courseId,lessonId:id});
    }
    if (path === "student/progress" && request.method === "POST") {
      const id = contentId(db(),'lesson',text(data.lessonId, 1, 220, "الدرس"));
      const demo = coursesFor(user.profile).some(course => isDemoCourse(course) && id === `torque-${course.id}`);
      if (demo) need(data.answer === "double", "أجب عن سؤال الدرس لتسجيل إكماله.");
      else need(studentData(user).lessons.some(lesson => lesson.id === id), "الدرس غير متاح لمسارك أو غير منشور.", 404);
      db().prepare("INSERT OR IGNORE INTO progress VALUES(?,?,?)").run(user.id, id, new Date().toISOString());
      return json({ completed: true });
    }
    if (path === "admin/state" && request.method === "GET") return json(adminData());
    if(path === "admin/units" && ["POST","PATCH"].includes(request.method)){
      const courseId=contentCourseId(text(data.courseId,1,200,"المقرر"));need(catalog.some(c=>c.id===courseId),"المقرر غير موجود.");
      try{return request.method==="POST"?json({unit:createCourseUnit(courseId,data.title,user.id)},{status:201}):json({units:updateCourseUnits(data,user.id)});}catch(error){if(error instanceof UnitError)throw new ApiError(error.message,error.status);throw error;}
    }
    if(path === "admin/schedules" && request.method === "POST") {
      try { return json({schedule:saveSchedule(data,user.id)}); }
      catch(error) {throw new ApiError((error as Error).message);}
    }
    if(path === "admin/lessons/order" && request.method === "PATCH") {
      const courseId=contentCourseId(text(data.courseId,1,200,"المقرر"));const unitId=contentId(db(),'unit',text(data.unitId,0,100,"الوحدة"));
      need(Array.isArray(data.lessons)&&data.lessons.length>0&&data.lessons.length<=1000,"راجع قائمة الدروس.");
      const targets=data.lessons as {id:string;updatedAt:string}[];
      transaction(()=>{
        const current=listLessons().filter(l=>l.courseId===courseId&&(l.unitId||'')===unitId);
        need(current.length===targets.length&&new Set(targets.map(t=>t?.id)).size===targets.length,"أرسل كل دروس الوحدة بدون تكرار.");
        for(const target of targets){const lesson=current.find(l=>l.id===target?.id);need(lesson,"الدرس لا يتبع الوحدة.",404);need(lesson.updatedAt===target.updatedAt,"الدروس اتعدّلت في جلسة أخرى. حدّث القائمة.",409);}
        const now=new Date().toISOString();targets.forEach((target,i)=>db().prepare("UPDATE lessons SET structure=json_set(structure,'$.position',?),updated_at=? WHERE id=?").run(i+1,now,target.id));audit(user.id,'reorder_lessons',courseId);
      });return json({reordered:true});
    }
    if(path === "admin/lessons/status" && request.method === "PATCH") {
      need(data.status==="draft"||data.status==="published","اختر حالة النشر.");
      need(Array.isArray(data.lessons)&&data.lessons.length>=1&&data.lessons.length<=200,"حدد من درس واحد إلى ٢٠٠ درس.");
      const targets=data.lessons.map((raw:unknown)=>{need(raw&&typeof raw==="object"&&!Array.isArray(raw),"اختيار درس غير صالح.");const item=raw as Record<string,unknown>;return {id:contentId(db(),'lesson',text(item.id,1,100,"معرّف الدرس")),updatedAt:text(item.updatedAt,1,100,"تاريخ آخر تعديل")};});
      need(new Set(targets.map(t=>t.id)).size===targets.length,"اختيارات الدروس متكررة.");
      let changed=0;
      transaction(()=>{
        const rows=targets.map(target=>{const row=db().prepare("SELECT id,status,updated_at FROM lessons WHERE id=?").get(target.id);need(row,"أحد الدروس لم يعد موجودًا. حدّث القائمة.",404);need(row.updated_at===target.updatedAt,"أحد الدروس اتعدّل بعد فتح القائمة. حدّث الصفحة وراجع التعديل قبل تغيير النشر.",409);return row;});
        const now=new Date().toISOString();
        for(const row of rows)if(row.status!==data.status){db().prepare("UPDATE lessons SET status=?,updated_at=? WHERE id=?").run(data.status as string,now,String(row.id));audit(user.id,"update_lesson",String(row.id));changed++;}
      });
      return json({changed});
    }
    if (path === "admin/lessons" && request.method === "POST") {
      const id = data.id ? contentId(db(),'lesson',text(data.id, 1, 100, "الدرس")) : randomUUID();
      const courseId = contentCourseId(text(data.courseId, 1, 200, "المقرر"));
      need(catalog.some(course => course.id === courseId), "المقرر غير موجود.");
      const title = text(data.title, 2, 120, "العنوان"); const intro = text(data.intro, 2, 300, "المقدمة");
      const body = text(data.body, 0, 25000, "الشرح"); const video = typeof data.youtubeUrl === "string" ? data.youtubeUrl.trim() : "";
      const sportId=typeof data.sportId==="string" ? data.sportId : "";
      need(!sportId || sportsFor(catalog.find(c=>c.id===courseId)!).some(s=>s.id===sportId),"اختار رياضة متاحة لهذا المقرر.");
      need(video.length <= 2048 && (!video || youtubeId(video)), "رابط YouTube غير صالح.");
      need(data.status === "draft" || data.status === "published", "اختر حالة الدرس.");
      const existing = db().prepare("SELECT id FROM lessons WHERE id=?").get(id);
      need(!data.id || existing, "الدرس غير موجود.", 404);
      const details=lessonDetails(data,existing?listLessons().find(l=>l.id===id):undefined);
      need(body.length>=2 || hasLessonContent(details.blocks),"أضف شرحًا أو وحدة تفاعلية مكتملة للدرس.");
      const now = new Date().toISOString();
      transaction(() => {
        if(existing&&data.expectedUpdatedAt!==undefined){const current=db().prepare("SELECT updated_at FROM lessons WHERE id=?").get(id);need(current?.updated_at===data.expectedUpdatedAt,"الدرس اتعدّل في جلسة أخرى. احتفظ بنصك وراجع أحدث نسخة قبل الحفظ.",409);}
        if (existing) db().prepare("UPDATE lessons SET course_id=?,title=?,intro=?,body=?,youtube_url=?,status=?,updated_at=?,sport_id=? WHERE id=?").run(courseId, title, intro, body, video, data.status as string, now, sportId, id);
        else db().prepare("INSERT INTO lessons(id,course_id,title,intro,body,youtube_url,status,author_id,created_at,updated_at,sport_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(id, courseId, title, intro, body, video, data.status as string, user.id, now, now,sportId);
        try{attachLessonUnit(id,courseId,data.unitId,details,user.id);}catch(error){if(error instanceof UnitError)throw new ApiError(error.message,error.status);throw error;}
        db().prepare("UPDATE lessons SET structure=? WHERE id=?").run(JSON.stringify(details),id);
        audit(user.id, existing ? "update_lesson" : "create_lesson", id);
      });
      return json({ lesson: listLessons().find(lesson => lesson.id === id) }, { status: existing ? 200 : 201 });
    }
    if (path === "admin/lessons" && request.method === "DELETE") {
      const id = contentId(db(),'lesson',text(data.id, 1, 100, "الدرس"));
      need(db().prepare("SELECT 1 FROM lessons WHERE id=?").get(id), "الدرس غير موجود.", 404);
      transaction(() => {
        for(const target of contentIds(db(),'lesson',id)){db().prepare("DELETE FROM progress WHERE lesson_id=?").run(target);db().prepare("DELETE FROM lesson_visits WHERE lesson_id=?").run(target);db().prepare("DELETE FROM lessons WHERE id=?").run(target);}
        db().prepare("DELETE FROM content_aliases WHERE entity='lesson' AND canonical_id=?").run(id);audit(user.id, "delete_lesson", id);
      }); return json({ deleted: true });
    }
    const accountMatch=/^admin\/users\/([^/]+)(?:\/(profile|password|sessions))?$/.exec(path);
    if(accountMatch&&((!accountMatch[2]&&request.method==='DELETE')||(accountMatch[2]==='profile'&&request.method==='PATCH')||(['password','sessions'].includes(accountMatch[2])&&request.method==='POST')))return json(await studentAccount(user,text(accountMatch[1],1,100,'الحساب'),accountMatch[2]||'delete',data));
    if (/^admin\/users\/[^/]+$/.test(path) && request.method === "GET") return json(adminStudentDetails(text(path.slice("admin/users/".length),1,100,"الحساب")));
    if (path === "admin/users" && request.method === "PATCH") {
      const id = text(data.id, 1, 100, "الحساب"); need(typeof data.active === "boolean", "حالة الحساب غير صالحة.");
      need(db().prepare("SELECT 1 FROM users WHERE id=? AND role='student'").get(id), "يمكن تعديل حالة حسابات الطلاب فقط.", 403);
      transaction(() => {
        if(data.expectedActive!==undefined){need(typeof data.expectedActive==='boolean',"راجع حالة الحساب السابقة.");const current=db().prepare("SELECT active FROM users WHERE id=? AND role='student'").get(id);need(!!current?.active===data.expectedActive,"حالة الحساب اتغيرت في نافذة أخرى. حدّث القائمة وراجع الحالة قبل التأكيد.",409);}
        db().prepare("UPDATE users SET active=? WHERE id=?").run(Number(data.active), id);
        if (!data.active) db().prepare("DELETE FROM sessions WHERE user_id=?").run(id);
        audit(user.id, data.active ? "activate_student" : "suspend_student", id);
      }); return json({ updated: true, user:publicUser(db().prepare("SELECT id,email,role,profile,active,created_at FROM users WHERE id=?").get(id) as unknown as Parameters<typeof publicUser>[0]) });
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
