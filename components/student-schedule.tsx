"use client";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, ArrowUpLeft, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Coffee, ExternalLink, Info, LayoutGrid, List, MapPin, Printer, Search, Sparkles, Sun, UserRound, X } from "lucide-react";
import { catalog } from "@/lib/catalog";
import { profileLabel, SCHEDULE_SOURCE } from "@/lib/curriculum";
import { scheduleTime, scheduleTimeRange, scheduleNote } from "@/lib/schedule-time";
import { agendaSearch, breakLabel, cairoClock, nextSession, sessionState, timeMinutes, weekDates } from "@/lib/schedule-agenda";
import { chosenCourse } from "@/lib/specializations";
import type { ScheduleEntry, StudentData } from "@/lib/domain";
import styles from "./student-schedule.module.css";

export const DAYS=["السبت","الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة"];
const SHORT_DAYS=["سبت","أحد","اثنين","ثلاثاء","أربعاء","خميس","جمعة"];
type Kind="all"|"lecture"|"practical";

export default function StudentSchedule({data,renderedAt,onGroupChange}:{data:StudentData;renderedAt:string;onGroupChange:(group?:number)=>Promise<boolean>}) {
  const [savingGroup,setSavingGroup]=useState(false);
  const [now,setNow]=useState(()=>new Date(renderedAt));
  const [selected,setSelected]=useState<number|null>(null);
  const [weekOffset,setWeekOffset]=useState(0);
  const [view,setView]=useState<"day"|"week">("day");
  const [kind,setKind]=useState<Kind>("all");
  const [query,setQuery]=useState("");
  const [searchOpen,setSearchOpen]=useState(false);
  const searchRef=useRef<HTMLInputElement>(null);
  const dayRefs=useRef<(HTMLButtonElement|null)[]>([]);
  const agendaRef=useRef<HTMLElement>(null);
  const schedule=data.schedule;
  const today=cairoClock(now);
  const day=selected ?? today.day;
  const dates=weekDates(now).map(date=>new Date(date.getTime()+weekOffset*7*86400000));
  const entries=useMemo(()=>(schedule?.entries || []).slice().sort((a,b)=>a.day-b.day || a.start.localeCompare(b.start)),[schedule]);
  const upcoming=nextSession(entries,now);
  const filtered=entries.filter(e=>(kind==="all" || e.kind===kind) && (!query || agendaSearch(`${e.title} ${catalog.find(c=>c.id===e.courseId)?.title || ""} ${e.location} ${e.instructor}`,query)));
  const daily=filtered.filter(e=>e.day===day);
  const rawDaily=entries.filter(e=>e.day===day);
  const studyDays=new Set(entries.map(e=>e.day)).size;
  const month=new Intl.DateTimeFormat("ar-EG",{month:"long",timeZone:"UTC"}).format(dates[day]);
  const dateLabel=new Intl.DateTimeFormat("ar-EG",{day:"numeric",month:"long",timeZone:"UTC"}).format(dates[day]);
  const todayDate=new Intl.DateTimeFormat("ar-EG",{day:"numeric",month:"long",timeZone:"Africa/Cairo"}).format(now);
  const allFinished=weekOffset===0 && day===today.day && rawDaily.length>0 && rawDaily.every(e=>sessionState(e,now)==="past");

  useEffect(()=>{const tick=setInterval(()=>setNow(new Date()),30000);return ()=>clearInterval(tick);},[]);
  useEffect(()=>{if(searchOpen)searchRef.current?.focus();},[searchOpen]);
  function selectDay(value:number,focus=false){setSelected(value);setView("day");if(focus)dayRefs.current[value]?.focus();}
  function jumpToDay(value:number,offset=weekOffset){setWeekOffset(offset);setKind("all");setQuery("");setSearchOpen(false);selectDay(value);requestAnimationFrame(()=>agendaRef.current?.scrollIntoView({behavior:"smooth",block:"start"}));}
  const nextTitle=upcoming?entryTitle(upcoming.entry,data):"";

  return <div className={styles.agenda} data-agenda-view={view}>
    <header className={styles.hero}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}><span/>أسبوعك، على إيقاعك</p>
        <div className={styles.titleRow}><h1>كل يوم،<br/><span>خطوة لقدّام.</span></h1><div className={styles.dateStamp} aria-label={`اليوم ${DAYS[today.day]} ${todayDate}`}><CalendarDays size={16}/><strong>{today.date}</strong><small>{new Intl.DateTimeFormat("ar-EG",{month:"short",timeZone:"Africa/Cairo"}).format(now)}</small></div></div>
        <p className={styles.profile}>{profileLabel(data.profile)}</p>
        <div className={styles.term}><span>الترم {data.profile.semester===1?"الأول":"الثاني"}</span>{schedule && <><i/><bdi>{schedule.academicYear}</bdi></>}</div>
      </div>
      {schedule && upcoming ? <article className={styles.nextCard} data-next-session={upcoming.entry.id}>
        <div className={styles.nextTop}><span className={styles.nextBadge}><span/>{upcoming.live?"محاضرتك دلوقتي":"خطوتك الجاية"}</span><span className={styles.nextDay}>{upcoming.daysAway===0?"النهارده":upcoming.daysAway===1?"بكرة":DAYS[upcoming.entry.day]}{upcoming.daysAway===7?" الجاي":""}</span></div>
        <div className={styles.nextBody}><div><h2 title={nextTitle}>{nextTitle}</h2><p><MapPin size={14}/>{upcoming.entry.location || "المكان لم يُحدد"}</p></div><div className={styles.nextTime}><strong dir="ltr">{scheduleTime(upcoming.entry.start).split(" ")[0]}</strong><span>{scheduleTime(upcoming.entry.start).endsWith("ص")?"صباحًا":"مساءً"}</span></div></div>
        <div className={styles.nextFooter}><span><Clock3 size={13}/><bdi>{scheduleTimeRange(upcoming.entry.start,upcoming.entry.end,upcoming.entry.timeLabel)}</bdi></span><button onClick={()=>jumpToDay(upcoming.entry.day,Math.floor((today.day+upcoming.daysAway)/7))}>شوف اليوم <ArrowLeft size={16}/></button></div>
        <span className={styles.cardOrbit} aria-hidden="true"/>
      </article> : <div className={styles.emptyHero}><CalendarDays size={52} strokeWidth={1}/><span>مساحة ليوم أوضح.</span><Sparkles size={20}/></div>}
    </header>

    {!schedule ? <section className={styles.unpublished}><span className={styles.emptyMark}><CalendarDays size={32}/></span><h2>أسبوعك لسه بيتجهّز.</h2><p>بمجرد نشر جدول مسارك، هتلاقي كل محاضرة وميعادها ومكانها هنا.</p><a className="button outline-button" href={SCHEDULE_SOURCE} target="_blank" rel="noreferrer">جداول الكلية <ExternalLink size={15}/></a></section> : <>
      {!!schedule.classGroupOptions?.length&&<section className={styles.groupChoice} aria-label="اختيار شعبة العملي"><div><strong>{data.profile.classGroup?`جدول شعبة ${data.profile.classGroup}`:'اختار شعبتك عشان يظهر العملي.'}</strong><p>{data.profile.classGroup?'المواعيد المعروضة تشمل النظري وعملي مجموعتك.':'النظري ظاهر للجميع. رقم شعبتك بيحدد مواعيد العملي.'}</p></div><label>رقم الشعبة<select aria-label="شعبتي في الجدول" value={data.profile.classGroup||''} disabled={savingGroup} onChange={async e=>{setSavingGroup(true);try{await onGroupChange(e.target.value?Number(e.target.value):undefined);}finally{setSavingGroup(false);}}}><option value="">النظري فقط — لم أختر بعد</option>{schedule.classGroupOptions.map(group=><option key={group} value={group}>شعبة {group}</option>)}</select></label></section>}
      <section className={styles.weekPulse} aria-label="ملخص أسبوعك"><div><strong>{entries.length}</strong><span>جلسة في الأسبوع</span></div><div><strong>{entries.filter(e=>e.kind==="practical").length}</strong><span>تطبيق عملي</span></div><div><strong>{studyDays}</strong><span>أيام دراسة</span></div><span className={styles.pulseWord} aria-hidden="true">MAKE YOUR NEXT MOVE ↗</span></section>
      <section className={styles.calendarShell}>
        <div className={styles.calendarTop}><div><p className={styles.miniLabel}>خطّط لخطوتك</p><h2>{month} <span>{dates[day].getUTCFullYear()}</span></h2></div><div className={styles.calendarActions}><button className={styles.weekArrow} aria-label="الأسبوع السابق" onClick={()=>setWeekOffset(value=>value-1)}><ChevronRight size={15}/></button><button className={styles.todayButton} aria-label="العودة إلى اليوم" onClick={()=>{setSelected(null);setWeekOffset(0);setView("day");setQuery("");setKind("all");}}><Sun size={15}/>النهارده</button><button className={styles.weekArrow} aria-label="الأسبوع التالي" onClick={()=>setWeekOffset(value=>value+1)}><ChevronLeft size={15}/></button></div></div>
        <nav className={styles.dayRail} aria-label="أيام المحاضرات">{DAYS.map((name,i)=>{const count=entries.filter(e=>e.day===i).length;return <button ref={node=>{dayRefs.current[i]=node;}} key={name} className={`${styles.dayButton} ${day===i?styles.daySelected:""} ${weekOffset===0 && today.day===i?styles.isToday:""}`} aria-pressed={day===i} aria-label={`${name}، ${dates[i].getUTCDate()} ${new Intl.DateTimeFormat("ar-EG",{month:"long",timeZone:"UTC"}).format(dates[i])}، ${count} محاضرة`} onClick={()=>selectDay(i)} onKeyDown={event=>{let next=i;if(event.key==="ArrowLeft")next=(i+1)%7;else if(event.key==="ArrowRight")next=(i+6)%7;else if(event.key==="Home")next=0;else if(event.key==="End")next=6;else return;event.preventDefault();selectDay(next,true);}}><span>{SHORT_DAYS[i]}</span><strong>{dates[i].getUTCDate()}</strong><span className={styles.dayDots} aria-hidden="true">{count?Array.from({length:Math.min(count,4)},(_,n)=><i key={n}/>):<i className={styles.noSession}/>}</span></button>;})}</nav>
      </section>
      <section ref={agendaRef} className={styles.content} aria-label="مواعيد المحاضرات">
        <div className={styles.toolbar}><div className={styles.viewToggle} aria-label="طريقة عرض الجدول"><button className={view==="day"?styles.toggleActive:""} aria-pressed={view==="day"} onClick={()=>setView("day")}><List size={15}/>يومي</button><button className={view==="week"?styles.toggleActive:""} aria-pressed={view==="week"} onClick={()=>setView("week")}><LayoutGrid size={14}/>الأسبوع</button></div><div className={styles.tools}><button className={searchOpen?styles.toolActive:""} aria-label="البحث في جدول الأسبوع" aria-expanded={searchOpen} onClick={()=>{setSearchOpen(!searchOpen);setQuery("");if(!searchOpen)setView("week");}}><Search size={18}/></button><button aria-label="طباعة عرض الجدول" onClick={()=>window.print()}><Printer size={18}/></button></div></div>
        {searchOpen && <label className={styles.search}><Search size={17}/><input ref={searchRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="مادة، مكان، أو محاضر…" aria-label="البحث في الجدول"/><button aria-label="إغلاق البحث" onClick={()=>{setSearchOpen(false);setQuery("");}}><X size={17}/></button></label>}
        <div className={styles.dayHeading}><div><p className={styles.miniLabel}>{view==="week"?"الصورة الكاملة":weekOffset===0 && day===today.day?"يومك، خطوة بخطوة":"خطة يومك"}</p><h2>{view==="week"?"أسبوعك في نظرة.":DAYS[day]}<span>{view==="week"?`${filtered.length} جلسة`:dateLabel}</span></h2></div>{view==="day" && <div className={styles.dayArrows}><button aria-label="اليوم السابق" onClick={()=>selectDay((day+6)%7)}><ChevronRight size={17}/></button><button aria-label="اليوم التالي" onClick={()=>selectDay((day+1)%7)}><ChevronLeft size={17}/></button></div>}</div>
        <div className={styles.filters} aria-label="نوع المحاضرات">{[["all","الكل"],["lecture","نظري"],["practical","عملي"]].map(([id,title])=><button key={id} aria-pressed={kind===id} className={kind===id?styles.filterActive:""} onClick={()=>setKind(id as Kind)}><i className={id==="practical"?styles.practicalDot:id==="lecture"?styles.theoryDot:styles.allDot}/>{title}<span>{entries.filter(e=>(view==="week" || e.day===day) && (id==="all" || e.kind===id)).length}</span></button>)}</div>
        {view==="day" ? <>
          {daily.length ? <div className={styles.timeline}>{daily.map((entry,index)=>{const next=daily[index+1];const gap=next?timeMinutes(next.start)-timeMinutes(entry.end):0;return <Fragment key={entry.id}><TimelineSession entry={entry} data={data} now={now} weekOffset={weekOffset} index={index}/>{gap>=30 && kind==="all" && !query && !entry.timeLabel && <div className={styles.breakRow}><span/><p><Coffee size={14}/>فاصل في الجدول <b>{breakLabel(gap)}</b></p></div>}</Fragment>;})}</div> : <EmptyDay day={day} note={schedule.dayNotes?.[String(day)]} filtered={kind!=="all" || !!query} onReset={()=>{setKind("all");setQuery("");}} onWeek={()=>setView("week")}/>}
          {allFinished && daily.length>0 && <div className={styles.doneNote}><span><Check size={18}/></span><div><strong>محاضرات النهارده خلصت.</strong><p>باقي اليوم ليك. خُد خطوة صغيرة في مراجعتك.</p></div><Link href="/student/library">افتح مكتبتك <ArrowUpLeft size={17}/></Link></div>}
        </> : <>
          {filtered.length ? <div className={styles.weekGrid}>{DAYS.map((name,i)=>{const rows=filtered.filter(e=>e.day===i);if(!rows.length)return null;return <section className={`${styles.weekDay} ${weekOffset===0 && i===today.day?styles.weekToday:""}`} key={name}><button className={styles.weekDayTitle} onClick={()=>jumpToDay(i)}><span><b>{name}</b><small>{dates[i].getUTCDate()} {new Intl.DateTimeFormat("ar-EG",{month:"short",timeZone:"UTC"}).format(dates[i])}</small></span><span>{rows.length} جلسة <ArrowUpLeft size={17}/></span></button><div className={styles.weekRows}>{rows.map(entry=><WeekSession key={entry.id} entry={entry} data={data} now={now} weekOffset={weekOffset}/>)}</div></section>;})}</div> : <EmptyDay day={day} filtered onReset={()=>{setKind("all");setQuery("");}} onWeek={()=>setView("day")}/>}
          {!query && kind==="all" && <div className={styles.freeDays}><Sun size={17}/><span>أيام بدون محاضرات معروضة</span>{DAYS.filter((_,i)=>!entries.some(e=>e.day===i)).map(name=><span className={styles.freeDay} key={name}>{name}</span>)}</div>}
        </>}
        <footer className={styles.legend}><span><i className={styles.theoryDot}/>نظري</span><span><i className={styles.practicalDot}/>عملي</span><span><i className={styles.liveDot}/>المحاضرة الحالية</span><span>كل المواعيد بتوقيت مصر</span></footer>
      </section>
    </>}
  </div>;
}

