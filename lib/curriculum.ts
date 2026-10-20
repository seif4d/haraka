export type Track = "general" | "teaching" | "training" | "management";
export type Gender = "boys" | "girls";
export type Profile = { name: string; year: number; gender: Gender; track: Track; semester: number; classGroup?:number };
export type Course = {
  id: string;
  title: string;
  kind: "academic" | "practical" | "elective" | "field";
  sourceYear: string;
  source: "lectures" | "exams";
  description: string;
  accent: "lime" | "lilac" | "peach" | "blue";
};
export type LocalLesson = {
  id: string;
  courseId: string;
  title: string;
  intro: string;
  body: string;
  youtubeUrl: string;
  createdAt: string;
};

export const DEFAULT_PROFILE: Profile = { name: "", year: 4, gender: "boys", track: "training", semester: 1 };
export const TRACKS: Record<Track, string> = {
  general: "إعداد عام", teaching: "تدريس", training: "تدريب", management: "إدارة",
};
export const YEARS = ["", "الأولى", "الثانية", "الثالثة", "الرابعة"];
export const SCHEDULE_SOURCE = "https://aun.edu.eg/physical_education/ar/stu/study%20schedules";
export const SCIENCE_SOURCE = "https://openstax.org/books/university-physics-volume-1/pages/10-6-torque";

const common: Record<string, string[]> = {
  "1-1": ["فلسفة وتاريخ التربية الرياضية", "مقدمة في الإدارة الرياضية", "التشريح الوصفي", "اللغة الإنجليزية"],
  "1-2": ["الإحصاء التطبيقي", "حقوق الإنسان", "فسيولوجيا الإنسان", "مدخل علم النفس الرياضي", "مبادئ علم الحركة"],
  "2-1": ["مبادئ التدريب الرياضي", "فسيولوجيا الرياضة", "أساسيات المناهج", "الحاسب الآلي"],
  "2-2": ["التشريح الوظيفي", "الرياضة وصحة المجتمع", "مبادئ الترويح الرياضي", "مبادئ التدريس", "الحاسب الآلي"],
  "3-1-teaching": ["برامج التربية الرياضية", "طرق تدريس التربية الرياضية", "مهارات التدريس والتربية العملية الداخلية", "اللياقة البدنية", "علم النفس الرياضي", "إدارة المسابقات الرياضية", "مبادئ كرة الطائرة"],
  "3-1-training": ["التدريب الرياضي 1", "فسيولوجيا الرياضة 2", "علم الحركة", "اللياقة البدنية", "المهارات والتربية العملية الداخلية", "إدارة المسابقات الرياضية"],
  "3-1-management": ["الأسس العلمية للإدارة الرياضية", "إدارة المؤسسات الرياضية", "إدارة المسابقات الرياضية", "مهارات الإدارة والتربية العملية", "علم الاجتماع", "اللياقة البدنية", "التربية العملية الداخلية"],
  "4-1-teaching": ["مناهج التربية الرياضية", "مبادئ التحليل الحركي", "التعلم الحركي", "التربية المقارنة", "البحث العلمي ومشكلات التربية المدرسية"],
  "4-1-training": ["التدريب الرياضي 2", "مبادئ التحليل الحركي", "التعلم الحركي", "المنشطات في المجال الرياضي", "البحث العلمي ومشكلات التدريب الرياضي"],
  "4-1-management": ["التنظيمات الرياضية", "التسويق الرياضي", "إدارة المعسكرات الرياضية", "الترويح وأوقات الفراغ", "البحث العلمي"],
};

const thirdSecond = ["أساسيات التقويم في المجال الرياضي", "إصابات الملاعب والإسعافات الأولية", "القيادة في المجال الرياضي", "الوسائل المعينة والأجهزة الرياضية"];
const thirdExtra: Record<Exclude<Track, "general">, string[]> = {
  teaching: ["تربية القوام", "اختياري تدريس الألعاب الجماعية", "اختياري تدريس الرياضات الفردية"],
  training: ["تخطيط التدريب الرياضي", "اختياري الألعاب الجماعية — تدريب", "اختياري الرياضات الفردية — تدريب"],
  management: ["سيكولوجية الجماعات الرياضية", "اختياري إدارة وتحكيم الألعاب الجماعية", "اختياري إدارة وتحكيم الرياضات الفردية"],
};
const fourthExtra: Record<Exclude<Track, "general">, string[]> = {
  teaching: ["التربية الحركية", "مناهج الكشافة والمرشدات", "طرق تدريس التربية الرياضية", "اختياري تدريس الألعاب الجماعية", "اختياري تدريس الرياضات الفردية"],
  training: ["سيكولوجية التدريب", "تقويم برامج التدريب الرياضي", "الميكانيكا الحيوية", "اختياري تدريب الألعاب الجماعية", "اختياري تدريب الرياضات الفردية"],
  management: ["القوانين واللوائح", "الإعلام الرياضي", "التنمية الإدارية في المجال الرياضي", "اختياري إدارة وتحكيم الألعاب الجماعية", "اختياري إدارة وتحكيم الرياضات الفردية"],
};

