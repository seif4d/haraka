"use client";

import { StudentLibrary, StudentAssignments, StudentAssignmentDetail, StudentExams } from "./student-learning";
import StudentExam from "./student-exam";
import type { Attempt } from "@/lib/academic-domain";
import BrandLogo from "./brand-logo";
import CourseHub from "./course-hub";
import CourseLesson from "./course-lesson";
import StudentSettings from "./student-settings";
import StudentSchedule from "./student-schedule";
import { chosenCourse, specializationSlots, type Specializations } from "@/lib/specializations";
import { studentFeature } from "@/lib/student-feature";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import PlatformNotice from "./platform-notice";
import type { StudentData } from "@/lib/domain";
import { allCurriculum } from "@/lib/catalog";
import { useEffect, useMemo, useRef, useState } from "react";
import { LibraryBig, ListTodo, ClipboardCheck, CalendarDays, Activity, ArrowLeft, ArrowRight, ArrowUpLeft, Bookmark, BookOpen, Brain, Check, CheckCheck, ChevronLeft, Compass, ExternalLink, FileText, FlaskConical, GraduationCap, Home, Menu, Moon, Play, Search, Settings2, Sparkles, Sun, Target, Trophy, X } from "lucide-react";
import { Course, Profile, SCIENCE_SOURCE, SCHEDULE_SOURCE, coursesFor, isDemoCourse, profileLabel } from "@/lib/curriculum";

export type StudentView = "home" | "courses" | "saved" | "progress" | "course" | "lesson" | "custom" | "schedule" | "settings" | "library" | "assignments" | "assignment" | "exams" | "exam";
type View = StudentView;
type Store = StudentData;
const NAV = [
  { id: "home" as View, title: "الرئيسية", icon: Home },
  { id: "courses" as View, title: "موادي", icon: BookOpen },
  { id: "library" as View, title: "المكتبة", icon: LibraryBig },
  { id: "assignments" as View, title: "التكليفات", icon: ListTodo },
  { id: "exams" as View, title: "الاختبارات", icon: ClipboardCheck },
  { id: "schedule" as View, title: "جدول المحاضرات", icon: CalendarDays },
  { id: "saved" as View, title: "محفوظاتي", icon: Bookmark },
  { id: "progress" as View, title: "رحلتي", icon: Compass },
  { id: "settings" as View, title: "الإعدادات", icon: Settings2 },
];
const KIND = { academic: "نظري", practical: "نظري وتطبيقي", elective: "تخصص اختياري", field: "تطبيق ميداني" };
const MOBILE_NAV = [
  {id:"home",title:"الرئيسية",icon:Home},
  {id:"courses",title:"موادي",icon:BookOpen},
  {id:"schedule",title:"محاضراتي",icon:CalendarDays},
  {id:"assignments",title:"تكليفات",icon:ListTodo},
] as const;