function entryTitle(entry:ScheduleEntry,data:StudentData){const base=catalog.find(c=>c.id===entry.courseId);return entry.title || (base?chosenCourse(base,data.specializations).title:"نشاط دراسي");}
function GroupNote({entry}:{entry:ScheduleEntry}){if(!entry.notes&&!entry.classGroups?.length)return null;return <>{!!entry.classGroups?.length&&<p className={styles.classGroupBadge}>الشُعب <bdi>{Math.min(...entry.classGroups)}–{Math.max(...entry.classGroups)}</bdi></p>}{entry.notes&&<details className={styles.groupNote}><summary><Info size={13}/>تفاصيل المجموعة<ChevronDown size={13}/></summary><p>{scheduleNote(entry.notes)}</p></details>}</>;}

function TimelineSession({entry,data,now,index,weekOffset}:{entry:ScheduleEntry;data:StudentData;now:Date;index:number;weekOffset:number}){
  const state=weekOffset===0?sessionState(entry,now):weekOffset<0?"past":"upcoming";const base=catalog.find(c=>c.id===entry.courseId);const label=entryTitle(entry,data);const [time,period]=scheduleTime(entry.start).split(" ");
  return <article className={`${styles.timelineRow} ${entry.kind==="practical"?styles.practical:""} ${state==="live"?styles.live:""} ${state==="past"?styles.past:""}`} data-session-id={entry.id}>
    <div className={styles.timeAxis}><span className={styles.axisDot}/><strong dir="ltr">{time}</strong><small>{period==="ص"?"صباحًا":"مساءً"}</small>{state==="past" && <Check size={13}/>}</div>
    <div className={styles.sessionCard}><div className={styles.sessionTop}><span className={styles.sessionKind}>{entry.kind==="practical"?<Activity size={13}/>:<CalendarDays size={13}/>} {entry.kind==="practical"?"تطبيق عملي":"محاضرة نظرية"}</span>{state==="live"?<span className={styles.liveLabel}><i/>دلوقتي</span>:state==="group"?<span className={styles.groupLabel}>حسب المجموعة</span>:<span className={styles.sessionNumber}>{String(index+1).padStart(2,"0")}</span>}</div><h3>{base?<Link href={`/student/courses/${entry.courseId}`}>{label}<ArrowUpLeft size={17}/></Link>:label}</h3><div className={`${styles.sessionTime} lecture-time`}><Clock3 size={13}/><bdi>{scheduleTimeRange(entry.start,entry.end,entry.timeLabel)}</bdi></div><div className={styles.sessionPlace}><MapPin size={15}/><span>{entry.location || "المكان لم يُحدد"}</span>{entry.instructor && <span className={styles.instructor}><UserRound size={13}/>{entry.instructor}</span>}</div><GroupNote entry={entry}/></div>
  </article>;
}
function WeekSession({entry,data,now,weekOffset}:{entry:ScheduleEntry;data:StudentData;now:Date;weekOffset:number}){
  const base=catalog.find(c=>c.id===entry.courseId);const state=weekOffset===0?sessionState(entry,now):weekOffset<0?"past":"upcoming";
  return <article className={`${styles.weekSession} ${entry.kind==="practical"?styles.practical:""} ${state==="live"?styles.live:""}`} data-session-id={entry.id}><div className={styles.weekSessionTop}><span className={`${styles.weekTime} lecture-time`}><bdi>{scheduleTimeRange(entry.start,entry.end,entry.timeLabel)}</bdi></span><span className={styles.weekKind}>{entry.kind==="practical"?"عملي":"نظري"}</span></div><h3>{base?<Link href={`/student/courses/${entry.courseId}`}>{entryTitle(entry,data)}</Link>:entryTitle(entry,data)}</h3><p className={styles.weekPlace}><MapPin size={13}/>{entry.location || "المكان لم يُحدد"}</p><GroupNote entry={entry}/></article>;
}
function EmptyDay({day,note,filtered,onReset,onWeek}:{day:number;note?:string;filtered?:boolean;onReset:()=>void;onWeek:()=>void}){
  return <div className={styles.emptyDay}><div className={styles.emptyArt}><span/><Sun size={39} strokeWidth={1.4}/><i>✳</i></div><span className={styles.miniLabel}>{filtered?"نجرّب اختيار تاني؟":DAYS[day]}</span><h3>{filtered?"مفيش محاضرات بالاختيار ده.":"يوم أخف. مساحة ليك."}</h3><p>{filtered?"غيّر نوع المحاضرة أو كلمة البحث وشوف باقي المواعيد.":note?.includes("ظاهرة")?"مفيش محاضرات ظاهرة لليوم ده في جدولك.":"مفيش محاضرات معروضة لليوم ده. استغل المساحة على مزاجك."}</p><button onClick={filtered?onReset:onWeek}>{filtered?"عرض كل المحاضرات":"شوف خطة الأسبوع"}<ArrowLeft size={16}/></button></div>;
}