const introductions: Record<string, string> = {
  "مبادئ التحليل الحركي": "ورا كل حركة تفسير. استكشف القوى والعزوم، وشوف أثرها بنفسك.",
  "التعلم الحركي": "من أول محاولة لإتقان المهارة. مساحة لفهم كيف نتعلم الحركة.",
  "التدريب الرياضي 2": "اربط المعرفة بالتطبيق، ونظّم أفكارك عن التدريب الرياضي.",
  "المنشطات في المجال الرياضي": "مقرر لفهم موضوع المنشطات في سياقه الرياضي والعلمي.",
  "التشريح الوصفي": "تعرّف على لغة الجسم، واستعد لربط البنية بالحركة.",
  "مقدمة في الإدارة الرياضية": "نظّم الفكرة، الفريق، والنشاط. مدخلك لعالم الإدارة الرياضية.",
  "الميكانيكا الحيوية": "افتح باب فهم الحركة من خلال المبادئ الميكانيكية.",
};

function stableId(input: string) {
  let value = 2166136261;
  for (let i = 0; i < input.length; i++) value = Math.imul(value ^ input.charCodeAt(i), 16777619);
  return (value >>> 0).toString(36);
}

export function profileLabel(profile: Profile) {
  return `الفرقة ${YEARS[profile.year]} · ${profile.gender === "boys" ? "بنين" : "بنات"}${profile.year > 2 ? ` · ${TRACKS[profile.track]}` : ""}`;
}

export function classGroupCount(profile: Pick<Profile,"year"|"semester"|"gender">) {
  if(profile.semester!==1)return 0;
  return profile.year===1?20:profile.year===2?(profile.gender==='girls'?12:9):0;
}
export function scheduleGroupRanges(profile: Profile): number[][] {
  if(!classGroupCount(profile))return [];
  if(profile.year===1)return [1,6,11,16].map(start=>Array.from({length:5},(_,i)=>start+i));
  return profile.gender==='boys'?[[1,2],[3,4],[5,6],[7,8,9]]:[[1,2,3],[4,5,6],[7,8,9],[10,11,12],[1,2,3,4,5,6],[7,8,9,10,11,12]];
}

export function normalizeProfile(value: unknown): Profile {
  if (!value || typeof value !== "object") return DEFAULT_PROFILE;
  const candidate = value as Partial<Profile>;
  const year = [1, 2, 3, 4].includes(Number(candidate.year)) ? Number(candidate.year) : 4;
  const track = year < 3 ? "general" : (["teaching", "training", "management"].includes(candidate.track || "") ? candidate.track as Track : "training");
  return { name: typeof candidate.name === "string" ? candidate.name.slice(0, 50) : "", year, gender: candidate.gender === "girls" ? "girls" : "boys", track, semester: Number(candidate.semester) === 2 ? 2 : 1, ...(Number(candidate.semester)!==2&&Number.isInteger(candidate.classGroup)&&Number(candidate.classGroup)>=1&&Number(candidate.classGroup)<=classGroupCount({year,semester:1,gender:candidate.gender==="girls"?"girls":"boys"})?{classGroup:Number(candidate.classGroup)}:{}) };
}