function arabicSearch(value: string) {
  return value.normalize("NFKD").replace(/[\u064B-\u065F\u0670]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").toLowerCase();
}

export default function HarkaApp({ initialData, initialView, routeId, initialAttempt, renderedAt }: { initialData: StudentData; initialView: View; routeId: string; initialAttempt?:Attempt; renderedAt:string }) {
  const router = useRouter();
  const [store, setStore] = useState<Store>(initialData);
  const view = initialView;
  const selectedId = initialView === "custom" ? initialData.lessons.find(x=>x.id===routeId)?.courseId || "" : routeId;
  const customId = initialView === "custom" ? routeId : "";
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [savingProfile, setSavingProfile] = useState(false);
  const pendingSaves = useRef(new Set<string>());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const all = useMemo(allCurriculum, []);
  const courses = useMemo(() => coursesFor(store.profile).map(c=>chosenCourse(c,store.specializations)), [store.profile,store.specializations]);
  const baseSelected = all.find(course => course.id === selectedId) || courses[0];
  const selected = chosenCourse(baseSelected,store.specializations);
  const feature = studentFeature(store.profile);
  const pendingSpecialties = specializationSlots(store.profile).filter(c=>!store.specializations[c.id]);
  const featured = courses.find(isDemoCourse);
  const visible = courses.filter(course => (!query || arabicSearch(course.title).includes(arabicSearch(query))) && (kind === "all" || course.kind === kind));
  const savedCourses = all.filter(course => store.saved.includes(course.id)).map(c=>chosenCourse(c,store.specializations));
  const lessonsFor = (id: string) => store.lessons.filter(lesson => lesson.courseId === id);
  const countLessons = (course: Course) => Number(isDemoCourse(course)) + lessonsFor(course.id).length;
  const currentCompleted = courses.reduce((n, course) => n + Number(store.completed.includes(`torque-${course.id}`)) + lessonsFor(course.id).filter(lesson => store.completed.includes(lesson.id)).length, 0);
  const currentLessons = courses.reduce((n, course) => n + countLessons(course), 0);
  const percent = currentLessons ? Math.round(currentCompleted / currentLessons * 100) : 0;
  const custom = store.lessons.find(lesson => lesson.id === customId);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try { setStore(previous => ({...previous, dark: localStorage.getItem("harka-theme") === "dark"})); } catch { /* Appearance storage is optional. */ }
  }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  useEffect(()=>{
    const lessonId=view==="custom"?custom?.id:view==="lesson"?`torque-${selected.id}`:null;
    if(lessonId)api<{courseId:string;lessonId:string}>("student/lesson-visit",{lessonId}).then(result=>setStore(previous=>({...previous,lessonVisits:{...previous.lessonVisits,[result.courseId]:result.lessonId}}))).catch(()=>{});
  },[view,custom?.id,selected.id]);

  function notify(text: string) {
    setNotice(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setNotice(""), 4200);
  }
  function go(next: View, id?: string) {
    const paths: Record<View,string> = {home:"/student",courses:"/student/courses",saved:"/student/saved",progress:"/student/progress",course:`/student/courses/${id || selectedId}`,lesson:`/student/demo/${id || selectedId}`,custom:`/student/lessons/${id || customId}`,settings:"/student/settings",schedule:"/student/schedule",library:"/student/library",assignments:"/student/assignments",assignment:`/student/assignments/${id || routeId}`,exams:"/student/exams",exam:`/student/exams/attempts/${id || routeId}`};
    setMobileOpen(false); router.push(paths[next]); router.refresh();
  }
  function openCourse(course: Course) { go("course", course.id); }
  function openDemo() {
    const target = featured;
    if(target) go("lesson",target.id); else openCourse(feature.course);
  }
  async function toggleSave(id: string) {
    if(pendingSaves.current.has(id)) return;
    pendingSaves.current.add(id);
    const exists = store.saved.includes(id);
    try {
      await api("student/bookmarks",{courseId:id,saved:!exists});
      setStore(previous=>({...previous,saved:exists ? previous.saved.filter(x=>x!==id) : Array.from(new Set([...previous.saved,id]))}));
      notify(exists ? "اتشالت المادة من محفوظاتك." : "اتحفظت المادة في حسابك.");
    } catch(error) { notify(error instanceof Error ? error.message : "تعذر حفظ المادة."); } finally { pendingSaves.current.delete(id); }
  }
  async function complete(id: string) {
    try {
      await api("student/progress",{lessonId:id,...(id.startsWith("torque-") ? {answer:"double"} : {})});
      setStore(previous=>({...previous,completed:Array.from(new Set([...previous.completed,id]))}));
      notify("خطوة جديدة في رحلتك. اتسجّل إنجازك في حسابك.");router.refresh();
    } catch(error) { notify(error instanceof Error ? error.message : "تعذر حفظ الإنجاز."); }
  }
  async function updateProfile(profile: Profile, specializations: Specializations) {
    if(savingProfile) return false; setSavingProfile(true);
    try {const result=await api<StudentData>("student/profile",{...profile,specializations},"PATCH");setStore(previous=>({...result,dark:previous.dark}));router.refresh();return true;}
    catch(error) {notify(error instanceof Error ? error.message : "تعذر حفظ الإعدادات.");return false;} finally {setSavingProfile(false);}
  }
  async function chooseSport(courseId: string,sportId: string) {
    if(savingProfile) return;setSavingProfile(true);
    try {const result=await api<StudentData>("student/specializations",{courseId,sportId},"PATCH");setStore(previous=>({...result,dark:previous.dark}));notify("اتحفظ اختيار تخصصك.");router.refresh();}
    catch(error) {notify(error instanceof Error ? error.message : "تعذر حفظ التخصص.");} finally {setSavingProfile(false);}
  }
  async function logout() {
    try { await api("auth/logout",{}); window.location.assign("/"); }
    catch { notify("تعذر تسجيل الخروج. حاول مرة أخرى."); }
  }
  const card = (course: Course) => <CourseCard key={course.id} course={course} saved={store.saved.includes(course.id)} lessons={countLessons(course)} complete={store.completed.includes(`torque-${course.id}`)} onOpen={() => openCourse(course)} onSave={() => toggleSave(course.id)} />;
  async function reloadLearning(){const learning=await api<StudentData["learning"]>("student/learning",undefined,"GET");setStore(previous=>({...previous,learning}));router.refresh();}
  const navActive = view === "assignment" ? "assignments" : view === "exam" ? "exams" : view === "course" || view === "lesson" || view === "custom" ? "courses" : view;
  const pageNames: Record<View, string> = { home: "مساحتك للتعلّم", courses: "المواد الدراسية", saved: "محفوظاتك", progress: "رحلتك في التعلّم", course: "داخل المقرر", lesson: "جرّب وافهم", custom: "داخل الدرس",schedule:"جدول المحاضرات",settings:"إعدادات الحساب",library:"المكتبة",assignments:"التكليفات",assignment:"داخل التكليف",exams:"الاختبارات",exam:"محاولة الاختبار" };

  return <div className={`harka-shell student-shell${store.dark ? " dark" : ""}`}>
    {mobileOpen && <button className="sidebar-scrim" aria-label="إغلاق القائمة" onClick={() => setMobileOpen(false)} />}
    <aside id="student-sidebar" className={`sidebar${mobileOpen ? " expanded" : ""}`}>
      <button className="brand" onClick={() => go("home")} aria-label="حركة، الرئيسية"><BrandLogo inverse/></button>
      <div className="sidebar-caption">مساحة علوم الرياضة</div>
      <nav className="side-nav" aria-label="القائمة الرئيسية">{NAV.map(item => <button key={item.id} className={navActive === item.id ? "active" : ""} aria-current={navActive === item.id ? "page" : undefined} onClick={() => go(item.id)}><item.icon size={20} /><span>{item.title}</span>{navActive === item.id && <span className="nav-dot" />}{item.id === "saved" && store.saved.length > 0 && <span className="nav-count">{store.saved.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><span className="student-identity">{store.profile.name}</span><button onClick={()=>window.location.assign("/")}><Home size={17}/>عن المنصة</button><button onClick={logout}><ArrowRight size={17}/>تسجيل الخروج</button></div>
    </aside>

    <div className="app-area">
      <header className="topbar"><div className="topbar-start"><button className="icon-button mobile-menu" aria-label="فتح القائمة" onClick={() => setMobileOpen(true)}><Menu /></button><div className="breadcrumb"><span>حركة</span><ChevronLeft size={13} /><strong>{pageNames[view]}</strong></div></div><div className="topbar-end"><span className="topbar-college"><GraduationCap size={16} />علوم الرياضة · أسيوط</span><button className="icon-button" aria-label="البحث في المواد" onClick={() => { go("courses"); setTimeout(() => document.getElementById("course-search")?.focus(), 100); }}><Search size={19} /></button><button className="icon-button theme-button" aria-label={store.dark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"} onClick={() => {try {localStorage.setItem("harka-theme",store.dark ? "light" : "dark");} catch {} setStore(previous => ({ ...previous, dark: !previous.dark }));}}>{store.dark ? <Sun size={19} /> : <Moon size={19} />}</button></div></header>

      <main className="page-content" id="main-content">
        <PlatformNotice text={store.announcement}/>
        {view === "home" && <>
          <section className="welcome-row"><div><p className="eyebrow"><span className="live-dot" />يوم جديد، فكرة جديدة</p><h1>{store.profile.name ? `أهلًا ${store.profile.name.split(" ")[0]}،` : "أهلًا بيك،"} جاهز تتحرّك؟ <span className="wave">↗</span></h1><p className="muted">من أول «ليه؟» لحد «آه فهمت»… دي مساحتك.</p></div><span className="cohort-caption"><span>{profileLabel(store.profile)}</span><span>الترم {store.profile.semester===1 ? "الأول" : "الثاني"}</span></span></section>
          <section className="hero-panel" data-feature-course={feature.course.id}><div className="hero-copy"><div className="hero-kicker"><span className="solid-dot"/>{feature.course.title}<span className="hero-mini-label">{store.profile.gender==="girls" ? "مساركِ" : "مسارك"} · الترم {store.profile.semester===1?"الأول":"الثاني"}</span></div><h2>{feature.line1}<br/><span className="underlined-word">{feature.line2}</span></h2><p>{feature.copy}</p><button className="button dark-button" onClick={()=>feature.interactive ? go("lesson",feature.course.id) : openCourse(feature.course)}><Play size={16} fill="currentColor"/>{feature.interactive ? "يلا نجرّب" : "استكشف المادة"}<ArrowLeft size={18}/></button><div className="hero-footnote"><FlaskConical size={14}/>{feature.interactive ? "تجربة تفاعلية متاحة · سؤال يختبر فهمك" : countLessons(feature.course) ? `${countLessons(feature.course)} درس متاح في المادة` : "فكرة من مقرراتك · الشرح يُضاف بعد نشره"}</div></div><div className="hero-art" aria-hidden="true"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-orbit orbit-three"/><div className="art-cross cross-one">+</div><div className="art-cross cross-two">+</div><span className="art-label">{feature.formula}</span><div className="art-torque">{feature.symbol}</div><span className="art-arrow">↗</span><span className="art-sticker">{feature.interactive ? "جرّبها بنفسك" : "من مواد ترمك"}<Sparkles size={14}/></span><span className="art-bottom">THE SCIENCE BEHIND YOUR NEXT MOVE.</span></div></section>
          <div className="home-utilities"><button className="schedule-shortcut" onClick={()=>go("schedule")}><span className="mini-icon blue"><CalendarDays size={23}/></span><span><strong>جدول محاضراتك</strong><small>{store.schedule ? `${store.schedule.entries.length} محاضرة في أسبوعك · ${store.schedule.academicYear}` : "المواعيد والأماكن، أول ما الجدول يتنشر"}</small></span><ArrowLeft size={18}/></button>{pendingSpecialties.length>0 && <button className="specialties-shortcut" onClick={()=>go("settings")}><span className="mini-icon lilac"><Target size={23}/></span><span><strong>اختار رياضات تخصصك</strong><small>عشان موادك وشرحك يبقوا مناسبين ليك</small></span><ArrowLeft size={18}/></button>}</div>
          <section className="learning-shortcuts"><button onClick={()=>go("library")}><LibraryBig size={21}/><span><strong>المكتبة</strong><small>{store.learning.resources.length} كتاب وملخص ومورد</small></span><ArrowLeft size={16}/></button><button onClick={()=>go("assignments")}><ListTodo size={21}/><span><strong>تكليفاتك</strong><small>{store.learning.assignments.filter(a=>!a.submission || a.submission.status==="returned").length} تكليف مطلوب</small></span><ArrowLeft size={16}/></button><button onClick={()=>go("exams")}><ClipboardCheck size={21}/><span><strong>اختبر نفسك</strong><small>{store.learning.exams.length} اختبار منشور</small></span><ArrowLeft size={16}/></button></section>
          <section className="home-lower"><div className="home-courses"><div className="section-heading"><div><p className="eyebrow">مسارك، على مزاجك</p><h2>خطوتك الجاية</h2></div><button className="text-button" onClick={() => go("courses")}>كل المواد <ArrowLeft size={16} /></button></div><div className="course-grid home-grid">{courses.slice(0, 3).map(card)}</div></div><aside className="journey-card"><div className="journey-top"><span className="mini-icon lilac"><Compass size={21} /></span><span className="tag">رحلتك</span></div><h3>خطوة صغيرة.<br />فهم أكبر.</h3><p>{currentCompleted > 0 ? `أنجزت ${currentCompleted} من ${currentLessons} درس في مسارك الحالي. كمّل على نفس الخط.` : "ابدأ أول درس، وخلّي كل معلومة جديدة خطوة في طريقك."}</p><div className="journey-track" role="progressbar" aria-label="تقدم المسار الحالي" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div><div className="journey-meta"><span>{currentCompleted} درس مكتمل</span><b>{percent}%</b></div><button className="text-button" onClick={() => go("progress")}>شوف رحلتك <ArrowLeft size={16} /></button></aside></section>
          <section className="concept-strip"><span className="concept-mark"><Brain size={23} /></span><div><strong>افهمها. جرّبها. ثبّتها.</strong><p>شرح واضح، تجربة تغيّر فيها بإيدك، وسؤال يشرح لك «ليه».</p></div><span className="strip-word" aria-hidden="true">KEEP MOVING ↗</span></section>
        </>}

        {view === "courses" && <>
          <PageHeading eyebrow="كل مادة، في مكانها" title="افتح باب الفهم." description="دي مواد مسارك الدراسي. ابحث عن المادة وكمّل من مكانك." />
          <section className="filter-panel" aria-label="تصفية المواد"><div className="filter-search-row"><label className="search-field"><Search size={18} /><input id="course-search" placeholder="بتدوّر على مادة إيه؟" value={query} onChange={event => setQuery(event.target.value)} /><kbd>/</kbd></label><div className="filter-pills" aria-label="نوع المقرر">{[["all", "كل المواد"], ["academic", "نظري"], ["practical", "تطبيقي"], ["elective", "تخصص"], ["field", "ميداني"]].map(([id, title]) => <button key={id} className={kind === id ? "selected" : ""} aria-pressed={kind === id} onClick={() => setKind(id)}>{title}</button>)}</div></div></section>
          <div className="catalog-heading"><span>{visible.length} مقرر في مسارك</span><span>{profileLabel(store.profile)} · الترم {store.profile.semester === 1 ? "الأول" : "الثاني"}</span></div>
          {visible.length ? <div className="course-grid">{visible.map(card)}</div> : <EmptyState icon={<Search size={27} />} title="مفيش مادة بالاختيارات دي." description="جرّب اسم أقصر، أو اعرض كل أنواع المقررات." action="مسح البحث" onAction={() => { setQuery(""); setKind("all"); }} />}
          <SourceNote />
        </>}

        {view === "saved" && <><PageHeading eyebrow="الحاجات اللي هترجع لها" title="على رفّك." description="موادك المحفوظة من كل المسارات. اختصار صغير للمعلومة اللي تهمك." />{savedCourses.length ? <div className="course-grid">{savedCourses.map(card)}</div> : <EmptyState icon={<Bookmark size={28} />} title="لسه الرف فاضي." description="احفظ مادة من علامة المفضلة، وهتفضل هنا لما ترجع." action="استكشف موادك" onAction={() => go("courses")} />}</>}

        {view === "progress" && <>
          <PageHeading eyebrow="كل فهم جديد بيتحسب" title="شوف قد إيه اتحرّكت." description="إنجازك هنا ناتج عن الدروس اللي أكملتها بنفسك، ومحفوظ في حسابك." />
          <section className="progress-hero"><div><span className="eyebrow">مسارك الحالي</span><h2>{profileLabel(store.profile)}</h2><p>{currentCompleted} درس مكتمل من {currentLessons} درس متاح</p><button className="button dark-button" onClick={openDemo}>كمّل تعلّمك <ArrowLeft size={16} /></button></div><div className="progress-ring" style={{ "--progress": `${percent}%` } as React.CSSProperties}><span><strong>{percent}%</strong><small>من الدروس المتاحة</small></span></div></section>
          <div className="section-heading"><h2>محطات رحلتك</h2><span className="muted small">التقدم التعليمي تجريبي، وليس درجات رسمية</span></div>
          <div className="milestone-list">{courses.filter(course => countLessons(course) > 0).map(course => <div className="milestone" key={course.id}><span className={`milestone-icon ${store.completed.includes(`torque-${course.id}`) ? "done" : ""}`}>{store.completed.includes(`torque-${course.id}`) ? <Check size={21} /> : <BookOpen size={21} />}</span><div><strong>{course.title}</strong><small>{countLessons(course)} درس متاح</small></div><button className="text-button" onClick={() => openCourse(course)}>افتح المادة <ArrowLeft size={15} /></button></div>)}{currentLessons === 0 && <p className="empty-inline">مسارك لسه مستني أول درس. الشرح هيظهر بعد نشره من الإدارة. تقدر تستكشف فهرس موادك دلوقتي.</p>}</div>
        </>}

        {view === "course" && selected && <CourseHub course={selected} baseCourse={baseSelected} data={store} onSave={()=>toggleSave(selected.id)} onSport={id=>chooseSport(baseSelected.id,id)} saving={savingProfile} renderedAt={renderedAt}/>}

        {view === "lesson" && selected && <TorqueLesson key={selected.id} complete={store.completed.includes(`torque-${selected.id}`)} onComplete={() => complete(`torque-${selected.id}`)} saved={store.saved.includes(selected.id)} onSave={() => toggleSave(selected.id)} onBack={() => go("course")} />}

        {view === "custom" && custom && <CourseLesson lesson={custom} course={selected} data={store} onComplete={()=>complete(custom.id)}/>}

        {view==="library" && <StudentLibrary data={store.learning}/>}
        {view==="assignments" && <StudentAssignments data={store.learning}/>}
        {view==="assignment" && <StudentAssignmentDetail assignment={store.learning.assignments.find(a=>a.id===routeId)!} onReload={reloadLearning}/>}
        {view==="exams" && <StudentExams data={store.learning}/>}
        {view==="exam" && initialAttempt && <StudentExam initial={initialAttempt}/>}
        {view==="settings" && <StudentSettings data={store} onSave={updateProfile}/>}
        {view==="schedule" && <StudentSchedule data={store} renderedAt={renderedAt} onGroupChange={classGroup=>updateProfile({...store.profile,classGroup},Object.fromEntries(specializationSlots(store.profile).filter(c=>store.specializations[c.id]).map(c=>[c.id,store.specializations[c.id]])))}/>}
        <footer className="page-footer"><span>حركة<span className="brand-dot">.</span> <span>افهمها. جرّبها. ثبّتها.</span></span><span>مساحة تعلّم مستقلة · علوم الرياضة، أسيوط</span></footer>
      </main>
      <nav className="mobile-bottom-nav" aria-label="تنقل الموبايل">{MOBILE_NAV.map(item => <button key={item.id} className={navActive === item.id ? "active" : ""} aria-current={navActive===item.id?"page":undefined} onClick={() => go(item.id)}><item.icon size={20} /><span>{item.title}</span></button>)}<button className={!MOBILE_NAV.some(item=>item.id===navActive)?"active":""} aria-expanded={mobileOpen} aria-controls="student-sidebar" onClick={()=>setMobileOpen(true)}><Menu size={20}/><span>المزيد</span></button></nav>
    </div>
    {notice && <div className="toast" role="status"><Check size={17} /><span>{notice}</span><button aria-label="إغلاق التنبيه" onClick={() => setNotice("")}><X size={15} /></button></div>}

  </div>;
}

function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="page-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="muted">{description}</p></div>;
}


function CourseCard({ course, saved, lessons, complete, onOpen, onSave }: { course: Course; saved: boolean; lessons: number; complete: boolean; onOpen: () => void; onSave: () => void }) {
  const Icon = course.title.includes("تعلم") || course.title.includes("نفس") ? Brain : course.kind === "practical" ? Activity : course.kind === "field" ? Compass : course.kind === "elective" ? Target : BookOpen;
  return <article className={`course-card accent-${course.accent}`}><div className="course-card-top"><span className={`course-icon tint-${course.accent}`}><Icon size={24} strokeWidth={1.6} /></span><button className={`icon-button bookmark-button${saved ? " saved" : ""}`} onClick={onSave} aria-label={`${saved ? "إلغاء حفظ" : "حفظ"} ${course.title}`} aria-pressed={saved}><Bookmark size={18} fill={saved ? "currentColor" : "none"} /></button></div><button className="course-card-main" onClick={onOpen}><span className="course-kind">{KIND[course.kind]}</span><h3>{course.title}</h3><p>{course.description}</p></button><div className="course-card-footer"><span className={lessons ? "available" : "coming"}>{complete ? <CheckCheck size={14} /> : lessons ? <span className="available-dot" /> : <span className="coming-dot" />}{complete ? "بدأت رحلتك فيها" : lessons ? `${lessons} درس متاح` : "الفهرس جاهز"}</span><button onClick={onOpen} aria-label={`فتح ${course.title}`}><ArrowUpLeft size={20} /></button></div></article>;
}

function SourceNote() {
  return <aside className="source-note"><FileText size={19} /><div><strong>المصدر واضح، والسنة واضحة.</strong><p>الترم الأول: جداول 2025/2026. الترم الثاني: امتحانات 2025/2026، وبعض التطبيقات من محاضرات 2024/2025. سنة المصدر موجودة داخل كل مادة؛ بيانات العام الحالي تحتاج مراجعة الكلية.</p><a href={SCHEDULE_SOURCE} target="_blank" rel="noreferrer">صفحة الجداول الرسمية <ExternalLink size={13} /></a></div></aside>;
}

function EmptyState({ icon, title, description, action, onAction }: { icon: React.ReactNode; title: string; description: string; action: string; onAction: () => void }) {
  return <div className="empty-state"><span className="empty-icon">{icon}</span><h2>{title}</h2><p>{description}</p><button className="button primary-button" onClick={onAction}>{action}<ArrowLeft size={16} /></button></div>;
}

function TorqueLesson({ complete, saved, onComplete, onSave, onBack }: { complete: boolean; saved: boolean; onComplete: () => void; onSave: () => void; onBack: () => void }) {
  const [tab, setTab] = useState("try");
  const [distance, setDistance] = useState(30);
  const [force, setForce] = useState(20);
  const [answer, setAnswer] = useState("");
  const torque = force * distance / 100;
  const x = 70 + distance / 50 * 350;
  return <>
    <button className="back-button" onClick={onBack}><ArrowRight size={17} />ارجع للمادة</button>
    <div className="lesson-heading"><div><p className="eyebrow"><FlaskConical size={15} />مبادئ التحليل الحركي · درس نموذجي</p><h1>نفس القوة.<br className="mobile-only" /> تأثير أكبر؟ <span>↗</span></h1><p className="muted">سؤال صغير يفتح لك باب فهم عزم القوة.</p></div><button className={`button outline-button ${saved ? "is-saved" : ""}`} onClick={onSave}><Bookmark size={17} fill={saved ? "currentColor" : "none"} />{saved ? "المادة محفوظة" : "احفظ المادة"}</button></div>
    <div className="lesson-tabs" role="tablist" aria-label="مراحل الدرس">{[{ id: "read", title: "افهم الفكرة", number: "01", icon: Brain }, { id: "try", title: "جرّب بنفسك", number: "02", icon: FlaskConical }, { id: "quiz", title: "ثبّت المعلومة", number: "03", icon: Target }].map(item => <button role="tab" type="button" key={item.id} id={`tab-${item.id}`} aria-controls={`panel-${item.id}`} aria-selected={tab === item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}><span>{item.number}</span><item.icon size={18} />{item.title}{item.id === "quiz" && complete && <Check size={15} />}</button>)}</div>
    {tab === "try" && <section className="experiment-layout" role="tabpanel" id="panel-try" aria-labelledby="tab-try"><div className="experiment-board"><div className="experiment-top"><span><span className="live-dot" />معمل الحركة</span><span>قوة عمودية · نموذج مبسّط</span></div><svg className="lever-diagram" viewBox="0 0 520 260" role="img" aria-label={`قوة مقدارها ${force} نيوتن تؤثر عموديًا على بعد ${distance} سنتيمتر من المحور، بعزم ${torque.toFixed(1)} نيوتن متر`}><defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="currentColor" opacity=".13" /></pattern></defs><rect width="520" height="260" fill="url(#grid)" /><line x1="70" y1="110" x2="435" y2="110" stroke="currentColor" opacity=".12" strokeWidth="18" strokeLinecap="round" /><line x1="70" y1="110" x2={x} y2="110" stroke="currentColor" strokeWidth="14" strokeLinecap="round" /><circle cx="70" cy="110" r="19" className="diagram-pivot" /><circle cx="70" cy="110" r="6" fill="currentColor" /><text x="70" y="66" textAnchor="middle">محور الدوران</text><g transform={`translate(${x},0)`}><rect x="-24" y="86" width="48" height="48" rx="12" className="diagram-load" /><line x1="0" y1="145" x2="0" y2={172 + force * .5} stroke="currentColor" strokeWidth="3" /><path d={`M -7 ${165 + force * .5} L 0 ${174 + force * .5} L 7 ${165 + force * .5}`} stroke="currentColor" strokeWidth="3" fill="none" /><text x="0" y={199 + force * .5} textAnchor="middle" direction="ltr">{force} N</text></g><line x1="70" y1="245" x2={x} y2="245" stroke="currentColor" opacity=".4" strokeWidth="1.5" /><line x1="70" y1="238" x2="70" y2="252" stroke="currentColor" opacity=".4" /><line x1={x} y1="238" x2={x} y2="252" stroke="currentColor" opacity=".4" /></svg><div className="experiment-result" aria-live="polite"><div><span>عزم القوة حول المحور</span><strong dir="ltr">{torque.toFixed(1)} <small>N·m</small></strong></div><span className="result-formula" dir="ltr">{force} × {(distance / 100).toFixed(2)}</span></div><div className="range-controls"><label><span>المسافة عن المحور <strong>{distance} سم</strong></span><input type="range" aria-label="المسافة عن المحور" min={10} max={50} value={distance} onChange={event => setDistance(Number(event.target.value))} /><small><span>10 سم</span><span>50 سم</span></small></label><label><span>مقدار القوة <strong>{force} نيوتن</strong></span><input type="range" aria-label="مقدار القوة" min={5} max={50} value={force} onChange={event => setForce(Number(event.target.value))} /><small><span>5 نيوتن</span><span>50 نيوتن</span></small></label></div></div><aside className="experiment-guide"><span className="mini-icon lilac"><Sparkles size={23} /></span><h2>حرّك. لاحظ.<br />اربط الفكرة.</h2><div className="guide-step"><span>1</span><p>ثبّت القوة عند <strong>20 نيوتن</strong>، وغيّر المسافة وحدها.</p></div><div className="guide-step"><span>2</span><p>لو المسافة اتضاعفت، شوف العزم بيتغيّر إزاي.</p></div><div className="guide-step"><span>3</span><p>رجّع المسافة وثبّتها، وبعدها غيّر القوة. اكتشف العلاقة بنفسك.</p></div><div className="guide-observation"><Brain size={18} /><p>في النموذج ده، القوة عمودية على الذراع؛ لذلك المسافة المرسومة هي ذراع العزم.</p></div><button className="button primary-button" onClick={() => setTab("quiz")}>وصلت للفكرة؟ <ArrowLeft size={17} /></button></aside></section>}
    {tab === "read" && <section className="reading-layout" role="tabpanel" id="panel-read" aria-labelledby="tab-read"><article className="reading-copy"><span className="tag lilac">من الموقف للمفهوم</span><h2>ليه نفس القوة تعمل تأثير مختلف؟</h2><p>تخيّل بابًا بتحاول تفتحه: مكان ما بتضغط بيفرق في تأثيرك الدوراني. الفكرة هنا هي <strong>عزم القوة</strong>؛ مقياس تأثير القوة في إحداث دوران حول محور.</p><h3><span>01</span>القوة ليها مكان واتجاه.</h3><p>قوة واحدة ممكن تعمل عزومًا مختلفة لو مكان تطبيقها أو اتجاهها اتغيّر. عشان كده مقارنة مقدار القوة وحده مش كفاية.</p><h3><span>02</span>ذراع العزم مش أي مسافة.</h3><p>هو أقصر مسافة عمودية بين محور الدوران وخط عمل القوة. في تجربتنا، الذراع أفقي والقوة رأسية؛ فالمسافة اللي بتحركها بتساوي ذراع العزم مباشرة.</p><div className="formula-card"><span>العلاقة في تجربتنا</span><strong dir="ltr">τ = F × d⊥</strong><p>العزم = القوة × ذراعها العمودي</p></div><h3><span>03</span>خلّينا نحسبها مع بعض.</h3><p>قوة مقدارها 20 نيوتن، تؤثر عموديًا على بعد 30 سم، أي 0.30 متر، تنتج عزمًا مقداره <strong>6 نيوتن·متر</strong>. عند زيادة المسافة إلى 40 سم مع ثبات القوة والاتجاه، يصبح العزم 8 نيوتن·متر.</p><h3><span>04</span>وإيه حكاية الزاوية؟</h3><p>العلاقة العامة هي <bdi>τ = rF sin θ</bdi>. إذا تغيرت زاوية القوة أو مقدارها، لازم ناخد ده في الحساب. النموذج الحالي يثبت الزاوية عند 90 درجة.</p><a className="science-link" href={SCIENCE_SOURCE} target="_blank" rel="noreferrer">راجع المرجع العلمي: OpenStax · Torque <ExternalLink size={14} /></a><button className="button primary-button" onClick={() => setTab("try")}>شوف القانون بيتحرّك <ArrowLeft size={17} /></button></article><aside className="reading-aside"><span className="tiny-label">TAKE THE IDEA WITH YOU</span><div className="revision-card"><span>بطاقة الفكرة</span><Activity size={27} /><h3>نفس القوة.<br />ذراع أطول.<br /><em>عزم أكبر.</em></h3><p>بشرط ثبات اتجاه القوة ومقدارها.</p><strong dir="ltr">τ = F × d⊥</strong></div></aside></section>}
    {tab === "quiz" && <section className="quiz-layout" role="tabpanel" id="panel-quiz" aria-labelledby="tab-quiz"><div className="quiz-card"><span className="tag lilac"><Target size={14} />تحدّي الفهم</span><h2>القوة ثابتة، والزاوية ثابتة.<br />والمسافة اتضاعفت…</h2><p>ذراع العزم زاد من 20 سم إلى 40 سم، والقوة ثابتة عند 20 نيوتن. العزم يحصل له إيه؟</p><div className="answer-options">{[{ id: "same", title: "يفضل زي ما هو", letter: "أ" }, { id: "double", title: "يتضاعف", letter: "ب" }, { id: "half", title: "يقل للنصف", letter: "ج" }].map(option => <button key={option.id} className={answer === option.id ? `chosen ${answer === "double" ? "correct" : "incorrect"}` : ""} onClick={() => setAnswer(option.id)} aria-pressed={answer === option.id}><span>{option.letter}</span>{option.title}{answer === option.id && (answer === "double" ? <Check size={20} /> : <X size={20} />)}</button>)}</div>{answer && <div className={`answer-feedback ${answer === "double" ? "correct" : "incorrect"}`} role="status"><strong>{answer === "double" ? "بالضبط، الفكرة وصلت!" : "قربت… نرجع للعلاقة."}</strong><p>العزم = القوة × المسافة العمودية. من <bdi>20 × 0.20 = 4 N·m</bdi> إلى <bdi>20 × 0.40 = 8 N·m</bdi>. المسافة اتضاعفت، فالعزم اتضاعف.</p></div>}<button className="button primary-button" disabled={answer !== "double" && !complete} onClick={onComplete}>{complete ? <CheckCheck size={18} /> : <Check size={18} />}{complete ? "الدرس مكتمل في رحلتك" : "ثبّت إنجازك في رحلتك"}</button><small className="form-note">اختار الإجابة الصحيحة لتسجيل إكمال الدرس.</small></div><aside className="quiz-aside"><span className="giant-spark" aria-hidden="true">✳</span><h3>الفهم يكسب.</h3><p>كل محاولة فرصة تربط القانون بالمشهد. خُد وقتك، وارجع للتجربة لو محتاج.</p><button className="text-button" onClick={() => setTab("try")}>ارجع للمعمل <ArrowLeft size={16} /></button></aside></section>}
  </>;
}
