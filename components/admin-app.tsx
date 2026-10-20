"use client";
import BrandLogo from "./brand-logo";
import AcademyAdmin from "./academy-admin";
import AcademyStudent from "./academy-student";
import type {AcademyData} from "@/lib/academy";
import LessonBlocks from "./lesson-blocks";
import AdminLearningPanel from "./admin-learning";
import type { AdminLearning } from "@/lib/academic-domain";
import AdminSchedule from "./admin-schedule";
import AdminSettings from "./admin-settings";
import AdminContentWorkspace from "./admin-content-workspace";
import LessonCopy from "./lesson-copy";
import type { TrainingPlan } from "@/lib/training-plan";
import type { PlatformSettings } from "@/lib/platform-settings";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LibraryBig, ListTodo, ClipboardCheck, CalendarDays, ArrowLeft, BookOpen, Check, FileText, GraduationCap, Home, LogOut, Menu, Pencil, Play, Search, Settings2, ShieldCheck, Users, X } from "lucide-react";
import { api } from "@/lib/client-api";
import { profileLabel, youtubeId } from "@/lib/curriculum";
import { type CourseUnit, type Lesson, type Schedule, type User } from "@/lib/domain";

export type AdminData = { units:CourseUnit[]; trainingPlan:TrainingPlan; settings:PlatformSettings; learning:AdminLearning; schedules:Schedule[]; users: User[]; lessons: Lesson[]; completions: number; audit: {action: string; entityId: string; createdAt: string; name: string}[] };
export type AdminView = "academy" | "overview" | "content" | "users" | "settings" | "schedule" | "library" | "assignments" | "exams";
const NAV = [{view:"overview",href:"/admin",title:"نظرة عامة",icon:Home},{view:"content",href:"/admin/content",title:"المحتوى والدروس",icon:BookOpen},{view:"academy",href:"/admin/academy",title:"الكورسات",icon:Play},{view:"library",href:"/admin/library",title:"المكتبة",icon:LibraryBig},{view:"assignments",href:"/admin/assignments",title:"التكليفات والتسليمات",icon:ListTodo},{view:"exams",href:"/admin/exams",title:"الاختبارات والنتائج",icon:ClipboardCheck},{view:"schedule",href:"/admin/schedule",title:"جداول المحاضرات",icon:CalendarDays},{view:"users",href:"/admin/users",title:"الطلاب",icon:Users},{view:"settings",href:"/admin/settings",title:"الإعدادات",icon:Settings2}] as const;
const ACTIONS: Record<string,string> = {create_academy:"إنشاء كورس",update_academy:"تحديث كورس أو منهجه",save_academy_lesson:"حفظ درس كورس",delete_academy:"حذف مسودة كورس",update_settings:"تحديث إعدادات المنصة",update_admin_account:"تحديث حساب الإدارة",change_admin_password:"تغيير كلمة مرور الإدارة",save_library:"نشر أو تعديل مورد",delete_library:"حذف مورد",save_assignments:"حفظ تكليف",delete_assignments:"حذف تكليف",review_submission:"مراجعة تسليم",save_exams:"حفظ اختبار",delete_exams:"حذف اختبار",save_schedule:"حفظ جدول محاضرات",import_user_schedule:"إضافة جدول مقدّم من مالك المنصة",setup_admin:"إعداد حساب الإدارة",register_student:"تسجيل طالب",create_lesson:"إضافة درس",update_lesson:"تعديل درس",delete_lesson:"حذف درس",activate_student:"تفعيل طالب",suspend_student:"إيقاف طالب"};

