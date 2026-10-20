import type {User,Lesson,Schedule} from './domain';
import type {AdminLearning} from './academic-domain';

export type OverviewCourse={id:string;title:string;status:'draft'|'published'|'archived';updatedAt:string;lessons:number;publishedLessons:number;enrollments:number};
export type AdminOverviewSnapshot={generatedAt:string;academicCompletions:number;academy:{courses:number;published:number;drafts:number;lessons:number;publishedLessons:number;draftLessons:number;enrollments:number;completions:number;recent:OverviewCourse[];nextDraft:{id:string;courseId:string;title:string}|null}};
export type OverviewInput={users:User[];lessons:Lesson[];learning:AdminLearning;schedules:Schedule[];overview:AdminOverviewSnapshot};
export type OverviewTask={id:string;title:string;detail:string;count:number;href:string;group:'content'|'teaching'};
export const overviewNumber=(value:number)=>value.toLocaleString('ar-EG');
export function overviewTime(value:string){return Number.isFinite(Date.parse(value))?new Intl.DateTimeFormat('ar-EG',{timeZone:'Africa/Cairo',day:'numeric',month:'short',hour:'numeric',minute:'2-digit',hour12:true}).format(new Date(value)):'—';}
export function overviewTasks(data:OverviewInput):OverviewTask[]{
 const drafts=data.lessons.filter(l=>l.status==='draft').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));const academy=data.overview.academy;
 return [
  {id:'reviews',title:'تسليمات تنتظر المراجعة',detail:'راجع شغل الطلاب وأضف الدرجة أو الملاحظات.',count:data.learning.submissions.filter(s=>s.status==='submitted').length,href:'/admin/assignments',group:'teaching' as const},
  {id:'lessons',title:'مسودات دروس المواد',detail:drafts[0]?.title||'ارجع للفكرة اللي بتجهّزها.',count:drafts.length,href:drafts[0]?`/admin/content/${drafts[0].id}/edit`:'/admin/content',group:'content' as const},
  {id:'academy-lessons',title:'مسودات دروس الكورسات',detail:academy.nextDraft?.title||'كمّل الدروس وقت ما تكون جاهز.',count:academy.draftLessons,href:academy.nextDraft?`/admin/academy/${academy.nextDraft.courseId}/lessons/${academy.nextDraft.id}/edit`:'/admin/academy',group:'content' as const},
  {id:'academy',title:'كورسات تحت التجهيز',detail:'افتح مساحة الكورس وكمّل رحلته.',count:academy.drafts,href:'/admin/academy?status=draft',group:'content' as const},
  {id:'library',title:'موارد مكتبة غير منشورة',detail:'كتب وملخصات حفظتها للمراجعة.',count:data.learning.resources.filter(x=>x.status==='draft').length,href:'/admin/library',group:'content' as const},
  {id:'assignments',title:'مسودات تكليفات',detail:'ارجع للتكليفات قبل إتاحتها للطلاب.',count:data.learning.assignments.filter(x=>x.status==='draft').length,href:'/admin/assignments',group:'teaching' as const},
  {id:'exams',title:'مسودات اختبارات',detail:'راجع الأسئلة والتوقيت وقت ما يناسبك.',count:data.learning.exams.filter(x=>x.status==='draft').length,href:'/admin/exams',group:'teaching' as const},
  {id:'schedules',title:'جداول محاضرات غير منشورة',detail:'راجع المواعيد قبل نشر الجدول.',count:data.schedules.filter(x=>x.status==='draft').length,href:'/admin/schedule',group:'teaching' as const}
 ].filter(task=>task.count>0);
}
function cairoDay(value:string){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));return ['year','month','day'].map(key=>parts.find(p=>p.type===key)!.value).join('-');}
export function overviewRegistrations(users:User[],at:string){
 const end=new Date(cairoDay(at)+'T12:00:00Z');const days=Array.from({length:7},(_,i)=>{const date=new Date(end);date.setUTCDate(date.getUTCDate()-6+i);return {key:cairoDay(date.toISOString()),label:new Intl.DateTimeFormat('ar-EG',{weekday:'short',timeZone:'Africa/Cairo'}).format(date),date:new Intl.DateTimeFormat('ar-EG',{day:'numeric',month:'short',timeZone:'Africa/Cairo'}).format(date),count:0};});
 for(const user of users){if(user.role!=='student'||!Number.isFinite(Date.parse(user.createdAt)))continue;const day=days.find(d=>d.key===cairoDay(user.createdAt));if(day)day.count++;}return days;
}
export const OVERVIEW_ACTIONS:Record<string,string>={update_library_status:'تغيير حالة نشر موارد المكتبة',update_student_account:'تحديث بيانات طالب',reset_student_password:'تغيير كلمة مرور طالب',revoke_student_sessions:'إنهاء جلسات طالب',delete_student_account:'حذف حساب طالب',create_academy:'إنشاء كورس',update_academy:'تحديث كورس أو منهجه',save_academy_lesson:'حفظ درس كورس',delete_academy:'حذف كورس',update_settings:'تحديث إعدادات المنصة',update_admin_account:'تحديث حساب الإدارة',change_admin_password:'تغيير كلمة مرور الإدارة',save_library:'نشر أو تعديل مورد',delete_library:'حذف مورد',save_assignments:'حفظ تكليف',delete_assignments:'حذف تكليف',review_submission:'مراجعة تسليم',save_exams:'حفظ اختبار',delete_exams:'حذف اختبار',save_schedule:'حفظ جدول محاضرات',import_user_schedule:'إضافة جدول محاضرات',setup_admin:'إعداد حساب الإدارة',register_student:'تسجيل طالب',create_lesson:'إضافة درس',update_lesson:'تعديل درس',delete_lesson:'حذف درس',activate_student:'تفعيل طالب',suspend_student:'إيقاف طالب'};
export function overviewActionGroup(action:string){return /student|admin_account|admin_password|setup_admin/.test(action)?'people':action==='update_settings'?'settings':'content';}
