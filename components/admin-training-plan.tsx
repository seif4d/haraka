"use client";
import { BookOpen, ArrowUpLeft } from "lucide-react";
import type { TrainingPlan } from "@/lib/training-plan";
import type { Lesson } from "@/lib/domain";
import LessonCopy from "./lesson-copy";
import styles from "./admin-training-plan.module.css";

export default function AdminTrainingPlan({plan,lessons,onEdit,defaultOpen=false}:{defaultOpen?:boolean;plan:TrainingPlan;lessons:Lesson[];onEdit:(lesson:Lesson)=>void}){
  const written=plan.units.flatMap(u=>u.lessons).filter(l=>l.written).length;
  const total=plan.units.reduce((n,u)=>n+u.lessons.length,0);
  return <details className={styles.plan} data-training-plan open={defaultOpen}><summary><span className={styles.icon}><BookOpen size={22}/></span><span><small>خريطة التأليف · تانية، ترم أول · بنين وبنات</small><strong>{plan.title}</strong></span><span className={styles.count}><b dir="ltr">{written} / {total}</b><small>دروس مكتوبة</small></span></summary><div className={styles.content}>
    <div className={styles.intro}><span className="tag lilac">٥ وحدات · {plan.status}</span><LessonCopy text={plan.intro}/><h3>قبل البداية</h3><LessonCopy text={plan.prerequisites}/></div>
    {plan.units.map(unit=><details className={styles.unit} key={unit.order} open={unit.order===1}><summary><span>{String(unit.order).padStart(2,"0")}</span><strong>{unit.title}</strong><small>{unit.lessons.length} دروس</small></summary><div className={styles.unitBody}><p>{unit.question}</p><ol>{unit.lessons.map(item=>{
      const copies=(["boys","girls"] as const).map(gender=>({gender,lesson:lessons.find(l=>l.id===`${item.sourceId}-${gender}`)}));
      return <li key={item.sourceId}><span className={styles.number}>{String(item.position).padStart(2,"0")}</span><div><h4>{item.title}</h4><p>{item.goal}</p><small>مطبوعة / PDF: {item.pages} · {item.needs}</small><div className={styles.actions}>{item.written?copies.map(({gender,lesson})=>lesson?<button className="button outline-button" key={gender} onClick={()=>onEdit(lesson)}>{gender==="boys"?"بنين":"بنات"} · {lesson.status==="published"?"منشور":"مسودة"}<ArrowUpLeft size={14}/></button>:<span className="tag" key={gender}>{gender==="boys"?"بنين":"بنات"} · غير مضاف</span>):<span className="tag">مخطط · لم يُكتب بعد</span>}</div></div></li>;
    })}</ol><a href={unit.sourceUrl} target="_blank" rel="noreferrer">مرجع الوحدة للمراجع <ArrowUpLeft size={14}/></a></div></details>)}
    <details className={styles.notes}><summary>بيانات المصدر وما تبقّى من التأليف</summary><p>{plan.author} · الطبعة {plan.edition} · الإيداع {plan.deposit}</p><LessonCopy text={plan.productionNotes}/><p>{plan.remaining}</p><small>الخريطة وملاحظات التحرير تظهر للإدارة فقط. نشر الدروس يتم من محرر كل درس بعد المراجعة.</small></details>
  </div></details>;
}
