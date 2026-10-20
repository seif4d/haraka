"use client";
import AdminStudents from "./admin-students";
import AdminOverview from "./admin-overview";
import type {AdminOverviewSnapshot} from "@/lib/admin-overview";
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

export type AdminData = { overview:AdminOverviewSnapshot; units:CourseUnit[]; trainingPlan:TrainingPlan; settings:PlatformSettings; learning:AdminLearning; schedules:Schedule[]; users: User[]; lessons: Lesson[]; completions: number; audit: {action: string; entityId: string; createdAt: string; name: string}[] };
export type AdminView = "academy" | "overview" | "content" | "users" | "settings" | "schedule" | "library" | "assignments" | "exams";
const NAV = [{view:"overview",href:"/admin",title:"نظرة عامة",icon:Home},{view:"content",href:"/admin/content",title:"المحتوى والدروس",icon:BookOpen},{view:"academy",href:"/admin/academy",title:"الكورسات",icon:Play},{view:"library",href:"/admin/library",title:"المكتبة",icon:LibraryBig},{view:"assignments",href:"/admin/assignments",title:"التكليفات والتسليمات",icon:ListTodo},{view:"exams",href:"/admin/exams",title:"الاختبارات والنتائج",icon:ClipboardCheck},{view:"schedule",href:"/admin/schedule",title:"جداول المحاضرات",icon:CalendarDays},{view:"users",href:"/admin/users",title:"الطلاب",icon:Users},{view:"settings",href:"/admin/settings",title:"الإعدادات",icon:Settings2}] as const;


export default function AdminApp({ initialData, user, view, contentCourseId, academyData }: { initialData: AdminData; user: User; view: AdminView;contentCourseId?:string;academyData?:AcademyData }) {
  const router = useRouter(); const [data,setData] = useState(initialData);
  const [mobile,setMobile] = useState(false); const [notice,setNotice] = useState("");
  const [preview,setPreview] = useState<Lesson|null>(null);
  const [busy,setBusy] = useState(false);
  useEffect(()=>setData(initialData),[initialData]);
  async function reload() { setData(await api<AdminData>("admin/state",undefined,"GET")); router.refresh(); }
  async function deleteLesson(lesson: Lesson) {
    if(!window.confirm(`حذف «${lesson.title}» نهائيًا؟ سيُحذف تقدّم الطلاب المرتبط بهذا الدرس أيضًا.`)) return;
    setBusy(true); setNotice("");
    try { await api("admin/lessons",{id:lesson.id},"DELETE"); await reload(); setNotice("اتحذف الدرس."); }
    catch(error) {setNotice(error instanceof Error ? error.message : "تعذر حذف الدرس.");} finally {setBusy(false);}
  }
  async function logout() { try {await api("auth/logout",{});window.location.assign("/");} catch {setNotice("تعذر تسجيل الخروج.");} }


  return <div className="harka-shell admin-shell">{mobile && <button className="sidebar-scrim" aria-label="إغلاق القائمة" onClick={()=>setMobile(false)}/>}
    <aside className={`sidebar${mobile ? " expanded" : ""}`}><Link className="brand" href="/admin"><BrandLogo inverse/></Link><div className="sidebar-caption">إدارة المنصة</div><nav className="side-nav" aria-label="تنقل الإدارة">{NAV.map(item=><button key={item.view} className={view===item.view ? "active" : ""} onClick={()=>router.push(item.href)} aria-current={view===item.view ? "page" : undefined}><item.icon size={20}/>{item.title}{view===item.view && <span className="nav-dot"/>}</button>)}</nav><div className="sidebar-bottom"><button onClick={()=>window.location.assign("/")}><Home size={18}/>الصفحة العامة</button><button onClick={logout}><LogOut size={18}/>تسجيل الخروج</button><div className="sidebar-profile"><span className="avatar"><ShieldCheck size={20}/></span><span><strong>{user.profile.name}</strong><small>إدارة · صلاحية محفوظة على الخادم</small></span></div></div></aside>
    <div className="app-area"><header className="topbar"><div className="topbar-start"><button className="icon-button mobile-menu" aria-label="فتح قائمة الإدارة" onClick={()=>setMobile(true)}><Menu/></button><div className="breadcrumb"><span>الإدارة</span><ArrowLeft size={13}/><strong>{NAV.find(x=>x.view===view)?.title}</strong></div></div><span className="tag lilac"><ShieldCheck size={14}/>مساحة الإدارة</span></header><main className="page-content">
      {view!=="content"&&view!=="academy"&&view!=="overview"&&view!=="users"&&view!=="schedule"&&<div className="admin-heading"><div className="page-heading"><p className="eyebrow">المكان اللي الفكرة بتكبر فيه</p><h1>{view==="library" ? "مكتبة بتكبر مع الفهم." : view==="assignments" ? "من المطلوب، للتسليم." : view==="exams" ? "سؤال يختبر الفهم." : "خلّيها على مقاس منصتك."}</h1><p className="muted">{view==="library" ? "أضف الكتب والملخصات والمراجع، وانشرها حسب المسار والتخصص." : view==="assignments" ? "حدّد المطلوب والموعد، وتابع التسليمات والملاحظات والدرجات." : view==="exams" ? "جهّز الأسئلة والوقت والمحاولات، وتابع النتائج الفعلية." : "تحكّم في التسجيل والتواصل، وراجع إعدادات حسابك وأمانه."}</p></div></div>}
      {notice && <div className="admin-notice" role="status"><Check size={18}/><span>{notice}</span><button className="icon-button" aria-label="إغلاق التنبيه" onClick={()=>setNotice("")}><X size={17}/></button></div>}
      {view==="overview" && <AdminOverview data={data} user={user} onRefresh={async()=>{setData(await api<AdminData>("admin/state",undefined,"GET"));}}/>}
      {view==="academy" && academyData && ((academyData.lessonId||academyData.preview)?<AcademyStudent data={academyData}/>:<AcademyAdmin initial={academyData}/>)}
      {view==="content" && <AdminContentWorkspace initialCourseId={contentCourseId} units={data.units} lessons={data.lessons} onNew={(courseId,unitId)=>router.push(`/admin/content/new?${new URLSearchParams({courseId,unitId})}`)} onEdit={lesson=>router.push(`/admin/content/${encodeURIComponent(lesson.id)}/edit`)} onPreview={setPreview} onDelete={deleteLesson} onReload={reload} onNotice={setNotice} externalBusy={busy}/>}

      {view==="users" && <AdminStudents onUserDelete={id=>setData(previous=>({...previous,users:previous.users.filter(u=>u.id!==id)}))} users={data.users} asOf={data.overview.generatedAt} onUserChange={user=>setData(previous=>({...previous,users:previous.users.map(u=>u.id===user.id?user:u)}))} onRefresh={async()=>{setData(await api<AdminData>("admin/state",undefined,"GET"));}}/>}
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