export function coursesFor(profile: Profile): Course[] {
  const p = normalizeProfile(profile);
  const key = `${p.year}-${p.semester}${p.year > 2 ? `-${p.track}` : ""}`;
  let titles = common[key] || [];
  if (p.year === 3 && p.semester === 2) titles = [...thirdSecond, ...thirdExtra[p.track as Exclude<Track, "general">]];
  if (p.year === 4 && p.semester === 2) titles = ["مبادئ تدريب الناشئين", "التغذية للرياضيين", ...fourthExtra[p.track as Exclude<Track, "general">]];
  const entries: { title: string; kind: Course["kind"]; old?: boolean }[] = titles.map(title => ({ title, kind: title.startsWith("اختياري") ? "elective" : "academic" }));
  const practical = (title: string, old = false) => entries.push({ title, kind: "practical", old });
  const elective = (title: string, old = false) => entries.push({ title, kind: "elective", old });
  const field = (title: string, old = false) => entries.push({ title, kind: "field", old });
  if (p.year === 1 && p.semester === 1) ["أساسيات التمرينات", "أساسيات المضمار", "أساسيات المبارزة", p.gender === "boys" ? "أساسيات كرة القدم" : "أساسيات الإيقاع الحركي"].forEach(title => practical(title));
  if (p.year === 1 && p.semester === 2) {
    ["أساسيات السباحة", "أساسيات ألعاب المضرب", "أساسيات الكرة الطائرة", p.gender === "boys" ? "أساسيات المصارعة" : "أساسيات الجمباز الإيقاعي"].forEach(title => practical(title));
    practical("مهارة التدريس — تطبيق", true); practical("اللياقة البدنية — تطبيق", true);
  }
  if (p.year === 2 && p.semester === 1) ["أساسيات كرة السلة", "أساسيات الجمباز", "أساسيات الدفاع عن النفس", p.gender === "boys" ? "أساسيات رفع الأثقال" : "أساسيات التعبير الحركي"].forEach(title => practical(title));
  if (p.year === 2 && p.semester === 2) {
    ["أساسيات مسابقات الميدان", "أساسيات الهوكي", "أساسيات كرة اليد", p.gender === "boys" ? "أساسيات الملاكمة" : "التعبير الحركي"].forEach(title => practical(title));
    practical("مهارات الترويح — تطبيق", true);
  }
  if (p.year === 3 && p.semester === 1) {
    if (p.track === "teaching") {
      elective(p.gender === "boys" ? "تخصصات جماعية — طائرة / هوكي" : "تخصصات جماعية — حسب الاختيار");
      elective(p.gender === "boys" ? "تخصصات فردية — ميدان / سباحة" : "تخصصات فردية — حسب الاختيار");
    } else if (p.track === "management") {
      elective(p.gender === "boys" ? "تخصصات جماعية — سلة / طائرة / قدم" : "تخصصات جماعية — سلة / طائرة");
      elective(p.gender === "boys" ? "تخصصات فردية — دفاع / سباحة / جمباز / ملاكمة" : "تخصصات فردية — دفاع / جمباز / سباحة");
    } else {
      elective("تخصصات جماعية — حسب الاختيار"); elective("تخصصات فردية — حسب الاختيار");
      if (p.gender === "girls") practical("تخصص سباحة");
    }
  }
  if (p.year === 4 && p.semester === 1) {
    field(p.track === "teaching" ? "التدريب الميداني للرياضة المدرسية" : "التدريب الميداني");
    if (p.track === "teaching") {
      elective("تخصصات جماعية — يد / مضرب"); elective("تخصصات فردية — ميدان / سباحة");
    } else if (p.track === "management") {
      elective(p.gender === "boys" ? "تخصصات جماعية — قدم / يد / مضرب" : "تخصصات جماعية — يد / مضرب");
      elective(p.gender === "boys" ? "تخصصات فردية — جمباز / سباحة / ملاكمة / دفاع / مبارزة" : "تخصصات فردية — جمباز إيقاعي / سباحة / مبارزة / ميدان");
    } else {
      elective("تخصصات جماعية — حسب الاختيار"); elective("تخصصات فردية — حسب الاختيار"); practical("تخصص جمباز");
      if (p.gender === "girls") practical("تخصص سباحة");
    }
  }
  if (p.year > 2 && p.semester === 2) {
    field("التدريب الميداني — تطبيق", true);
    if ((p.year === 3 && p.track !== "management" && p.gender === "boys") || (p.year === 4 && p.track === "teaching" && p.gender === "boys") || (p.year === 4 && p.track === "training")) practical("تخصص جمباز — تطبيق", true);
  }
  return entries.map((entry, index) => ({
    id: `course-${stableId(`${key}-${p.gender}-${entry.title}`)}`,
    title: entry.title,
    kind: entry.kind,
    sourceYear: entry.old ? "2024/2025" : "2025/2026",
    source: p.semester === 1 || entry.old ? "lectures" : "exams",
    description: introductions[entry.title] || (entry.kind === "elective" ? "أنشطة تخصصية حسب اختيار الطالب وتوزيع الكلية." : entry.kind === "field" ? "تطبيق ميداني مرتبط بمسارك الدراسي." : "مقررك ودروسه في مكان واحد. الشرح يظهر هنا بعد نشره من الإدارة."),
    accent: (["lime", "lilac", "peach", "blue"] as const)[index % 4],
  }));
}

export function isDemoCourse(course: Course) {
  return course.title === "مبادئ التحليل الحركي";
}

export function youtubeId(input: string): string | null {
  if (!input.trim()) return null;
  try {
    const url = new URL(input);
    if (!["https:", "http:"].includes(url.protocol)) return null;
    let id: string | null = null;
    if (url.hostname === "youtu.be") id = url.pathname.split("/")[1];
    else if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) {
      id = url.searchParams.get("v");
      if (!id && ["embed", "shorts"].includes(url.pathname.split("/")[1])) id = url.pathname.split("/")[2];
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}
