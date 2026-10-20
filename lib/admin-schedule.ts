import type {ScheduleEntry} from './domain';
export const SCHEDULE_DAYS=['السبت','الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة'];
export function scheduleOverlap(a:ScheduleEntry,b:ScheduleEntry){
 if(a.id===b.id||a.day!==b.day||a.start>=b.end||b.start>=a.end)return false;
 if(a.classGroups?.length&&b.classGroups?.length&&!a.classGroups.some(g=>b.classGroups!.includes(g)))return false;
 if(a.sportId&&b.excludedSportIds?.includes(a.sportId)||b.sportId&&a.excludedSportIds?.includes(b.sportId))return false;
 if(a.courseId&&a.courseId===b.courseId&&a.sportId&&b.sportId&&a.sportId!==b.sportId)return false;
 return true;
}
export function scheduleWarnings(entries:ScheduleEntry[]){return new Set(entries.filter(a=>entries.some(b=>scheduleOverlap(a,b))).map(e=>e.id));}
