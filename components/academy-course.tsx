"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {useEffect, useMemo, useRef, useState} from "react";
import {ArrowDown, ArrowLeft, ArrowRight, ArrowUpLeft, BookOpen, Check, CheckCheck, ChevronDown, Clock3, GraduationCap, Layers3, LockKeyhole, Play, Search, Sparkles, Target, X} from "lucide-react";
import {api} from "@/lib/client-api";
import {academyPercent, academyStart, type AcademyCourse} from "@/lib/academy";
import LessonCopy from "./lesson-copy";
import s from "./academy-course.module.css";

const number=(value:number)=>value.toLocaleString('ar-EG');
function duration(minutes:number){return minutes<60?`${number(minutes)} دقيقة`:`${number(Math.floor(minutes/60))} س${minutes%60?` و ${number(minutes%60)} د`:''}`;}
function searchText(value:string){return value.normalize('NFKD').replace(/[\u064B-\u065F\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').toLowerCase().trim();}

export default function AcademyCoursePage({course,preview=false}:{course:AcademyCourse;preview?:boolean}){
  const router=useRouter();
  const start=academyStart(course);
  const percent=academyPercent(course);
  const units=useMemo(()=>course.units.map(unit=>({...unit,lessons:course.lessons.filter(l=>l.unitId===unit.id)})).filter(unit=>unit.lessons.length),[course.units,course.lessons]);
  const [query,setQuery]=useState('');
  const [openUnits,setOpenUnits]=useState<string[]>(()=>[start?.unitId||units[0]?.id||'']);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const pending=useRef(false);
  const errorRef=useRef<HTMLParagraphElement>(null);
  const completed=new Set(course.progress.filter(p=>p.completedAt).map(p=>p.lessonId));
  const done=course.lessons.filter(l=>completed.has(l.id)).length;
  const minutes=course.lessons.reduce((sum,lesson)=>sum+lesson.duration,0);
  const partialDuration=course.lessons.some(l=>!l.duration);
  const outcomes=course.outcomes.split('\n').map(line=>line.replace(/^\s*[-•]\s*/,'').trim()).filter(Boolean);
  const normalized=searchText(query);
  const filtered=units.map(unit=>({...unit,lessons:!normalized||searchText(unit.title).includes(normalized)?unit.lessons:unit.lessons.filter(lesson=>searchText(lesson.title).includes(normalized))})).filter(unit=>unit.lessons.length);
  const matches=filtered.reduce((sum,unit)=>sum+unit.lessons.length,0);
  const allOpen=units.length>0&&units.every(unit=>openUnits.includes(unit.id));
  const lessonHref=start?(preview?`/admin/academy/${course.id}/preview/${start.id}`:`/student/academy/${course.id}/learn/${start.id}`):'';
  const accessible=course.enrolled||preview;
  const canEnroll=course.status==='published'&&course.lessons.length>0;

  useEffect(()=>{if(error)errorRef.current?.focus();},[error]);
  async function enroll(){
    if(pending.current||preview)return;
    pending.current=true;setBusy(true);setError('');
    try{await api('academy/enroll',{courseId:course.id});router.refresh();if(lessonHref)router.push(lessonHref);}
    catch(err){setError(err instanceof Error?err.message:'تعذر التسجيل. حاول مرة أخرى.');}
    finally{pending.current=false;setBusy(false);}
  }
  function search(value:string){setQuery(value);if(searchText(value))setOpenUnits(units.map(unit=>unit.id));}
  function action(closing=false){
    if(preview)return start?<Link className={s.primary} href={lessonHref}><Play size={17}/>{closing?'معاينة الدروس':'معاينة أول درس'}<ArrowLeft size={18}/></Link>:<button className={s.primary} disabled>لا يوجد درس منشور للمعاينة</button>;
    if(course.enrolled&&start)return <Link className={s.primary} href={lessonHref}>{percent===100?<CheckCheck size={18}/>:<Play size={17}/>}<span>{closing?(percent===100?'ارجع لمحتوى الكورس':'افتح خطوتك الجاية'):(percent===100?'راجع اللي اتعلمته':'كمّل رحلتك')}</span><ArrowLeft size={18}/></Link>;
    return <button type="button" className={s.primary} disabled={busy||!canEnroll||course.enrolled} onClick={enroll} aria-busy={busy}><span>{busy?'بنجهّز مكانك…':!course.lessons.length?'الدروس بتتجهّز':closing?'سجّل وابدأ التعلّم':'ابدأ الكورس مجانًا'}</span><ArrowLeft size={18}/></button>;
  }

  return <div className={s.page}>
    <div className={s.breadcrumb}><Link href={preview?`/admin/academy/${course.id}`:"/student/academy"}><ArrowRight size={15}/>{preview?"العودة لإدارة الكورس":"كل الكورسات"}</Link><span>{preview?"معاينة للإدارة":"مساحة لخطوتك الجاية"}</span></div>{preview&&<p className={s.previewBanner} role="status">دي معاينة النسخة المحفوظة من صفحة الطالب. الدروس المسودة مخفية، ومش بيتسجّل تقدّم أثناء المعاينة.</p>}
    <header className={s.hero}>
      <div className={s.heroCopy}>
        <div className={s.badges}><span><Sparkles size={13}/>{course.category}</span><span>{course.level}</span>{course.enrolled&&<span className={s.joined}><Check size={13}/>كورساتي</span>}</div>
        <h1>{course.title}</h1>
        <p className={s.summary}>{course.summary}</p>
        {course.instructor&&<a className={s.heroInstructor} href="#course-instructor"><span>{course.instructor.trim()[0]}</span><div><small>تتعلّم مع</small><strong>{course.instructor}</strong></div><ArrowUpLeft size={15}/></a>}
        <dl className={s.facts}>
          <div><dt><Layers3 size={16}/>الوحدات</dt><dd>{number(units.length)}<small>محطات في رحلتك</small></dd></div>
          <div><dt><BookOpen size={16}/>المحتوى</dt><dd>{number(course.lessons.length)}<small>دروس على مهلك</small></dd></div>
          <div><dt><Clock3 size={16}/>{minutes?'وقت التعلّم':'إيقاع التعلّم'}</dt><dd className={s.timeFact}>{minutes?duration(minutes):'على راحتك'}<small>{minutes?(partialDuration?'على الأقل · لبعض الدروس مدة غير محددة':'مدة الدروس المحددة'):'ابدأ وكمّل في الوقت المناسب ليك'}</small></dd></div>
        </dl>
        <div className={s.heroActions}>{action()}<a className={s.secondary} href="#course-curriculum">استكشف المنهج<ArrowDown size={16}/></a></div>
        <p className={s.heroNote}>{course.enrolled?'رحلتك محفوظة في حسابك. كمّل من أي جهاز.':'مجاني لطلاب حركة · بنفس حسابك، وبدون خطوات إضافية'}</p>
        {error&&<p ref={errorRef} tabIndex={-1} className={s.error} role="alert">{error}</p>}
      </div>
      <div className={s.heroVisual}>
        <div className={`${s.poster} ${course.cover?s.uploadedPoster:''}`}>
          {course.cover?<img className={s.coverImage} src={`/api/files/${course.cover.id}`} alt={`غلاف كورس ${course.title}`}/>:<><div className={s.posterArt} aria-hidden="true"><svg viewBox="0 0 360 280" fill="none"><ellipse cx="180" cy="140" rx="155" ry="90" transform="rotate(-35 180 140)"/><ellipse cx="180" cy="140" rx="155" ry="90" transform="rotate(35 180 140)"/><ellipse cx="180" cy="140" rx="155" ry="90" transform="rotate(90 180 140)"/><path d="M18 140H342M180 8V272" strokeDasharray="3 8"/></svg><span className={s.motionMark}><img src="/icon.svg" alt=""/></span><span className={s.plusOne}>+</span><span className={s.plusTwo}>+</span></div><div className={s.posterText}><small>LEARN IN MOTION</small><strong>الفكرة بتفرق.<br/><em>لما تفهمها.</em></strong></div></>}
          <span className={s.posterLabel}>{course.category}<ArrowUpLeft size={14}/></span>
        </div>
        <div className={s.visualFoot}><span className={s.statusDot}/><span>{course.enrolled?'أنت بالفعل جزء من الرحلة.':'فضولك هو نقطة البداية.'}</span><span aria-hidden="true">↗</span></div>
      </div>
    </header>

    {course.status==='archived'&&<p className={s.archive} role="status">الكورس مؤرشف؛ تقدر تكمّل دروسك لأنك مسجّل فيه بالفعل.</p>}
    {course.enrolled&&<section className={s.resume} aria-label="تقدمك في الكورس"><div className={s.ring} role="progressbar" aria-label="تقدم الكورس" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><svg viewBox="0 0 76 76" aria-hidden="true"><circle cx="38" cy="38" r="32"/><circle cx="38" cy="38" r="32" pathLength="100" strokeDasharray={`${percent} 100`}/></svg><strong>{number(percent)}<small>٪</small></strong></div><div className={s.resumeCopy}><span>{percent===100?'كل خطوة عملت فرق.':'من هنا، نكمّل.'}</span><h2>{percent===100?'رحلة اكتملت. وفهم تقدر ترجع له.':start?.title||'دروسك هتظهر هنا أول ما تكون جاهزة.'}</h2><p>{number(done)} من {number(course.lessons.length)} دروس مكتملة{start&&percent<100?` · ${course.units.find(u=>u.id===start.unitId)?.title||''}`:''}</p></div>{start&&<Link className={s.resumeLink} href={lessonHref} aria-label={percent===100?'راجع دروس الكورس':`استكمال درس ${start.title}`}><ArrowLeft size={21}/></Link>}</section>}

    <nav className={s.sectionNav} aria-label="أقسام صفحة الكورس"><a href="#course-outcomes"><Target size={16}/>هتتعلّم إيه؟</a><a href="#course-curriculum"><Layers3 size={16}/>المنهج<span>{number(course.lessons.length)}</span></a><a href="#course-audience"><GraduationCap size={17}/>مناسب لمين؟</a></nav>
    <div className={s.bodyGrid}>
      <div className={s.mainColumn}>
        <section id="course-outcomes" tabIndex={-1} className={s.outcomesSection}><div className={s.sectionHeading}><div><span className={s.kicker}>01 / المهارة اللي هتفضل معاك</span><h2>تخرج فاهم.<br/><em>وعارف تعمل إيه.</em></h2></div><span className={s.headingIcon}><Target size={27}/></span></div><div className={s.outcomeGrid}>{outcomes.map((line,index)=><article key={index}><span className={s.outcomeIndex}>{String(index+1).padStart(2,'0')}</span><p>{line}</p><Check size={16}/></article>)}</div>{!outcomes.length&&<p className={s.muted}>نتائج التعلّم هتظهر هنا بعد تجهيزها.</p>}</section>

        <section id="course-curriculum" tabIndex={-1} className={s.curriculum} aria-labelledby="course-curriculum-title"><div className={s.sectionHeading}><div><span className={s.kicker}>02 / الفكرة، خطوة بخطوة</span><h2 id="course-curriculum-title">خريطة الكورس.</h2><p>{number(units.length)} وحدات · {number(course.lessons.length)} دروس{minutes?` · ${duration(minutes)}${partialDuration?' على الأقل':''}`:''}</p></div>{units.length>0&&!normalized&&<button className={s.expandAll} type="button" onClick={()=>setOpenUnits(allOpen?[]:units.map(u=>u.id))}>{allOpen?'طي كل الوحدات':'فتح كل الوحدات'}<ChevronDown size={15}/></button>}</div>
          {course.lessons.length>0&&<label className={s.syllabusSearch}><Search size={17}/><input type="search" aria-label="ابحث في منهج الكورس" placeholder="دوّر على درس أو فكرة…" value={query} onChange={e=>search(e.target.value)}/>{query&&<button type="button" aria-label="مسح البحث في المنهج" onClick={()=>setQuery('')}><X size={16}/></button>}</label>}
          {normalized&&<p role="status" className={s.resultCount}>{matches?`${number(matches)} دروس تطابق بحثك`:'مفيش دروس بالبحث ده. جرّب كلمة تانية.'}</p>}
          <div className={s.units}>{filtered.map(unit=>{
            const index=units.findIndex(u=>u.id===unit.id);
            const expanded=openUnits.includes(unit.id);
            const unitDone=unit.lessons.filter(l=>completed.has(l.id)).length;
            return <div className={s.unit} key={unit.id}><h3><button type="button" aria-expanded={expanded} aria-controls={`course-unit-${unit.id}`} onClick={()=>setOpenUnits(previous=>previous.includes(unit.id)?previous.filter(id=>id!==unit.id):[...previous,unit.id])} className={s.unitToggle}><span className={`${s.unitIndex} ${course.enrolled&&unitDone===unit.lessons.length?s.unitFinished:''}`}>{course.enrolled&&unitDone===unit.lessons.length?<Check size={18}/>:String(index+1).padStart(2,'0')}</span><span className={s.unitTitle}>{unit.title}<small>{number(unit.lessons.length)} دروس{course.enrolled?` · ${number(unitDone)} مكتمل`:''}</small></span><ChevronDown size={18}/></button></h3><div id={`course-unit-${unit.id}`} hidden={!expanded} className={s.unitBody}>{unit.lessons.map(lesson=>{
              const isDone=completed.has(lesson.id);
              const isNext=course.enrolled&&start?.id===lesson.id&&percent<100;
              const content=<><span className={`${s.lessonIcon} ${isDone?s.lessonDone:''}`}>{isDone?<Check size={16}/>:accessible&&lesson.youtubeId?<Play size={14}/>:<BookOpen size={15}/>}</span><span className={s.lessonTitle}>{lesson.title}<small>{lesson.duration?duration(lesson.duration):'على مهلك'}{isDone&&<span>مكتمل</span>}{isNext&&<span className={s.nextTag}>خطوتك الجاية</span>}</small></span>{accessible?<ArrowLeft className={s.lessonArrow} size={17}/>:<LockKeyhole size={14} className={s.lock}/>}</>;
              return accessible?<Link key={lesson.id} className={`${s.lesson} ${isNext?s.nextLesson:''}`} href={preview?`/admin/academy/${course.id}/preview/${lesson.id}`:`/student/academy/${course.id}/learn/${lesson.id}`}>{content}</Link>:<div key={lesson.id} className={s.lesson}>{content}</div>;
            })}</div></div>;
          })}</div>
          {!units.length&&<div className={s.emptyCurriculum}><Layers3 size={26}/><h3>المنهج بيتجهّز.</h3><p>الدروس هتظهر هنا أول ما تكون متاحة.</p></div>}
          {!accessible&&course.lessons.length>0&&<p className={s.unlockNote}><LockKeyhole size={14}/>سجّل في الكورس عشان تفتح الدروس وتبدأ رحلتك.</p>}
        </section>
      </div>
      <aside className={s.aside}>
        <section id="course-audience" tabIndex={-1} className={s.audience}><span className={s.cardIcon}><GraduationCap size={23}/></span><span className={s.kicker}>قبل ما تاخد أول خطوة</span><h2>الكورس ده ليك؟</h2><LessonCopy text={course.audience||'وصف الجمهور المناسب بيتجهّز.'}/>{course.prerequisites&&<div className={s.prerequisites}><h3><CheckCheck size={17}/>تحتاج إيه قبل البداية؟</h3><LessonCopy text={course.prerequisites}/></div>}</section>
        {course.instructor&&<section id="course-instructor" tabIndex={-1} className={s.instructor}><div className={s.instructorTop}><span className={s.instructorAvatar}>{course.instructor.trim()[0]}</span><ArrowUpLeft size={22}/></div><small>معاك في الرحلة</small><h2>{course.instructor}</h2>{course.instructorBio&&<LessonCopy text={course.instructorBio}/>}</section>}
        <section className={s.learningNote}><span className={s.noteHeading}><Sparkles size={18}/>تعلّم بإيقاعك.</span><p>ابدأ باللي يناسب وقتك، وارجع لأي درس لما تحتاجه. بعد كل خطوة، علّم الدرس مكتمل وشوف تقدّمك يكبر.</p><div><span>افهم</span><ArrowLeft size={13}/><span>جرّب</span><ArrowLeft size={13}/><span>كمّل</span></div></section>
      </aside>
    </div>
    <section className={s.closing}><div><span className={s.kicker}>{course.enrolled?'مكانك في الرحلة محفوظ.':'الفضول أول خطوة.'}</span><h2>{percent===100?'كل مراجعة، فهم أعمق.':course.enrolled?'خطوة صغيرة، تكمّل اللي بدأته.':'جاهز تحوّل الفكرة لفهم؟'}</h2><p>{course.enrolled?'ارجع لدروسك، وكمّل من المكان اللي وقفت عنده.':'ابدأ الكورس مجانًا، وخلّي أول درس هو خطوتك الجاية.'}</p></div>{action(true)}</section>
  </div>;
}
