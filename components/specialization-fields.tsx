"use client";
import { Course, Profile } from "@/lib/curriculum";
import { specializationSlots, sportsFor, type Specializations } from "@/lib/specializations";
export function SportSelect({course,value,onChange,disabled=false}:{course:Course;value:string;onChange:(id:string)=>void;disabled?:boolean}) {
  return <label className="field-label" data-specialization-slot={course.id}>{course.title.includes("فرد") ? "رياضتك الفردية" : "رياضتك الجماعية"}<select aria-label={course.title.includes("فرد") ? "رياضتك الفردية" : "رياضتك الجماعية"} value={value} disabled={disabled} onChange={e=>onChange(e.target.value)}><option value="">اختار الرياضة…</option>{sportsFor(course).map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select></label>;
}
export function SpecializationFields({profile,choices,onChange,disabled=false}:{profile:Profile;choices:Specializations;onChange:(courseId:string,sportId:string)=>void;disabled?:boolean}) {
  const slots=specializationSlots(profile); if(!slots.length) return null;
  return <fieldset className="auth-path specialty-fields"><legend>رياضات التخصص</legend><div className="specialty-grid">{slots.map(course=><SportSelect key={course.id} course={course} value={choices[course.id] || ""} onChange={sportId=>onChange(course.id,sportId)} disabled={disabled}/>)}</div><small>اختار حسب توزيعك في الكلية. الاختيار هنا ينظّم محتواك داخل المنصة، ويمكنك إكماله لاحقًا.</small></fieldset>;
}