export default function AdminApp({ initialData, user, view, contentCourseId, academyData }: { initialData: AdminData; user: User; view: AdminView;contentCourseId?:string;academyData?:AcademyData }) {
  const router = useRouter(); const [data,setData] = useState(initialData);
  const [mobile,setMobile] = useState(false); const [notice,setNotice] = useState("");
  const [preview,setPreview] = useState<Lesson|null>(null); const [query,setQuery] = useState("");
  const [busy,setBusy] = useState(false);
  useEffect(()=>setData(initialData),[initialData]);
  const students = data.users.filter(u=>u.role==="student");
  async function reload() { setData(await api<AdminData>("admin/state",undefined,"GET")); router.refresh(); }
  async function changeUser(student: User) {
    setBusy(true); setNotice("");
    try { await api("admin/users",{id:student.id,active:!student.active},"PATCH"); await reload(); setNotice(student.active ? "اتوقف الحساب وانتهت جلساته المفتوحة." : "الحساب اتفعّل."); }
    catch(error) {setNotice(error instanceof Error ? error.message : "تعذر تعديل الحساب.");} finally {setBusy(false);}
  }
  async function deleteLesson(lesson: Lesson) {
    if(!window.confirm(`حذف «${lesson.title}» نهائيًا؟ سيُحذف تقدّم الطلاب المرتبط بهذا الدرس أيضًا.`)) return;
    setBusy(true); setNotice("");
    try { await api("admin/lessons",{id:lesson.id},"DELETE"); await reload(); setNotice("اتحذف الدرس."); }
    catch(error) {setNotice(error instanceof Error ? error.message : "تعذر حذف الدرس.");} finally {setBusy(false);}
  }
  async function logout() { try {await api("auth/logout",{});window.location.assign("/");} catch {setNotice("تعذر تسجيل الخروج.");} }

  const filteredStudents = students.filter(x=>`${x.email} ${x.profile.name}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="harka-shell admin-shell">{mobile && <button className="sidebar-scrim" aria-label="إغلاق القائمة" onClick={()=>setMobile(false)}/>}
    <aside className={`sidebar${mobile ? " expanded" : ""}`}><Link className="brand" href="/admin"><BrandLogo inverse/></Link><div className="sidebar-caption">إدارة المنصة</div><nav className="side-nav" aria-label="تنقل الإدارة">{NAV.map(item=><button key={item.view} className={view===item.view ? "active" : ""} onClick={()=>router.push(item.href)} aria-current={view===item.view ? "page" : undefined}><item.icon size={20}/>{item.title}{view===item.view && <span className="nav-dot"/>}</button>)}</nav><div className="sidebar-bottom"><button onClick={()=>window.location.assign("/")}><Home size={18}/>الصفحة العامة</button><button onClick={logout}><LogOut size={18}/>تسجيل الخروج</button><div className="sidebar-profile"><span className="avatar"><ShieldCheck size={20}/></span><span><strong>{user.profile.name}</strong><small>إدارة · صلاحية محفوظة على الخادم</small></span></div></div></aside>
    <div className="app-area"><header className="topbar"><div className="topbar-start"><button className="icon-button mobile-menu" aria-label="فتح قائمة الإدارة" onClick={()=>setMobile(true)}><Menu/></button><div className="breadcrumb"><span>الإدارة</span><ArrowLeft size={13}/><strong>{NAV.find(x=>x.view===view)?.title}</strong></div></div><span className="tag lilac"><ShieldCheck size={14}/>مساحة الإدارة</span></header><main className="page-content">
      {view!=="content"&&view!=="academy"&&<div className="admin-heading"><div className="page-heading"><p className="eyebrow">المكان اللي الفكرة بتكبر فيه</p><h1>{view==="overview" ? `أهلًا ${user.profile.name.split(" ")[0]}، خلّينا نبني.` : view==="users" ? "الناس ورا كل خطوة." : view==="schedule" ? "كل محاضرة، في مكانها." : view==="library" ? "مكتبة بتكبر مع الفهم." : view==="assignments" ? "من المطلوب، للتسليم." : view==="exams" ? "سؤال يختبر الفهم." : "خلّيها على مقاس منصتك."}</h1><p className="muted">{view==="overview" ? "طلابك، المحتوى المنشور، وخطوات التعلّم. الأرقام دي من بيانات المنصة الفعلية." : view==="users" ? "ابحث عن طالب، راجع مساره، وفعّل أو أوقف حسابه." : view==="schedule" ? "جهّز الجدول لكل مسار، وراجعه قبل نشره للطلاب." : view==="library" ? "أضف الكتب والملخصات والمراجع، وانشرها حسب المسار والتخصص." : view==="assignments" ? "حدّد المطلوب والموعد، وتابع التسليمات والملاحظات والدرجات." : view==="exams" ? "جهّز الأسئلة والوقت والمحاولات، وتابع النتائج الفعلية." : "تحكّم في التسجيل والتواصل، وراجع إعدادات حسابك وأمانه."}</p></div></div>}
      {notice && <div className="admin-notice" role="status"><Check size={18}/><span>{notice}</span><button className="icon-button" aria-label="إغلاق التنبيه" onClick={()=>setNotice("")}><X size={17}/></button></div>}
      {view==="overview" && <><section className="admin-stats">{[{label:"حساب طالب",value:students.length,icon:Users,color:"lilac"},{label:"درس منشور",value:data.lessons.filter(x=>x.status==="published").length,icon:BookOpen,color:"lime"},{label:"مسودة للمراجعة",value:data.lessons.filter(x=>x.status==="draft").length,icon:FileText,color:"peach"},{label:"درس أكمله الطلاب",value:data.completions,icon:GraduationCap,color:"blue"}].map(x=><article key={x.label}><span className={`mini-icon ${x.color}`}><x.icon size={22}/></span><strong>{x.value}</strong><p>{x.label}</p></article>)}</section><section className="admin-overview-grid"><div className="editor-panel"><p className="eyebrow">خطوتك الجاية</p><h2>حاجة تستاهل تتفهم.</h2><p className="muted">اختار مقررًا من الفهرس، واكتب له درسًا يبدأ بموقف أو سؤال. احفظه مسودة لحد ما تكون راضي عن الشرح.</p><Link className="button dark-button" href="/admin/content"><Pencil size={16}/>افتح مساحة المحتوى</Link><div className="local-banner"><ShieldCheck size={22}/><p>المسودات للإدارة فقط. الطالب يشوف المحتوى المنشور، وكل حساب له بيانات تعلّم مستقلة.</p></div></div><div className="editor-panel"><div className="section-heading"><h2>آخر نشاط</h2><span className="tag">سجل المنصة</span></div><div className="audit-list">{data.audit.map((item,i)=><div key={`${item.createdAt}-${i}`}><span className="audit-dot"/><div><strong>{ACTIONS[item.action] || item.action}</strong><small>{item.name || "حساب سابق"} · {new Date(item.createdAt).toLocaleString("ar-EG",{timeZone:"Africa/Cairo"})}</small></div></div>)}</div></div></section></>}
      {view==="academy" && academyData && ((academyData.lessonId||academyData.preview)?<AcademyStudent data={academyData}/>:<AcademyAdmin initial={academyData}/>)}
      {view==="content" && <AdminContentWorkspace initialCourseId={contentCourseId} units={data.units} lessons={data.lessons} onNew={(courseId,unitId)=>router.push(`/admin/content/new?${new URLSearchParams({courseId,unitId})}`)} onEdit={lesson=>router.push(`/admin/content/${encodeURIComponent(lesson.id)}/edit`)} onPreview={setPreview} onDelete={deleteLesson} onReload={reload} onNotice={setNotice} externalBusy={busy}/>}

      {view==="users" && <><section className="filter-panel"><label className="search-field"><Search size={18}/><input aria-label="البحث عن طالب" value={query} onChange={e=>setQuery(e.target.value)} placeholder="اسم الطالب أو البريد الإلكتروني…"/></label></section><div className="catalog-heading"><span>{filteredStudents.length} حساب طالب</span><span>الصلاحيات تُراجع على الخادم</span></div><div className="student-list">{filteredStudents.map(student=><article className="student-row" key={student.id}><span className="mini-icon lilac">{student.profile.name[0]}</span><div><h3>{student.profile.name}</h3><p dir="ltr">{student.email}</p><small>{profileLabel(student.profile)} · الترم {student.profile.semester}</small></div><span className={`tag ${student.active ? "status-published" : "status-draft"}`}>{student.active ? "نشط" : "موقوف"}</span><button className="button outline-button" disabled={busy} onClick={()=>changeUser(student)}>{student.active ? "إيقاف الحساب" : "تفعيل الحساب"}</button></article>)}{!filteredStudents.length && <div className="empty-state"><Users size={30}/><h2>{students.length ? "مفيش نتيجة بالاسم ده." : "لسه بنستقبل أول طالب."}</h2><p>حسابات الطلاب تظهر هنا بعد التسجيل من الصفحة العامة.</p></div>}</div></>}
      {(view==="library" || view==="assignments" || view==="exams") && <AdminLearningPanel key={view} kind={view} data={data.learning} onReload={reload}/>}
      {view==="schedule" && <AdminSchedule schedules={data.schedules} onReload={reload}/>}
      {view==="settings" && <AdminSettings initial={data.settings} user={user} onReload={reload}/>}
      <footer className="page-footer"><span>حركة. · مساحة الإدارة</span><span>بيانات فعلية محفوظة على الخادم</span></footer>
    </main></div>{preview && <LessonPreview lesson={preview} onClose={()=>setPreview(null)}/>}</div>;
}

function LessonPreview({ lesson, onClose }: { lesson: Lesson; onClose: ()=>void }) {
  const ref=useRef<HTMLDialogElement>(null); const [play,setPlay]=useState(false);
  useEffect(()=>{ref.current?.showModal();const overflow=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{document.body.style.overflow=overflow;};},[]); const video=youtubeId(lesson.youtubeUrl);
  return <dialog ref={ref} className="preview-dialog" onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===ref.current) onClose();}} aria-labelledby="preview-title"><div className="section-heading"><span className="tag lilac">معاينة للإدارة · {lesson.status==="draft" ? "مسودة" : "منشور"}</span><button className="icon-button" aria-label="إغلاق المعاينة" onClick={onClose}><X size={20}/></button></div><h2 id="preview-title">{lesson.title}</h2><p className="muted">{lesson.intro}</p>{video && <div className="youtube-container">{play ? <iframe src={`https://www.youtube-nocookie.com/embed/${video}`} title="معاينة فيديو الدرس" allowFullScreen/> : <button onClick={()=>setPlay(true)}><Play size={25}/>شغّل الفيديو</button>}</div>}<div className="reading-copy"><LessonCopy text={lesson.body}/></div>{!!lesson.blocks?.length && <LessonBlocks key={lesson.id} blocks={lesson.blocks} preview/>}{lesson.takeaways && <section className="reading-copy"><h3>الخلاصة</h3><LessonCopy text={lesson.takeaways.split("\n").map(s=>`- ${s}`).join("\n")}/></section>}{lesson.application&&<section className="reading-copy"><h3>التطبيق</h3><LessonCopy text={lesson.application}/></section>}{lesson.practice&&<LessonBlocks preview blocks={[{id:"preview-practice",type:"quiz",title:lesson.practice.question,body:"",options:lesson.practice.options,correctIndex:lesson.practice.correctIndex,explanation:lesson.practice.explanation}]}/>}</dialog>;
}
