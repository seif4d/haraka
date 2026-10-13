import { Course, Profile, coursesFor } from "./curriculum";
export type Sport = { id: string; title: string; group: "team" | "individual"; aliases: string[] };
export const SPORTS: Sport[] = [
  {id:"football",title:"كرة القدم",group:"team",aliases:["قدم"]},
  {id:"basketball",title:"كرة السلة",group:"team",aliases:["سلة"]},
  {id:"volleyball",title:"الكرة الطائرة",group:"team",aliases:["طائرة"]},
  {id:"handball",title:"كرة اليد",group:"team",aliases:["يد"]},
  {id:"hockey",title:"الهوكي",group:"team",aliases:["هوكي"]},
  {id:"rackets",title:"ألعاب المضرب",group:"team",aliases:["مضرب"]},
  {id:"swimming",title:"السباحة",group:"individual",aliases:["سباحة"]},
  {id:"boxing",title:"الملاكمة",group:"individual",aliases:["ملاكمة"]},
  {id:"track",title:"المضمار",group:"individual",aliases:["مضمار"]},
  {id:"field",title:"مسابقات الميدان",group:"individual",aliases:["ميدان"]},
  {id:"gymnastics",title:"الجمباز",group:"individual",aliases:["جمباز"]},
  {id:"rhythmic",title:"الجمباز الإيقاعي",group:"individual",aliases:["جمباز إيقاعي"]},
  {id:"defense",title:"الدفاع عن النفس",group:"individual",aliases:["دفاع"]},
  {id:"fencing",title:"المبارزة",group:"individual",aliases:["مبارزة"]},
  {id:"wrestling",title:"المصارعة",group:"individual",aliases:["مصارعة"]},
  {id:"weights",title:"رفع الأثقال",group:"individual",aliases:["أثقال"]},
];
export type Specializations = Record<string,string>;
export function sportsFor(course: Course): Sport[] {
  if(course.kind!=="elective") return [];
  const group = course.title.includes("فرد") ? "individual" : "team";
  const choices = SPORTS.filter(s=>s.group===group);
  const named = course.title.includes("/") ? course.title.split("—").pop()!.split("/").map(s=>s.trim()) : [];
  return named.length ? choices.filter(s=>s.aliases.some(alias=>named.includes(alias))) : choices;
}
export function specializationSlots(profile: Profile) {return coursesFor(profile).filter(c=>c.kind==="elective");}
export function chosenCourse(course: Course, choices: Specializations): Course {
  if(course.kind!=="elective") return course;
  const selected = sportsFor(course).find(s=>s.id===choices[course.id]);
  const label = course.title.includes("فرد") ? "تخصص فردي" : "تخصص جماعي";
  return {...course,title:selected ? `${label} · ${selected.title}` : `اختر ${label === "تخصص فردي" ? "تخصصك الفردي" : "تخصصك الجماعي"}`,description:selected ? `اختيارك: ${selected.title}. هنا الشرح المشترك والدروس المرتبطة برياضتك.` : "حدّد الرياضة اللي اخترتها عشان المحتوى يكون مناسب ليك."};
}
export function cohortKey(p: Profile) {return `${p.year}-${p.gender}-${p.track}-${p.semester}`;}
